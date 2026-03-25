import { BadGatewayException } from '@nestjs/common';
import searchFriendsMarkdownHandler from './search_friends_markdown.handler';
import getMessageRecordsHandler from './get_message_records.handler';
import safePathHandler from './safe_path.handler';
import runBashHandler from './run_bash.handler';
import runReadHandler from './run_read.handler';
import runWriteHandler from './run_write.handler';
import todoHandler from './todo.handler';
import taskCreateHandler from './task_create.handler';
import taskGetHandler from './task_get.handler';
import taskListHandler from './task_list.handler';
import taskUpdateHandler from './task_update.handler';
import { ToolHandler, ToolHandlerDeps } from './types';

const TOOL_HANDLER_MAP: Record<string, ToolHandler> = {
  search_friends_markdown: searchFriendsMarkdownHandler,
  get_message_records: getMessageRecordsHandler,
  safe_path: safePathHandler,
  run_bash: runBashHandler,
  run_read: runReadHandler,
  run_write: runWriteHandler,
  todo: todoHandler,
  task_create: taskCreateHandler,
  task_get: taskGetHandler,
  task_list: taskListHandler,
  task_update: taskUpdateHandler,
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
