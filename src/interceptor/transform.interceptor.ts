import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { map, Observable } from 'rxjs';
import { JSON_TRANSFORM_METADATA_KEY } from 'src/constants/meta-data';
import { CommonResponse } from 'src/constants/response';
import { ResponseCode } from 'src/enum/response.enum';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  CommonResponse<T>
> {
  @Inject()
  private reflector: Reflector;
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<CommonResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        const jsonTransform = this.reflector.get(
          JSON_TRANSFORM_METADATA_KEY,
          context.getHandler(),
        ) || [];
        const [transformSchema, transformOptions] = jsonTransform;
        if (transformSchema && data) {
          data = plainToInstance(transformSchema, data, transformOptions);
        }
        if (isFormattedResponse(data)) {
          return data as CommonResponse<T>;
        }
        return {
          code: ResponseCode.SUCCESS,
          data: data as T,
          message: '',
        };
      }),
    );
  }
}

function isFormattedResponse(
  payload: unknown,
): payload is CommonResponse<unknown> {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  return 'code' in payload && 'data' in payload && 'message' in payload;
}
