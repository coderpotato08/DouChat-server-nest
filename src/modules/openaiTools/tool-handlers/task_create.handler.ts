import { ToolHandler, ToolHandlerDeps } from './types';

type TaskCreateArgs = {
  subject?: string;
  description?: string;
};

const taskCreateHandler: ToolHandler = async function handleTool(
  rawArgs: string,
  deps: ToolHandlerDeps,
): Promise<string> {
  let args: TaskCreateArgs;

  try {
    args = JSON.parse(rawArgs || '{}') as TaskCreateArgs;
  } catch {
    return 'Failed to parse tool arguments as JSON.';
  }

  if (!args.subject) {
    return 'Invalid arguments. Expected { subject: string }.';
  }

  const result = await deps.openAiToolsService.taskCreate(
    args.subject,
    args.description || 'no description',
  );
  return JSON.stringify(result);
};

export default taskCreateHandler;
