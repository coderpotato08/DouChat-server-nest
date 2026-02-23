import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendsService } from './friends.service';
import { Friend, FriendSchema } from './schema/friend.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Friend.name, schema: FriendSchema }]),
  ],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
