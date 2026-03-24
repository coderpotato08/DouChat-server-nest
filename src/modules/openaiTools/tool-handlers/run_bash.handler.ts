import { ToolHandler, ToolHandlerDeps } from './types';

type RunBashArgs = {
  command?: string;
  cwd?: string;
  timeoutMs?: number;
};

const runBashHandler: ToolHandler = async function handleTool(
  rawArgs: string,
  deps: ToolHandlerDeps,
): Promise<string> {
  let args: RunBashArgs;

  try {
    args = JSON.parse(rawArgs || '{}') as RunBashArgs;
  } catch {
    return 'Failed to parse tool arguments as JSON.';
  }

  if (!args.command) {
    return 'Invalid arguments. Expected { command: string, cwd?: string, timeoutMs?: number }.';
  }

  const result = await deps.openAiToolsService.runBash({
    command: args.command,
    cwd: args.cwd,
    timeoutMs: args.timeoutMs,
  });

  return JSON.stringify(result);
};

export default runBashHandler;
