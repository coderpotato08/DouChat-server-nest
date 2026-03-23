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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserMessage.name, schema: UserMessageSchema },
      { name: GroupMessage.name, schema: GroupMessageSchema },
      { name: GroupMessageRead.name, schema: GroupMessageReadSchema },
    ]),
  ],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
