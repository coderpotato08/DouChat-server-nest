import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import OpenAI from 'openai';

type ToolLoadProgress = {
  stage: 'start' | 'read' | 'parse' | 'validate' | 'done' | 'error';
  message: string;
  detail?: unknown;
};

type ProgressReporter = (progress: ToolLoadProgress) => void;

function isFunctionTool(
  value: unknown,
): value is OpenAI.Chat.Completions.ChatCompletionTool {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const tool = value as {
    type?: unknown;
    function?: {
      name?: unknown;
    };
  };

  return tool.type === 'function' && typeof tool.function?.name === 'string';
}

export async function loadChatCompletionTools(
  onProgress?: ProgressReporter,
): Promise<OpenAI.Chat.Completions.ChatCompletionTool[]> {
  const filePath = resolve(
    process.cwd(),
    'src/modules/openaiTools/config/tool-definitions.json',
  );

  onProgress?.({
    stage: 'start',
    message: 'start loading tool definitions',
    detail: { filePath },
  });

  try {
    onProgress?.({
      stage: 'read',
      message: 'reading tool definition file',
      detail: { filePath },
    });
    const raw = await readFile(filePath, 'utf-8');
    onProgress?.({
      stage: 'parse',
      message: 'parsing tool definition json',
    });
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      onProgress?.({
        stage: 'error',
        message: 'tool definition json is not an array',
      });
      return [];
    }

    onProgress?.({
      stage: 'validate',
      message: 'validating function tools',
      detail: { total: parsed.length },
    });
    const tools = parsed.filter(isFunctionTool);
    onProgress?.({
      stage: 'done',
      message: 'tool definitions loaded',
      detail: { total: parsed.length, valid: tools.length },
    });
    return tools;
  } catch {
    onProgress?.({
      stage: 'error',
      message: 'failed to load tool definitions, use empty list',
      detail: { filePath },
    });
    return [];
  }
}
