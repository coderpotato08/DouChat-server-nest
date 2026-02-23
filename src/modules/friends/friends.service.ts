import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Friend, FriendDocument } from './schema/friend.schema';
import { Model } from 'mongoose';

@Injectable()
export class FriendsService {
  constructor(@InjectModel(Friend.name) private friendModel: Model<FriendDocument>) {}

  async findFriendRelation(userId: string, friendId: string): Promise<Friend | null> {
    return this.friendModel
      .findOne({
        $or: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      })
      .lean()
      .exec();
  }
}
