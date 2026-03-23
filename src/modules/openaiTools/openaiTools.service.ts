import { Injectable } from '@nestjs/common';
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

@Injectable()
export class OpenAiToolsService {
  constructor(private readonly userService: UserService) {}

  async searchFriendsAsMarkdown(
    input: SearchFriendsInput,
  ): Promise<{
    count: number;
    rows: FriendTableRow[];
    markdown: string;
  }> {
    const result = await this.userService.searchUser(
      input.keyWord,
      input.currUserId,
    );

    const rows = result.userList
      .filter((user) => user.isFriend)
      .map((user) => ({
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
      .map(
        (row) => `| ${row.username} | ${row.phoneNumber} | ${row.email} |`,
      )
      .join('\n');

    return [header, separator, body].join('\n');
  }
}
