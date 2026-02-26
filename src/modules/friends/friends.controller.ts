import { Controller } from '@nestjs/common';
import { FriendsService } from './friends.service';

@Controller('friends')
// @UseGuards(JwtGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}
}
