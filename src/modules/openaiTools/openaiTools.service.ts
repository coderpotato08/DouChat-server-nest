import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { Model, Types } from 'mongoose';
import { Observable } from 'rxjs';
import {
  GroupContact,
  GroupContactDocument,
} from 'src/schema/group-contact.schema';
import {
  GroupMessage,
  GroupMessageDocument,
} from 'src/schema/group-message.schema';
import { Group, GroupDocument } from 'src/schema/group.schema';
import {
  UserContact,
  UserContactDocument,
} from 'src/schema/user-contact.schema';
import {
  UserMessage,
  UserMessageDocument,
} from 'src/schema/user-message.schema';
import { User, UserDocument } from 'src/schema/user.schema';
import { UserService } from '../users/user.service';

export interface SearchFriendsInput {
  keyWord: string;
  currUserId: string;
}

export interface FriendTableRow {
  username: string;
  phoneNumber: string;
  email: string;
}

export interface GetMessageRecordsInput {
  userId: string;
  startTime?: string;
  endTime?: string;
  fileName?: string;
  format?: 'json' | 'md';
}

export type GetMessageRecordsStreamEvent = {
  type: 'start' | 'progress' | 'done';
  message: string;
  detail?: unknown;
};

type ExportMessage = {
  messageId: string;
  fromId: string;
  toId?: string;
  msgType: number;
  msgContent: unknown;
  time: string;
  fromUser?: {
    userId: string;
    username: string;
    nickname?: string;
  };
};

type ExportConversation = {
  conversationId: string;
  conversationType: 'single' | 'group';
  title: string;
  metadata: Record<string, unknown>;
  messageCount: number;
  messages: ExportMessage[];
};

@Injectable()
export class OpenAiToolsService {
  constructor(
    private readonly userService: UserService,
    @InjectModel(UserContact.name)
    private readonly userContactModel: Model<UserContactDocument>,
    @InjectModel(GroupContact.name)
    private readonly groupContactModel: Model<GroupContactDocument>,
    @InjectModel(UserMessage.name)
    private readonly userMessageModel: Model<UserMessageDocument>,
    @InjectModel(GroupMessage.name)
    private readonly groupMessageModel: Model<GroupMessageDocument>,
    @InjectModel(Group.name)
    private readonly groupModel: Model<GroupDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async searchFriendsAsMarkdown(input: SearchFriendsInput): Promise<{
    count: number;
    rows: FriendTableRow[];
    markdown: string;
  }> {
    const result = await this.userService.searchUser(
      input.keyWord,
      input.currUserId,
    );

    const rows = result.userList.map((user) => ({
      username: user.username || '-',
      phoneNumber: user.phoneNumber || '-',
      email: user.email || '-',
    }));

    return {
      count: rows.length,
      rows,
      markdown: this.toMarkdownTable(rows),
    };
  }

  private toMarkdownTable(rows: FriendTableRow[]): string {
    const header = '| username | phoneNumber | email |';
    const separator = '| --- | --- | --- |';

    if (!rows.length) {
      return [header, separator].join('\n');
    }

    const body = rows
      .map((row) => `| ${row.username} | ${row.phoneNumber} | ${row.email} |`)
      .join('\n');

    return [header, separator, body].join('\n');
  }

  async getMessageRecords(input: GetMessageRecordsInput): Promise<{
    filePath: string;
    format: 'json' | 'md';
    summary: {
      userId: string;
      singleConversationCount: number;
      groupConversationCount: number;
      totalMessages: number;
    };
  }> {
    if (!Types.ObjectId.isValid(input.userId)) {
      throw new Error('Invalid userId. Expected Mongo ObjectId format.');
    }

    const userId = input.userId;
    const userObjectId = new Types.ObjectId(userId);
    const format = input.format === 'json' ? 'json' : 'md';

    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const parsedStartDate = input.startTime
      ? new Date(input.startTime)
      : undefined;
    const parsedEndDate = input.endTime ? new Date(input.endTime) : undefined;

    if (parsedStartDate && Number.isNaN(parsedStartDate.getTime())) {
      throw new Error('Invalid startTime. Expected date-compatible string.');
    }
    if (parsedEndDate && Number.isNaN(parsedEndDate.getTime())) {
      throw new Error('Invalid endTime. Expected date-compatible string.');
    }

    const startDate = parsedStartDate
      ? new Date(Math.max(parsedStartDate.getTime(), threeMonthsAgo.getTime()))
      : threeMonthsAgo;
    const endDate = parsedEndDate
      ? new Date(Math.min(parsedEndDate.getTime(), now.getTime()))
      : now;

    if (startDate.getTime() > endDate.getTime()) {
      throw new Error(
        'Invalid time range. startTime must be earlier than endTime.',
      );
    }

    const requester = await this.userModel
      .findById(userObjectId, { username: 1, nickname: 1 })
      .lean()
      .exec();
    if (!requester) {
      throw new Error('User not found.');
    }

    const singleConversations = await this.buildSingleConversations(
      userObjectId,
      startDate,
      endDate,
    );
    const groupConversations = await this.buildGroupConversations(
      userObjectId,
      startDate,
      endDate,
    );

    const totalMessages = [...singleConversations, ...groupConversations]
      .map((conversation) => conversation.messageCount)
      .reduce((total, count) => total + count, 0);

    const exportPayload = {
      exportMeta: {
        userId,
        username: requester.username,
        nickname: requester.nickname,
        exportedAt: new Date().toISOString(),
        filters: {
          startTime: startDate?.toISOString(),
          endTime: endDate?.toISOString(),
        },
        summary: {
          singleConversationCount: singleConversations.length,
          groupConversationCount: groupConversations.length,
          totalMessages,
        },
      },
      conversations: [...singleConversations, ...groupConversations],
    };

    const outputDir = this.resolveOutputDir();
    await mkdir(outputDir, { recursive: true });

    const filePath = resolve(
      outputDir,
      this.buildOutputFileName(input.fileName, format, userId),
    );

    if (format === 'json') {
      await writeFile(
        filePath,
        JSON.stringify(exportPayload, null, 2),
        'utf-8',
      );
    } else {
      await writeFile(filePath, this.toMarkdownRecords(exportPayload), 'utf-8');
    }

    return {
      filePath,
      format,
      summary: {
        userId,
        singleConversationCount: singleConversations.length,
        groupConversationCount: groupConversations.length,
        totalMessages,
      },
    };
  }

  getMessageRecordsStream(
    input: GetMessageRecordsInput,
  ): Observable<GetMessageRecordsStreamEvent> {
    return new Observable<GetMessageRecordsStreamEvent>((subscriber) => {
      (async () => {
        subscriber.next({
          type: 'start',
          message: 'start exporting message records',
          detail: { userId: input.userId },
        });

        subscriber.next({
          type: 'progress',
          message: 'validating request and reading messages',
        });

        const result = await this.getMessageRecords(input);

        subscriber.next({
          type: 'progress',
          message: 'message records exported to local file',
          detail: {
            filePath: result.filePath,
            format: result.format,
            summary: result.summary,
          },
        });

        subscriber.next({
          type: 'done',
          message: 'export completed',
          detail: result,
        });
        subscriber.complete();
      })().catch((error: unknown) => {
        subscriber.error(error);
      });

      return () => {
        // no-op for now, keep consistent Observable cleanup signature
      };
    });
  }

  private async buildSingleConversations(
    userObjectId: Types.ObjectId,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ExportConversation[]> {
    const contacts = await this.userContactModel
      .find({ users: userObjectId })
      .populate({
        path: 'users',
        model: 'User',
        select: ['username', 'nickname'],
      })
      .lean()
      .exec();

    const conversations = await Promise.all(
      (contacts as any[]).map(async (contact) => {
        const users = (contact.users ?? []) as any[];
        const friend = users.find(
          (user) => user?._id?.toString?.() !== userObjectId.toString(),
        );
        const friendId = friend?._id;

        if (!friendId) {
          return null;
        }

        const timeFilter = this.buildTimeFilter(startDate, endDate);
        const messages = await this.userMessageModel
          .find(
            {
              ...timeFilter,
              $or: [
                { fromId: userObjectId, toId: friendId },
                { fromId: friendId, toId: userObjectId },
              ],
            },
            {
              fromId: 1,
              toId: 1,
              msgType: 1,
              msgContent: 1,
              time: 1,
            },
          )
          .sort({ time: 1 })
          .lean()
          .exec();

        return {
          conversationId: contact.contactId || contact._id?.toString?.(),
          conversationType: 'single',
          title: friend.nickname || friend.username || friendId.toString(),
          metadata: {
            friendId: friendId.toString(),
            friendUsername: friend.username,
            friendNickname: friend.nickname,
          },
          messageCount: messages.length,
          messages: messages.map((message: any) => ({
            messageId: message._id?.toString?.(),
            fromId: message.fromId?.toString?.() || '',
            toId: message.toId?.toString?.(),
            msgType: message.msgType,
            msgContent: message.msgContent,
            time: new Date(message.time).toISOString(),
          })),
        } as ExportConversation;
      }),
    );

    return conversations.filter(
      (conversation): conversation is ExportConversation =>
        !!conversation && conversation.messageCount > 0,
    );
  }

  private async buildGroupConversations(
    userObjectId: Types.ObjectId,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ExportConversation[]> {
    const groupContacts = await this.groupContactModel
      .find({ userId: userObjectId })
      .populate({ path: 'groupId', model: 'Group', select: ['groupName'] })
      .lean()
      .exec();

    const conversations = await Promise.all(
      (groupContacts as any[]).map(async (contact) => {
        const groupId = contact.groupId?._id || contact.groupId;
        if (!groupId) {
          return null;
        }

        const timeFilter = this.buildTimeFilter(startDate, endDate);
        const messages = await this.groupMessageModel
          .find(
            {
              ...timeFilter,
              groupId,
            },
            {
              fromId: 1,
              groupId: 1,
              msgType: 1,
              msgContent: 1,
              time: 1,
            },
          )
          .populate({
            path: 'fromId',
            model: 'User',
            select: ['username', 'nickname'],
          })
          .sort({ time: 1 })
          .lean()
          .exec();

        const groupInfo = await this.groupModel
          .findById(groupId, { groupName: 1, groupNumber: 1 })
          .lean()
          .exec();

        return {
          conversationId: groupId.toString(),
          conversationType: 'group',
          title:
            groupInfo?.groupName ||
            contact.groupId?.groupName ||
            groupId.toString(),
          metadata: {
            groupId: groupId.toString(),
            groupNumber: groupInfo?.groupNumber,
          },
          messageCount: messages.length,
          messages: messages.map((message: any) => ({
            messageId: message._id?.toString?.(),
            fromId:
              message.fromId?._id?.toString?.() ||
              message.fromId?.toString?.() ||
              '',
            msgType: message.msgType,
            msgContent: message.msgContent,
            time: new Date(message.time).toISOString(),
            fromUser: message.fromId
              ? {
                  userId:
                    message.fromId?._id?.toString?.() ||
                    message.fromId?.toString?.() ||
                    '',
                  username: message.fromId?.username || '',
                  nickname: message.fromId?.nickname,
                }
              : undefined,
          })),
        } as ExportConversation;
      }),
    );

    return conversations.filter(
      (conversation): conversation is ExportConversation =>
        !!conversation && conversation.messageCount > 0,
    );
  }

  private buildTimeFilter(startDate?: Date, endDate?: Date) {
    if (!startDate && !endDate) {
      return {};
    }

    return {
      time: {
        ...(startDate ? { $gte: startDate } : {}),
        ...(endDate ? { $lte: endDate } : {}),
      },
    };
  }

  private resolveOutputDir(outputDir?: string): string {
    return resolve(process.cwd(), 'temp_file');
  }

  private buildOutputFileName(
    fileName: string | undefined,
    format: 'json' | 'md',
    userId: string,
  ): string {
    const date = new Date();
    const dateTag = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const defaultName = `__chat_records_${userId}_${dateTag}.${format}`;

    const safeBaseName = (fileName || defaultName)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.+$/, '');

    if (!safeBaseName) {
      return defaultName;
    }

    if (extname(safeBaseName)) {
      return safeBaseName;
    }

    return `${safeBaseName}.${format}`;
  }

  private toMarkdownRecords(payload: {
    exportMeta: {
      userId: string;
      username: string;
      nickname?: string;
      exportedAt: string;
      filters: {
        startTime?: string;
        endTime?: string;
      };
      summary: {
        singleConversationCount: number;
        groupConversationCount: number;
        totalMessages: number;
      };
    };
    conversations: ExportConversation[];
  }): string {
    const lines: string[] = [];
    lines.push('# Message Records Export');
    lines.push('');
    lines.push(`- userId: ${payload.exportMeta.userId}`);
    lines.push(`- username: ${payload.exportMeta.username}`);
    lines.push(`- nickname: ${payload.exportMeta.nickname || '-'}`);
    lines.push(`- exportedAt: ${payload.exportMeta.exportedAt}`);
    lines.push(
      `- singleConversationCount: ${payload.exportMeta.summary.singleConversationCount}`,
    );
    lines.push(
      `- groupConversationCount: ${payload.exportMeta.summary.groupConversationCount}`,
    );
    lines.push(`- totalMessages: ${payload.exportMeta.summary.totalMessages}`);
    lines.push('');

    for (const conversation of payload.conversations) {
      lines.push(
        `## [${conversation.conversationType}] ${conversation.title} (${conversation.conversationId})`,
      );
      lines.push(`- messageCount: ${conversation.messageCount}`);
      lines.push('');
      lines.push('| time | fromId | msgType | msgContent |');
      lines.push('| --- | --- | --- | --- |');
      for (const message of conversation.messages) {
        const content = JSON.stringify(message.msgContent).replace(
          /\|/g,
          '\\|',
        );
        lines.push(
          `| ${message.time} | ${message.fromId || '-'} | ${message.msgType} | ${content} |`,
        );
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
