import { ToolHandler, ToolHandlerDeps } from './types';

type RunReadArgs = {
  filePath?: string;
  startLine?: number;
  endLine?: number;
};

const runReadHandler: ToolHandler = async function handleTool(
  rawArgs: string,
  deps: ToolHandlerDeps,
): Promise<string> {
  let args: RunReadArgs;

  try {
    args = JSON.parse(rawArgs || '{}') as RunReadArgs;
  } catch {
    return 'Failed to parse tool arguments as JSON.';
  }

  if (!args.filePath) {
    return 'Invalid arguments. Expected { filePath: string, startLine?: number, endLine?: number }.';
  }

  const result = await deps.openAiToolsService.runRead({
    filePath: args.filePath,
    startLine: args.startLine,
    endLine: args.endLine,
  });

  return JSON.stringify(result);
};

export default runReadHandler;
