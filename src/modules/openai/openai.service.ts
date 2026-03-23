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
                (payload.systemPrompt ||
                  'You are a helpful assistant. Use tools when needed.') +
                ' If tools are provided, do not claim you cannot access data. You must call tools first and answer based on tool results.',
            },
            {
              role: 'user',
              content: payload.prompt,
            },
          ];

        let stream: Awaited<ReturnType<typeof client.chat.completions.create>>;
        let usage:
          | {
              prompt_tokens?: number;
              completion_tokens?: number;
              total_tokens?: number;
            }
          | undefined;

        const toolDefinitions = await loadChatCompletionTools((progress) => {
          subscriber.next({
            type: 'progress',
            model,
            content: `[tool-loader/${progress.stage}] ${progress.message}`,
          });
        });
        console.log('[openai.completion] loaded tool definitions', {
          count: toolDefinitions.length,
          names: toolDefinitions
            .map((tool) =>
              tool.type === 'function' ? tool.function.name : 'unknown',
            )
            .filter(Boolean),
        });

        let firstCompletion: Awaited<
          ReturnType<typeof client.chat.completions.create>
        >;

        try {
          firstCompletion = await client.chat.completions.create(
            {
              model,
              stream: false,
              max_tokens: payload.maxTokens,
              messages: baseMessages,
              tool_choice: 'auto',
              tools: toolDefinitions,
            },
            { signal: abortController.signal },
          );
          console.log('[openai.completion] first completion received');
        } catch (error) {
          console.error('[openai.completion] first completion failed', error);
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

        const assistantMessage = firstCompletion.choices?.[0]?.message;
        const toolCalls = assistantMessage?.tool_calls ?? [];
        console.log('[openai.completion] first message summary', {
          hasAssistantMessage: !!assistantMessage,
          toolCallCount: toolCalls.length,
          finishReason: firstCompletion.choices?.[0]?.finish_reason,
        });

        const followupMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
          [...baseMessages];

        if (assistantMessage) {
          followupMessages.push({
            role: 'assistant',
            content: assistantMessage.content,
            tool_calls: assistantMessage.tool_calls,
          });
        }

        if (toolCalls.length) {
          console.log('[openai.completion] tool calls detected');
          for (const toolCall of toolCalls) {
            if (toolCall.type !== 'function') {
              console.log('[openai.completion] skip non-function tool call', {
                toolCallId: toolCall.id,
                toolType: toolCall.type,
              });
              continue;
            }

            let toolResult = 'Unsupported tool';
            console.log('[openai.completion] processing tool call', {
              toolName: toolCall.function.name,
              toolCallId: toolCall.id,
            });
            console.log('[openai.completion] executing tool', {
              toolName: toolCall.function.name,
              toolCallId: toolCall.id,
            });
            toolResult = await executeToolHandler(
              toolCall.function.name,
              toolCall.function.arguments,
              {
                openAiToolsService: this.openAiToolsService,
              },
            );

            followupMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: toolResult,
            });
            console.log('[openai.completion] tool message appended', {
              toolCallId: toolCall.id,
              toolName: toolCall.function.name,
              content: toolResult,
            });
          }

          followupMessages.push({
            role: 'user',
            content:
              '请严格基于上面的工具返回结果作答。必须输出分析结论，并附上 username、phoneNumber、email 三列的 markdown 表格；禁止说无法访问数据库或API。',
          });
        }

        subscriber.next({
          type: 'start',
          model,
        });

        if (!toolCalls.length) {
          console.log(
            '[openai.completion] no tool call, return first response',
          );
          const content = assistantMessage?.content;
          if (content) {
            subscriber.next({
              type: 'delta',
              content,
              model,
            });
          }

          usage = firstCompletion.usage
            ? {
                prompt_tokens: firstCompletion.usage.prompt_tokens,
                completion_tokens: firstCompletion.usage.completion_tokens,
                total_tokens: firstCompletion.usage.total_tokens,
              }
            : undefined;

          subscriber.next({
            type: 'done',
            model,
            usage,
          });
          console.log('[openai.completion] done without tool follow-up', {
            usage,
          });
          subscriber.complete();
          return;
        }

        try {
          console.log('[openai.completion] request messages (follow-up)', {
            messages: followupMessages,
          });
          stream = await client.chat.completions.create(
            {
              model,
              stream: true,
              max_tokens: payload.maxTokens,
              messages: followupMessages,
            },
            { signal: abortController.signal },
          );
          console.log('[openai.completion] follow-up stream started');
        } catch (error) {
          console.error('[openai.completion] follow-up request failed', error);
          if (error instanceof OpenAI.APIError) {
            subscriber.error(
              new BadGatewayException(
                `OpenAI follow-up request failed (${error.status ?? 'unknown'}): ${error.message}`,
              ),
            );
            return;
          }
          subscriber.error(
            new BadGatewayException('OpenAI follow-up request failed'),
          );
          return;
        }

        try {
          let responseFinalContent = '';
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              responseFinalContent += delta;
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
          console.log('[openai.completion] follow-up stream completed', {
            content: responseFinalContent,
          });
        } catch (error) {
          console.error('[openai.completion] stream failed', error);
          if (error instanceof OpenAI.APIError) {
            subscriber.error(
              new BadGatewayException(
                `OpenAI stream failed (${error.status ?? 'unknown'}): ${error.message}`,
              ),
            );
            return;
          }
          subscriber.error(new BadGatewayException('OpenAI stream failed'));
          return;
        }

        subscriber.next({
          type: 'done',
          model,
          usage,
        });
        console.log('[openai.completion] done with tool follow-up', {
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
