import { ToolHandler, ToolHandlerDeps } from './types';

type TaskGetArgs = {
  taskId?: number;
};

const taskGetHandler: ToolHandler = async function handleTool(
  rawArgs: string,
  deps: ToolHandlerDeps,
): Promise<string> {
  let args: TaskGetArgs;

  try {
    args = JSON.parse(rawArgs || '{}') as TaskGetArgs;
  } catch {
    return 'Failed to parse tool arguments as JSON.';
  }

  if (!Number.isInteger(args.taskId) || (args.taskId as number) <= 0) {
    return 'Invalid arguments. Expected { taskId: integer > 0 }.';
  }

  const result = await deps.openAiToolsService.taskGet(args.taskId as number);
  return JSON.stringify(result);
};

export default taskGetHandler;
