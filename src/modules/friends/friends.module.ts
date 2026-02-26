import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { Friend, FriendSchema } from 'src/schema/friend.schema';
import {
  FriendNotification,
  FriendNotificationSchema,
} from 'src/schema/friend-notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Friend.name, schema: FriendSchema },
      { name: FriendNotification.name, schema: FriendNotificationSchema },
    ]),
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
