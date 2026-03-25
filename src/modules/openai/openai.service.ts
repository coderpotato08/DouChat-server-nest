import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAiChatDto } from './dto/openai.chat';
import OpenAI from 'openai';
import { Observable } from 'rxjs';
import { OpenAiToolsService } from '../openaiTools/openaiTools.service';
import { loadChatCompletionTools } from '../openaiTools/tool-definitions.loader';
import { executeToolHandler } from '../openaiTools/tool-handlers/handler-map';
import { resolve } from 'node:path';

const WORKSPACE = resolve(__dirname, '../../../');
type OpenAiChatStreamEvent = {
  type: 'start' | 'progress' | 'delta' | 'done';
  content?: string;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

@Injectable()
export class OpenAiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly openAiToolsService: OpenAiToolsService,
  ) {}

  completion(payload: OpenAiChatDto): Observable<OpenAiChatStreamEvent> {
    return new Observable<OpenAiChatStreamEvent>((subscriber) => {
      const abortController = new AbortController();

      (async () => {
        const apiKey = this.configService.get<string>('openai.apiKey');
        const baseUrl = this.configService.get<string>('openai.baseUrl');
        const model =
          payload.model ||
          (this.configService.get<string>('openai.model') as string);

        if (!baseUrl) {
          subscriber.error(
            new InternalServerErrorException(
              'OpenAI base URL is not configured',
            ),
          );
          return;
        }
        if (!apiKey) {
          subscriber.error(
            new InternalServerErrorException(
              'OpenAI API key is not configured',
            ),
          );
          return;
        }

        const client = new OpenAI({
          apiKey,
          baseURL: baseUrl,
        });

        const baseMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
          [
            {
              role: 'system',
              content:
                payload.systemPrompt ||
                `You are a coding agent at ${WORKSPACE}. Use the todo tool to plan multi-step tasks. Mark in_progress before starting, completed when done. Prefer tools over prose.`,
            },
            {
              role: 'user',
              content: payload.prompt,
            },
          ];

        let usage:
          | {
              prompt_tokens?: number;
              completion_tokens?: number;
              total_tokens?: number;
            }
          | undefined;
        const maxToolRounds = 8;

        const toolDefinitions = await loadChatCompletionTools((progress) => {
          subscriber.next({
            type: 'progress',
            model,
            content: `[tool-loader/${progress.stage}] ${progress.message}`,
          });
        });

        const loopMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
          [...baseMessages];
        let stream: Awaited<ReturnType<typeof client.chat.completions.create>>;
        let reachedNoToolRound = false;

        subscriber.next({
          type: 'start',
          model,
        });

        for (let round = 0; round < maxToolRounds; round += 1) {
          let completion: Awaited<
            ReturnType<typeof client.chat.completions.create>
          >;

          try {
            completion = await client.chat.completions.create(
              {
                model,
                stream: false,
                max_tokens: payload.maxTokens,
                messages: loopMessages,
                tool_choice: 'auto',
                tools: toolDefinitions,
              },
              { signal: abortController.signal },
            );
          } catch (error) {
            console.error('[openai.completion] completion request failed', {
              round,
              error,
            });
            if (error instanceof OpenAI.APIError) {
              subscriber.error(
                new BadGatewayException(
                  `OpenAI request failed (${error.status ?? 'unknown'}): ${error.message}`,
                ),
              );
              return;
            }
            subscriber.error(new BadGatewayException('OpenAI request failed'));
            return;
          }

          usage = completion.usage
            ? {
                prompt_tokens: completion.usage.prompt_tokens,
                completion_tokens: completion.usage.completion_tokens,
                total_tokens: completion.usage.total_tokens,
              }
            : usage;

          const assistantMessage = completion.choices?.[0]?.message;
          const toolCalls = assistantMessage?.tool_calls ?? [];

          if (!toolCalls.length) {
            reachedNoToolRound = true;
            break;
          }

          if (assistantMessage) {
            loopMessages.push({
              role: 'assistant',
              content: assistantMessage.content,
              tool_calls: assistantMessage.tool_calls,
            });
          }

          subscriber.next({
            type: 'progress',
            model,
            content: `[use tool] round ${round + 1} executing tool call(s) ${toolCalls.map((tc) => (tc as any).function.name).join(', ')}`,
          });

          const calledToolNames = new Set<string>();
          for (const toolCall of toolCalls) {
            if (toolCall.type !== 'function') {
              continue;
            }

            calledToolNames.add(toolCall.function.name);
            console.log(`[tool-call] executing tool: ${toolCall.function.name}`);
            const toolResult = await executeToolHandler(
              toolCall.function.name,
              toolCall.function.arguments,
              {
                openAiToolsService: this.openAiToolsService,
              },
            );
            console.log(`[tool-call] tool result: ${toolResult.length > 500 ? toolResult.slice(0, 500) + '... (truncated)' : toolResult}`);
            loopMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: toolResult,
            });
          }

          const requiresMessageRecordSummary = calledToolNames.has(
            'get_message_records',
          );
          const requiresFriendsTable = calledToolNames.has(
            'search_friends_markdown',
          );
        }

        if (!reachedNoToolRound) {
          subscriber.next({
            type: 'progress',
            model,
            content: `[tool-loop] reached max rounds (${maxToolRounds}), generating final answer from current context`,
          });
        }

        const finalMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
          [
            ...loopMessages,
            {
              role: 'user',
              content:
                '请基于上面的对话和工具结果给出最终答案，不要再次调用任何工具。',
            },
          ];

        try {
          stream = await client.chat.completions.create(
            {
              model,
              stream: true,
              max_tokens: payload.maxTokens,
              messages: finalMessages,
            },
            { signal: abortController.signal },
          );
        } catch (error) {
          console.error(
            '[openai.completion] final stream request failed',
            error,
          );
          if (error instanceof OpenAI.APIError) {
            subscriber.error(
              new BadGatewayException(
                `OpenAI final stream request failed (${error.status ?? 'unknown'}): ${error.message}`,
              ),
            );
            return;
          }
          subscriber.error(
            new BadGatewayException('OpenAI final stream request failed'),
          );
          return;
        }
        let finalContent = '';
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              finalContent += delta;
              subscriber.next({
                type: 'delta',
                content: delta,
                model: chunk.model || model,
              });
            }
            if (chunk.usage) {
              usage = {
                prompt_tokens: chunk.usage.prompt_tokens,
                completion_tokens: chunk.usage.completion_tokens,
                total_tokens: chunk.usage.total_tokens,
              };
            }
          }
        } catch (error) {
          console.error('[openai.completion] final stream failed', error);
          if (error instanceof OpenAI.APIError) {
            subscriber.error(
              new BadGatewayException(
                `OpenAI final stream failed (${error.status ?? 'unknown'}): ${error.message}`,
              ),
            );
            return;
          }
          subscriber.error(
            new BadGatewayException('OpenAI final stream failed'),
          );
          return;
        }

        subscriber.next({
          type: 'done',
          model,
          usage,
        });
        console.log('[openai.completion] done with tool follow-up', {
          finalContent,
          usage,
        });
        subscriber.complete();
      })().catch(() => {
        console.error(
          '[openai.completion] unexpected failure in completion task',
        );
        subscriber.error(new BadGatewayException('OpenAI stream failed'));
      });

      return () => {
        abortController.abort();
      };
    });
  }
}
