import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UserQueryDto {
  @IsString()
  @Type(() => String)
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;
}

export class SearchUserDto {
  @IsString()
  @IsNotEmpty()
  keyWord: string;

  @IsString()
  @IsNotEmpty()
  currUserId: string;
}