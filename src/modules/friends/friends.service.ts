import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Friend, FriendDocument } from 'src/schema/friend.schema';
import {
  FriendNotification,
  FriendNotificationDocument,
} from 'src/schema/friend-notification.schema';
import { Model, Types } from 'mongoose';
import { ApplyStatusEnum } from 'src/enum/response.enum';
import { ErrorMessage } from 'src/constants/error-codes';

@Injectable()
export class FriendsService {
  constructor(
    @InjectModel(Friend.name) private friendModel: Model<FriendDocument>,
    @InjectModel(FriendNotification.name)
    private friendNotificationModel: Model<FriendNotificationDocument>,
  ) {}

  async findFriendRelation(
    userId: string,
    friendId: string,
  ): Promise<Friend | null> {
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

  async addFriend(userId: string, friendId: string) {
    const filter = {
      $or: [
        { userId: new Types.ObjectId(userId), friendId: new Types.ObjectId(friendId) },
        { userId: new Types.ObjectId(friendId), friendId: new Types.ObjectId(userId) },
      ],
    };
    const relationship = await this.friendNotificationModel.findOne(filter);
    if (relationship) {
      if (relationship.status === ApplyStatusEnum.APPLYING) {
        return {
          status: 'success',
          message: ErrorMessage.Friends.ALREADY_APPLYING,
        };
      } else if (relationship.status === ApplyStatusEnum.REJECTED) {
        await this.friendNotificationModel.updateOne(filter, {
          status: ApplyStatusEnum.APPLYING,
          applyTime: new Date(),
        });
        return {
          status: 'success',
          message: ErrorMessage.Friends.APPLY_SUCCESS,
        };
      }
    } else {
      await this.friendNotificationModel.create({
        userId,
        friendId,
        status: ApplyStatusEnum.APPLYING,
      });
      return {
        status: 'success',
        message: ErrorMessage.Friends.APPLY_SUCCESS,
      };
    }
  }
}
