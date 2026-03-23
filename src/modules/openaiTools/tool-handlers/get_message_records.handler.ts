import { ToolHandler, ToolHandlerDeps } from './types';

type GetMessageRecordsArgs = {
  userId?: string;
  startTime?: string;
  endTime?: string;
  fileName?: string;
  format?: 'json' | 'md';
};

const getMessageRecordsHandler: ToolHandler = async function handleTool(
  rawArgs: string,
  deps: ToolHandlerDeps,
): Promise<string> {
  let args: GetMessageRecordsArgs;

  try {
    args = JSON.parse(rawArgs || '{}') as GetMessageRecordsArgs;
  } catch {
    return 'Failed to parse tool arguments as JSON.';
  }

  if (!args.userId) {
    return 'Invalid arguments. Expected { userId: string, startTime?: string, endTime?: string, fileName?: string, format?: "json" | "md" }.';
  }

  const result = await deps.openAiToolsService.getMessageRecords({
    userId: args.userId,
    startTime: args.startTime,
    endTime: args.endTime,
    fileName: args.fileName,
    format: args.format,
  });

  return JSON.stringify(result);
};

export default getMessageRecordsHandler;
