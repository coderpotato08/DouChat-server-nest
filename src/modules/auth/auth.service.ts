import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthLoginDto, AuthRegisterDto } from './dto/auth';
import { UserService } from '../users/user.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/schema/user.schema';

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
    const payload = { username: user.username, sub: (user as User & { _id: string })._id };
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
