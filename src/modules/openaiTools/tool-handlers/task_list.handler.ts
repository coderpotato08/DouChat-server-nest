import { ToolHandler, ToolHandlerDeps } from './types';

const taskListHandler: ToolHandler = async function handleTool(
  _rawArgs: string,
  deps: ToolHandlerDeps,
): Promise<string> {
  return await deps.openAiToolsService.taskList();
};

export default taskListHandler;
