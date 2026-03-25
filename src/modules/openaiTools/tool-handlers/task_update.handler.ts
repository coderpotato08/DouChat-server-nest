import { ToolHandler, ToolHandlerDeps } from './types';

type TaskUpdateArgs = {
  taskId?: number;
  status?: 'pending' | 'in_progress' | 'completed' | string;
  addBlockedBy?: number[];
  addBlocks?: number[];
};

const taskUpdateHandler: ToolHandler = async function handleTool(
  rawArgs: string,
  deps: ToolHandlerDeps,
): Promise<string> {
  let args: TaskUpdateArgs;

  try {
    args = JSON.parse(rawArgs || '{}') as TaskUpdateArgs;
  } catch {
    return 'Failed to parse tool arguments as JSON.';
  }

  if (!Number.isInteger(args.taskId) || (args.taskId as number) <= 0) {
    return 'Invalid arguments. Expected { taskId: integer > 0, status?: "pending" | "in_progress" | "completed", addBlockedBy?: number[], addBlocks?: number[] }.';
  }

  const hasStatus = typeof args.status === 'string' && args.status.length > 0;
  const status = hasStatus ? String(args.status).toLowerCase() : undefined;
  if (status && !['pending', 'in_progress', 'completed'].includes(status)) {
    return 'Invalid status. Expected one of: pending, in_progress, completed.';
  }

  const hasBlockedByUpdate = Array.isArray(args.addBlockedBy);
  const hasBlocksUpdate = Array.isArray(args.addBlocks);
  if (!hasStatus && !hasBlockedByUpdate && !hasBlocksUpdate) {
    return 'Invalid arguments. Provide at least one of: status, addBlockedBy, addBlocks.';
  }

  const result = await deps.openAiToolsService.taskUpdate(
    args.taskId as number,
    status as 'pending' | 'in_progress' | 'completed' | undefined,
    Array.isArray(args.addBlockedBy) ? args.addBlockedBy : undefined,
    Array.isArray(args.addBlocks) ? args.addBlocks : undefined,
  );

  return JSON.stringify(result);
};

export default taskUpdateHandler;
