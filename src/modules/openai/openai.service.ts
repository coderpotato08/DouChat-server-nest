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

type OpenAiChatStreamEvent = {
  type: 'start' | 'delta' | 'done';
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
                'You are a helpful assistant. Use tools when needed.',
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

        const toolDefinition: OpenAI.Chat.Completions.ChatCompletionTool = {
          type: 'function',
          function: {
            name: 'search_friends_markdown',
            description:
              'Search current user friends and return a markdown table with username, phoneNumber and email.',
            parameters: {
              type: 'object',
              properties: {
                keyWord: {
                  type: 'string',
                  description:
                    'Keyword used for fuzzy search by nickname or username.',
                },
                currUserId: {
                  type: 'string',
                  description: 'Current user id in Mongo ObjectId format.',
                },
              },
              required: ['keyWord', 'currUserId'],
              additionalProperties: false,
            },
          },
        };

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
              tools: [toolDefinition],
            },
            { signal: abortController.signal },
          );
        } catch (error) {
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
          for (const toolCall of toolCalls) {
            if (toolCall.type !== 'function') {
              continue;
            }

            let toolResult = 'Unsupported tool';

            if (toolCall.function.name === 'search_friends_markdown') {
              try {
                const args = JSON.parse(
                  toolCall.function.arguments || '{}',
                ) as {
                  keyWord?: string;
                  currUserId?: string;
                };

                if (args.keyWord && args.currUserId) {
                  const result =
                    await this.openAiToolsService.searchFriendsAsMarkdown({
                      keyWord: args.keyWord,
                      currUserId: args.currUserId,
                    });
                  toolResult = result.markdown;
                } else {
                  toolResult =
                    'Invalid arguments. Expected { keyWord: string, currUserId: string }.';
                }
              } catch {
                toolResult = 'Failed to parse tool arguments as JSON.';
              }
            }

            followupMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: toolResult,
            });
          }
        }

        subscriber.next({
          type: 'start',
          model,
        });

        if (!toolCalls.length) {
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
          subscriber.complete();
          return;
        }

        try {
          stream = await client.chat.completions.create(
            {
              model,
              stream: true,
              max_tokens: payload.maxTokens,
              messages: followupMessages,
            },
            { signal: abortController.signal },
          );
        } catch (error) {
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
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
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
        subscriber.complete();
      })().catch(() => {
        subscriber.error(new BadGatewayException('OpenAI stream failed'));
      });

      return () => {
        abortController.abort();
      };
    });
  }
}
