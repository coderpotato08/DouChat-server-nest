import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { Group, GroupSchema } from 'src/schema/group.schema';
import { GroupUser, GroupUserSchema } from 'src/schema/group-user.schema';
import {
  GroupContact,
  GroupContactSchema,
} from 'src/schema/group-contact.schema';
import {
  GroupNotification,
  GroupNotificationSchema,
} from 'src/schema/group-notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema },
      { name: GroupUser.name, schema: GroupUserSchema },
      { name: GroupContact.name, schema: GroupContactSchema },
      { name: GroupNotification.name, schema: GroupNotificationSchema },
    ]),
  ],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
