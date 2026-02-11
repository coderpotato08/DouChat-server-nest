import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { UserQueryDto } from './dto/user.query';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/loadUserInfo')
  findUserById(
    @Body(new ValidationPipe({ transform: true })) body: UserQueryDto,
  ) {
    return this.userService.findUserById(body.userId);
  }
}
