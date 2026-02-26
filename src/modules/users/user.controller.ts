import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserQueryDto, SearchUserDto } from './dto/user.query';
import { ConfigService } from '@nestjs/config';
import { JwtGuard } from 'src/guards/jwt.guard';
import { JsonTransform } from 'src/decorator/json-transform';
import { User } from '../../schema/user.schema';
import { FriendsCreateDto } from '../friends/dto/friends.create';
import { FriendsService } from '../friends/friends.service';

@Controller('user')
// @UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly friendsService: FriendsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('/loadUserInfo')
  @JsonTransform(User)
  findUserById(
    @Body(new ValidationPipe({ transform: true })) body: UserQueryDto,
  ) {
    return this.userService.findUserById(body.userId!);
  }

  @Post('/searchUser')
  /**
   * 非常重要的知识点
   * 1. 装饰器的执行顺序是由下到上执行的
   * 2. @UseGuards 可以传递多个守卫，执行顺序则是从前往后依次执行，如果前面的Guard没有通过，后面的Guard也不会执行
   */
  // @UseGuards(JwtGuard)
  searchUser(
    @Body(new ValidationPipe({ transform: true })) body: SearchUserDto,
    /** jwtModule会在req中注入user，也就是jwt中的payload信息
     *  在jwtStrategy中会解析并校验payload
     */
  ) {
    return this.userService.searchUser(body.keyWord, body.currUserId);
  }


  @Post('add-friend')
  async addFriend(@Body() addFriendDto: FriendsCreateDto) {
    const { userId, friendId } = addFriendDto;
    return this.friendsService.addFriend(userId, friendId);
  }
}
