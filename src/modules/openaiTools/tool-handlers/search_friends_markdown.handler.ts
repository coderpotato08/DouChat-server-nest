import { ToolHandler, ToolHandlerDeps } from './types';

type SearchFriendsArgs = {
  keyWord?: string;
  currUserId?: string;
};

const searchFriendsMarkdownHandler: ToolHandler = async function handleTool(
  rawArgs: string,
  deps: ToolHandlerDeps,
): Promise<string> {
  let args: SearchFriendsArgs;

  try {
    args = JSON.parse(rawArgs || '{}') as SearchFriendsArgs;
  } catch {
    return 'Failed to parse tool arguments as JSON.';
  }

  if (!args.keyWord || !args.currUserId) {
    return 'Invalid arguments. Expected { keyWord: string, currUserId: string }.';
  }

  const result = await deps.openAiToolsService.searchFriendsAsMarkdown({
    keyWord: args.keyWord,
    currUserId: args.currUserId,
  });

  return result.markdown;
};

export default searchFriendsMarkdownHandler;
