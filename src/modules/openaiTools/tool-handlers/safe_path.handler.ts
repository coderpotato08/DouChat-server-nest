import { ToolHandler, ToolHandlerDeps } from './types';

type SafePathArgs = {
  inputPath?: string;
  sandboxRoot?: string;
};

const safePathHandler: ToolHandler = async function handleTool(
  rawArgs: string,
  deps: ToolHandlerDeps,
): Promise<string> {
  let args: SafePathArgs;

  try {
    args = JSON.parse(rawArgs || '{}') as SafePathArgs;
  } catch {
    return 'Failed to parse tool arguments as JSON.';
  }
  
  if (!args.inputPath || !args.sandboxRoot) {
    return 'Invalid arguments. Expected { inputPath: string, sandboxRoot: string }.';
  }

  const result = await deps.openAiToolsService.safePath({
    inputPath: args.inputPath,
    sandboxRoot: args.sandboxRoot,
  });

  return result;
};

export default safePathHandler;
