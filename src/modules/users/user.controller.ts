import { Body, Controller, Post, Req, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { UserQueryDto, SearchUserDto } from './dto/user.query';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../guards/admin/admin.guard';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Post('/loadUserInfo')
  @UseGuards(AdminGuard)
  findUserById(
    @Body(new ValidationPipe({ transform: true })) body: Partial<UserQueryDto>,
  ) {
    return this.userService.findUserById(body.userId!);
  }

  @Post('/searchUser')
  /**
   * 非常重要的知识点
   * 1. 装饰器的执行顺序是由下到上执行的
   * 2. @UseGuards 可以传递多个守卫，执行顺序则是从前往后依次执行，如果前面的Guard没有通过，后面的Guard也不会执行
   */
  @UseGuards(AdminGuard, AuthGuard('jwt'))
  searchUser(
    @Body(new ValidationPipe({ transform: true })) body: SearchUserDto,
    /** jwtModule会在req中注入user，也就是jwt中的payload信息
     *  在jwtStrategy中会解析并校验payload
     */
    @Req() req: Request,
  ) {
    console.log((req as any).user)
    return this.userService.searchUser(body.keyWord, body.currUserId);
  }
}
