import { ResponseCode } from "src/enum/response.enum";

export type CommonResponse<T> = {
  code: ResponseCode | string;
  data: T;
  message: string;
};