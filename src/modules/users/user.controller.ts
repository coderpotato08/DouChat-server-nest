import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { UserQueryDto } from './dto/user.query';
import { ConfigService } from '@nestjs/config';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Post('/loadUserInfo')
  findUserById(
    @Body(new ValidationPipe({ transform: true })) body: UserQueryDto,
  ) {
    console.log('dbData', this.configService.get('db'));
    return this.userService.findUserById(body.userId);
  }
}
