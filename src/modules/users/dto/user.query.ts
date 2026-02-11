import { IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UserQueryDto {
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  userId: string;
}
