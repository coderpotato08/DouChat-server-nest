import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthRegisterDto } from './dto/auth';
import { UserService } from '../users/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}
  async login(username: string, password: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException();
    }
    if (user.password !== password) {
      throw new UnauthorizedException();
    }
    const payload = { username: user.username, sub: user._id };
    const access_token = await this.jwtService.signAsync(payload);
    return {
      access_token,
    };
  }

  async register(authDto: AuthRegisterDto) {
    return (
      'from register' + authDto.nickname + authDto.phoneNumber + authDto.email
    );
  }
}
