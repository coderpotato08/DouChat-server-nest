import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('拦截器执行之前');
    return next.handle().pipe(
      map((data) => {
        console.log('拦截器执行之后', data); 
        return data;
      }),
    );
  }
}
