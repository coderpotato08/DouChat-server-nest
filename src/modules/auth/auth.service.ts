import { Injectable } from '@nestjs/common';
import { AuthLoginDto, AuthRegisterDto } from './dto/auth';
import { UserService } from '../users/user.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}
  async login(username: string, password: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new Error('user not found');
    }
    return user;
  }

  async register(authDto: AuthRegisterDto) {
    return (
      'from register' + authDto.nickname + authDto.phoneNumber + authDto.email
    );
  }
}
