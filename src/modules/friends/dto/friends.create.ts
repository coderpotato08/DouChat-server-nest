import { IsNotEmpty, IsString } from 'class-validator';
import { IsObjectId } from 'src/decorator/is-objectid.decorator';

export class FriendsCreateDto {
  @IsNotEmpty({ message: 'userId不能为空' })
  @IsString()
  @IsObjectId({ message: 'userId必须是有效的ObjectId' })
  userId: string;

  @IsNotEmpty({ message: 'friendId不能为空' })
  @IsString()
  @IsObjectId({ message: 'friendId必须是有效的ObjectId' })
  friendId: string;
}
