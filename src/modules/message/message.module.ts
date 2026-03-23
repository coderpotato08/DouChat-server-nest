import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { UserMessage, UserMessageSchema } from 'src/schema/user-message.schema';
import {
  GroupMessage,
  GroupMessageSchema,
} from 'src/schema/group-message.schema';
import {
  GroupMessageRead,
  GroupMessageReadSchema,
} from 'src/schema/group-message-read.schema';
import { User, UserSchema } from 'src/schema/user.schema';
import { UserContact, UserContactSchema } from 'src/schema/user-contact.schema';
import {
  GroupContact,
  GroupContactSchema,
} from 'src/schema/group-contact.schema';
import { Group, GroupSchema } from 'src/schema/group.schema';
import { GroupUser, GroupUserSchema } from 'src/schema/group-user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserContact.name, schema: UserContactSchema },
      { name: UserMessage.name, schema: UserMessageSchema },
      { name: GroupMessage.name, schema: GroupMessageSchema },
      { name: GroupMessageRead.name, schema: GroupMessageReadSchema },
      { name: GroupContact.name, schema: GroupContactSchema },
      { name: Group.name, schema: GroupSchema },
      { name: GroupUser.name, schema: GroupUserSchema },
    ]),
  ],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
