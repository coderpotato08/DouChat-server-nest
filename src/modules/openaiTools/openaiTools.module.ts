import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../users/user.module';
import { OpenAiToolsService } from './openaiTools.service';
import { UserContact, UserContactSchema } from 'src/schema/user-contact.schema';
import {
  GroupContact,
  GroupContactSchema,
} from 'src/schema/group-contact.schema';
import { UserMessage, UserMessageSchema } from 'src/schema/user-message.schema';
import {
  GroupMessage,
  GroupMessageSchema,
} from 'src/schema/group-message.schema';
import { Group, GroupSchema } from 'src/schema/group.schema';
import { User, UserSchema } from 'src/schema/user.schema';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([
      { name: UserContact.name, schema: UserContactSchema },
      { name: GroupContact.name, schema: GroupContactSchema },
      { name: UserMessage.name, schema: UserMessageSchema },
      { name: GroupMessage.name, schema: GroupMessageSchema },
      { name: Group.name, schema: GroupSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [OpenAiToolsService],
  exports: [OpenAiToolsService],
})
export class OpenAiToolsModule {}
