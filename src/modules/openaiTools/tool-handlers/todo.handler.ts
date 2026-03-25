import { ToolHandler, ToolHandlerDeps } from './types';

type TodoItem = {
  id?: string;
  text?: string;
  status?: 'pending' | 'in_progress' | 'completed' | string;
};

type TodoArgs = {
  items?: TodoItem[];
};

const todoHandler: ToolHandler = async function handleTool(
  rawArgs: string,
  deps: ToolHandlerDeps,
): Promise<string> {
  let args: TodoArgs;

  try {
    args = JSON.parse(rawArgs || '{}') as TodoArgs;
  } catch {
    return 'Failed to parse tool arguments as JSON.';
  }

  if (!Array.isArray(args.items)) {
    return 'Invalid arguments. Expected { items: Array<{ id?: string, text: string, status?: "pending" | "in_progress" | "completed" }> }.';
  }

  return deps.openAiToolsService.todoUpdate(args.items);
};

export default todoHandler;
