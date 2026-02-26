import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseCode } from 'src/enum/response.enum';
import { CommonResponse } from 'src/constants/response';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    console.log('捕获到异常:', {
      status,
      exceptionResponse,
    });
    // 如果响应已经是 CommonResponse 格式（来自 ValidationPipe 的 exceptionFactory）
    if (
      typeof exceptionResponse === 'object' &&
      'code' in exceptionResponse &&
      'data' in exceptionResponse &&
      'message' in exceptionResponse
    ) {
      return response.status(status).json(exceptionResponse);
    }

    // 处理其他 HttpException
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'Internal server error';

    const result: CommonResponse<null> = {
      code:
        status === HttpStatus.INTERNAL_SERVER_ERROR
          ? ResponseCode.INTERNAL_SERVER_ERROR
          : ResponseCode.VALIDATION_ERROR,
      data: null,
      message: Array.isArray(message) ? message.join('; ') : message,
    };

    response.status(status).json(result);
  }
}
