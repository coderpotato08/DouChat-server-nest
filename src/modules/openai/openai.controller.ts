import {
  Body,
  Controller,
  HttpException,
  Post,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import { OpenAiService } from './openai.service';
import { OpenAiChatDto } from './dto/openai.chat';
import type { Response } from 'express';
import { Observable } from 'rxjs';

@Controller('openai')
export class OpenAiController {
  constructor(private readonly openAiService: OpenAiService) {}

  @Post('completion')
  completion(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    body: OpenAiChatDto,
    @Res() res: Response,
  ): void {
    this.streamPostSse(res, this.openAiService.completion(body));
  }

  private streamPostSse<T extends { type: string }>(
    res: Response,
    source$: Observable<T>,
  ): void {
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const subscription = source$.subscribe({
      next: (event) => {
        res.write(`event: ${event.type}\n`);
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      },
      error: (error: unknown) => {
        res.write('event: error\n');
        res.write(
          `data: ${JSON.stringify({ message: this.getErrorMessage(error) })}\n\n`,
        );
        res.end();
      },
      complete: () => {
        res.end();
      },
    });

    res.on('close', () => {
      subscription.unsubscribe();
    });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpException) {
      return (
        (error.getResponse() as { message?: string })?.message ||
        error.message ||
        'OpenAI stream failed'
      );
    }

    return 'OpenAI stream failed';
  }
}
