import { OpenAiToolsService } from '../openaiTools.service';

export interface ToolHandlerDeps {
  openAiToolsService: OpenAiToolsService;
}

export type ToolHandler = (
  rawArgs: string,
  deps: ToolHandlerDeps,
) => Promise<string>;
