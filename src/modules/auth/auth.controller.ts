import { Body, Controller } from '@nestjs/common';
import { Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthLoginDto, AuthRegisterDto } from './dto/auth';

@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {}
  @Post('login')
  login(@Body() authLoginDto: AuthLoginDto) {
    const { username, password } = authLoginDto;
    return this.authService.login(username, password);
  }

  @Post('register')
  register(@Body() authRegisterDto: AuthRegisterDto) {
    return this.authService.register(authRegisterDto);
  }
}
