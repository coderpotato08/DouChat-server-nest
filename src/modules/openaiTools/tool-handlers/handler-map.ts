import { BadGatewayException } from '@nestjs/common';
import searchFriendsMarkdownHandler from './search_friends_markdown.handler';
import getMessageRecordsHandler from './get_message_records.handler';
import { ToolHandler, ToolHandlerDeps } from './types';

const TOOL_HANDLER_MAP: Record<string, ToolHandler> = {
  search_friends_markdown: searchFriendsMarkdownHandler,
  get_message_records: getMessageRecordsHandler,
};

export async function executeToolHandler(
  toolName: string,
  rawArgs: string | undefined,
  deps: ToolHandlerDeps,
): Promise<string> {
  const handler = TOOL_HANDLER_MAP[toolName];
  if (!handler) {
    return `Unsupported tool: ${toolName}`;
  }

  try {
    return await handler(rawArgs || '{}', deps);
  } catch (error) {
    if (error instanceof Error) {
      return `Tool execution failed: ${error.message}`;
    }
    throw new BadGatewayException(`Tool execution failed: ${toolName}`);
  }
}
