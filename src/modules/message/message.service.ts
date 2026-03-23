import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventGateway } from '../event/event.gateway';
import { User, UserDocument } from 'src/schema/user.schema';
import {
  UserContact,
  UserContactDocument,
} from 'src/schema/user-contact.schema';
import {
  UserMessage,
  UserMessageDocument,
} from 'src/schema/user-message.schema';
import {
  GroupMessage,
  GroupMessageDocument,
} from 'src/schema/group-message.schema';
import {
  GroupMessageRead,
  GroupMessageReadDocument,
} from 'src/schema/group-message-read.schema';
import {
  GroupContact,
  GroupContactDocument,
} from 'src/schema/group-contact.schema';
import { Group, GroupDocument } from 'src/schema/group.schema';
import { GroupUser, GroupUserDocument } from 'src/schema/group-user.schema';
import { MessageTypeEnum } from 'src/types/shared.type';
import { formatMessageText, messageFilter } from 'src/utils/format';
import { ErrorMessage } from 'src/constants/error-codes';

type LoadMessageListParams = {
  fromId: string;
  toId: string;
  limitTime: string | number | Date;
  pageIndex?: number;
};

type LoadGroupMessageListParams = {
  groupId: string;
  limitTime: string | number | Date;
  pageIndex?: number;
};

type SearchListParams = {
  userId: string;
  keyword: string;
};

type SearchMatchUserMessageParams = {
  userId: string;
  friendId: string;
  keyword: string;
};

type SearchMatchGroupMessageParams = {
  groupId: string;
  keyword: string;
};

type AddGroupMessageUnreadParams = {
  groupId: string;
  userId: string;
  messageId: string;
};

type CleanGroupMessageUnreadParams = {
  groupId: string;
  userId: string;
  messageId?: string;
};

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(UserContact.name)
    private readonly userContactModel: Model<UserContactDocument>,
    @InjectModel(UserMessage.name)
    private readonly userMessageModel: Model<UserMessageDocument>,
    @InjectModel(GroupMessage.name)
    private readonly groupMessageModel: Model<GroupMessageDocument>,
    @InjectModel(GroupMessageRead.name)
    private readonly groupMessageReadModel: Model<GroupMessageReadDocument>,
    @InjectModel(GroupContact.name)
    private readonly groupContactModel: Model<GroupContactDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @InjectModel(GroupUser.name)
    private readonly groupUserModel: Model<GroupUserDocument>,
  ) {}

  async saveUserMessage(data: Record<string, unknown>) {
    const newMessage = await this.userMessageModel.create(data);
    return this.userMessageModel
      .findOne({ _id: newMessage._id })
      .populate({
        path: 'fromId',
        model: 'User',
        select: ['username', 'avatarImage'],
      })
      .populate({
        path: 'toId',
        model: 'User',
        select: ['username', 'avatarImage'],
      })
      .lean()
      .exec();
  }

  async loadMessageList(params: LoadMessageListParams) {
    const { fromId, toId, limitTime, pageIndex = 0 } = params;
    const pageSize = 20;
    const startTime = new Date(limitTime);

    try {
      const messageList = await this.userMessageModel
        .find({
          time: { $gt: startTime },
          $or: [
            { fromId, toId },
            { fromId: toId, toId: fromId },
          ],
        })
        .populate({
          path: 'fromId',
          model: 'User',
          select: ['username', 'avatarImage'],
        })
        .populate({
          path: 'toId',
          model: 'User',
          select: ['username', 'avatarImage'],
        })
        .sort({ time: -1 })
        .skip(pageIndex * pageSize)
        .limit(pageSize)
        .lean()
        .exec();

      return { messageList };
    } catch {
      throw new BadRequestException(ErrorMessage.Common.SERVER_ERROR);
    }
  }

  async loadGroupMessageList(params: LoadGroupMessageListParams) {
    const { groupId, limitTime, pageIndex = 0 } = params;
    const pageSize = 20;
    const startTime = new Date(limitTime);

    try {
      const messageList = await this.groupMessageModel
        .find({ groupId, time: { $gt: startTime } })
        .populate({
          path: 'fromId',
          model: 'User',
          select: ['username', 'avatarImage', 'nickname'],
        })
        .sort({ time: -1 })
        .skip(pageIndex * pageSize)
        .limit(pageSize)
        .lean()
        .exec();

      return { messageList };
    } catch {
      throw new BadRequestException(ErrorMessage.Common.SERVER_ERROR);
    }
  }

  async searchMessageList(params: SearchListParams) {
    const { userId, keyword } = params;

    try {
      const reg = new RegExp(`^${userId}`);
      const [userContactList, groupContactList] = await Promise.all([
        this.userContactModel
          .find({ contactId: reg }, null, { lean: true })
          .populate({
            path: 'users',
            model: 'User',
            select: ['nickname', 'username', 'avatarImage'],
          })
          .exec(),
        this.groupContactModel
          .find({ userId }, null, { lean: true })
          .populate({ path: 'groupId', model: 'Group' })
          .exec(),
      ]);

      const [matchedUserContactList, matchedGroupContactList] =
        await Promise.all([
          Promise.all(
            (userContactList as any[]).map(async (contact) => {
              const { users, createTime, contactId } = contact;
              const friendInfo =
                users[0]?._id?.toString() === userId ? users[1] : users[0];

              const messages = await this.userMessageModel.find(
                {
                  time: { $gt: createTime },
                  $or: [
                    { fromId: users[0]._id, toId: users[1]._id },
                    { fromId: users[1]._id, toId: users[0]._id },
                  ],
                },
                { msgContent: 1, time: 1, msgType: 1 },
              );

              const matchedMessages = messages
                .filter((message: any) => messageFilter(message, keyword))
                .map(({ msgContent, msgType }) =>
                  formatMessageText(msgContent, msgType),
                );

              return {
                chatId: contactId,
                createTime,
                friendInfo,
                matchedMessages,
              };
            }),
          ),
          Promise.all(
            (groupContactList as any[]).map(async (contact) => {
              const { groupId, createTime } = contact;
              const userList = await this.groupUserModel
                .find({ groupId }, { userId: 1 }, { lean: true })
                .populate({
                  path: 'userId',
                  model: 'User',
                  select: ['avatarImage'],
                })
                .limit(4)
                .exec();

              const messages = await this.groupMessageModel.find(
                {
                  time: { $gt: createTime },
                  msgType: { $ne: MessageTypeEnum.TIPS },
                  groupId,
                },
                { msgContent: 1, time: 1, msgType: 1 },
              );

              const matchedMessages = messages
                .filter((message: any) => messageFilter(message, keyword))
                .map(({ msgContent, msgType }) =>
                  formatMessageText(msgContent, msgType),
                );

              return {
                chatId: groupId._id,
                createTime,
                groupInfo: {
                  ...contact.groupId,
                  usersAvaterList: userList
                    .slice(0, 4)
                    .map((item: any) => item.userId.avatarImage),
                },
                matchedMessages,
              };
            }),
          ),
        ]);

      const contactList = [
        ...matchedUserContactList.filter(
          (contact: any) => contact.matchedMessages.length > 0,
        ),
        ...matchedGroupContactList.filter(
          (contact: any) => contact.matchedMessages.length > 0,
        ),
      ].sort(
        (a: any, b: any) =>
          new Date(a.createTime).getTime() - new Date(b.createTime).getTime(),
      );

      return contactList;
    } catch {
      throw new BadRequestException(ErrorMessage.Common.SERVER_ERROR);
    }
  }

  async searchMatchUserMessageList(params: SearchMatchUserMessageParams) {
    const { userId, friendId, keyword } = params;

    try {
      const regex = new RegExp(keyword, 'i');
      const list = await this.userMessageModel.aggregate([
        {
          $match: {
            msgType: { $ne: MessageTypeEnum.IMAGE },
            $or: [
              {
                fromId: new Types.ObjectId(userId),
                toId: new Types.ObjectId(friendId),
              },
              {
                fromId: new Types.ObjectId(friendId),
                toId: new Types.ObjectId(userId),
              },
            ],
          },
        },
        {
          $project: {
            matched: {
              $cond: {
                if: { $eq: [{ $type: '$msgContent' }, 'string'] },
                then: { $regexMatch: { input: '$msgContent', regex } },
                else: {
                  $cond: {
                    if: {
                      $and: [
                        { $eq: [{ $type: '$msgContent' }, 'object'] },
                        { $ifNull: ['$msgContent.filename', false] },
                      ],
                    },
                    then: {
                      $regexMatch: { input: '$msgContent.filename', regex },
                    },
                    else: false,
                  },
                },
              },
            },
            fromId: 1,
            toId: 1,
            msgType: 1,
            msgContent: 1,
            time: 1,
          },
        },
        { $match: { matched: true } },
      ]);

      const userInfo = await this.userModel.findOne(
        { _id: userId },
        { username: 1, avatarImage: 1, nickname: 1 },
      );
      const friendInfo = await this.userModel.findOne(
        { _id: friendId },
        { username: 1, avatarImage: 1, nickname: 1 },
      );

      const messageList = list.map((message: any) => {
        const { fromId, toId, ...rest } = message;
        const fromIdStr = fromId?.toString?.() || String(fromId);
        return {
          ...rest,
          userInfo: fromIdStr === userId ? userInfo : friendInfo,
          toId,
        };
      });

      return messageList;
    } catch {
      throw new BadRequestException(ErrorMessage.Common.SERVER_ERROR);
    }
  }

  async searchMatchGroupMessageList(params: SearchMatchGroupMessageParams) {
    const { groupId, keyword } = params;

    try {
      const regex = new RegExp(keyword, 'i');
      const list = await this.groupMessageModel.aggregate([
        {
          $match: {
            groupId: new Types.ObjectId(groupId),
            msgType: { $nin: [MessageTypeEnum.TIPS, MessageTypeEnum.IMAGE] },
          },
        },
        {
          $project: {
            matched: {
              $cond: {
                if: { $eq: [{ $type: '$msgContent' }, 'string'] },
                then: { $regexMatch: { input: '$msgContent', regex } },
                else: {
                  $cond: {
                    if: {
                      $and: [
                        { $eq: [{ $type: '$msgContent' }, 'object'] },
                        { $ifNull: ['$msgContent.filename', false] },
                      ],
                    },
                    then: {
                      $regexMatch: {
                        input: '$msgContent.filename',
                        regex,
                      },
                    },
                    else: false,
                  },
                },
              },
            },
            fromId: 1,
            groupId: 1,
            msgType: 1,
            msgContent: 1,
            time: 1,
          },
        },
        { $match: { matched: true } },
      ]);

      const messageList = await Promise.all(
        list.map(async (message: any) => {
          const { fromId, groupId: currentGroupId, ...rest } = message;
          const userInfo = await this.userModel.findOne(
            { _id: fromId },
            { username: 1, avatarImage: 1, nickname: 1 },
          );
          const groupInfo = await this.groupModel.findOne({
            _id: currentGroupId,
          });
          return {
            ...rest,
            userInfo,
            groupInfo,
          };
        }),
      );

      return messageList;
    } catch {
      throw new BadRequestException(ErrorMessage.Common.SERVER_ERROR);
    }
  }

  async socketSaveGroupMessage(data: Record<string, unknown>) {
    const newMessage = await this.groupMessageModel.create(data);
    return this.groupMessageModel
      .findOne({ _id: newMessage._id })
      .populate({
        path: 'fromId',
        model: 'User',
        select: ['username', 'avatarImage', 'nickname'],
      })
      .lean()
      .exec();
  }

  async socketGroupMessageUnread(params: AddGroupMessageUnreadParams) {
    const { groupId, userId, messageId } = params;
    try {
      const users = await this.groupUserModel.find({
        groupId,
        userId: { $ne: userId },
      });

      for (const user of users) {
        const curUserId = user.userId.toString();
        await this.groupMessageReadModel.create({
          userId: curUserId,
          messageId,
          groupId,
        });
      }
    } catch {
      throw new BadRequestException(ErrorMessage.Common.SERVER_ERROR);
    }
  }

  async socketCleanGroupMessageUnread(params: CleanGroupMessageUnreadParams) {
    const { groupId, userId, messageId } = params;
    const filter = messageId
      ? { groupId, userId, messageId }
      : { groupId, userId };
    try {
      await this.groupMessageReadModel.updateMany(filter, { unread: false });
    } catch {
      throw new BadRequestException(ErrorMessage.Common.SERVER_ERROR);
    }
  }

}
