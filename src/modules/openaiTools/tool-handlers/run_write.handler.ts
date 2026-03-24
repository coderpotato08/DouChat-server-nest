import { ToolHandler, ToolHandlerDeps } from './types';

type RunWriteArgs = {
  filePath?: string;
  content?: string;
  append?: boolean;
};

const runWriteHandler: ToolHandler = async function handleTool(
  rawArgs: string,
  deps: ToolHandlerDeps,
): Promise<string> {
  let args: RunWriteArgs;

  try {
    args = JSON.parse(rawArgs || '{}') as RunWriteArgs;
  } catch {
    return 'Failed to parse tool arguments as JSON.';
  }

  if (!args.filePath || typeof args.content !== 'string') {
    return 'Invalid arguments. Expected { filePath: string, content: string, append?: boolean }.';
  }

  const result = await deps.openAiToolsService.runWrite({
    filePath: args.filePath,
    content: args.content,
    append: args.append,
  });

  return JSON.stringify(result);
};

export default runWriteHandler;
