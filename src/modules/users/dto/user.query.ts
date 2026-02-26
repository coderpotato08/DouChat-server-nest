import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { IsObjectId } from 'src/decorator/is-objectid.decorator';

export class UserQueryDto {
  @IsString()
  @IsObjectId({ message: 'userId必须是有效的ObjectId' })
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
  @IsObjectId({ message: 'currUserId必须是有效的ObjectId' })
  currUserId: string;
}
