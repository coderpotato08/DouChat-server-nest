import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../../schema/user.schema';
import { Model } from 'mongoose';
import { FriendsService } from '../friends/friends.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly friendsService: FriendsService,
  ) {}

  async findUserById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).lean().exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).lean().exec();
  }

  async searchUser(
    keyWord: string,
    currUserId: string,
  ): Promise<{
    count: number;
    userList: Array<UserDocument & { isFriend: boolean }>;
  }> {
    const regex = new RegExp(keyWord, 'i');
    const userList = await this.userModel
      .find({
        $or: [{ nickname: regex }, { username: regex }],
      })
      .lean()
      .exec();

    const newUserList = await Promise.all(
      userList.map(async (userInfo: UserDocument) => {
        const existfriend = await this.friendsService.findFriendRelation(
          (userInfo as UserDocument)._id.toString(),
          currUserId,
        );
        return {
          ...userInfo,
          isFriend: !!existfriend,
        };
      }),
    );

    return {
      count: keyWord ? userList.length : 0,
      userList: keyWord
        ? (newUserList as Array<UserDocument & { isFriend: boolean }>)
        : [],
    };
  }
}
