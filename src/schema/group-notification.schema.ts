import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { toObjectId } from 'src/utils/format';

export type GroupNotificationDocument = HydratedDocument<GroupNotification>;

@Schema({ collection: 'group_notifications' })
export class GroupNotification {
  _id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    set: toObjectId,
  })
  inviterId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Group',
    set: toObjectId,
  })
  groupId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    set: toObjectId,
  })
  userId: Types.ObjectId;

  @Prop({ type: Number, enum: [0, 1, 2] })
  status: 0 | 1 | 2;

  @Prop({ type: Date, default: () => new Date() })
  createTime?: Date;
}

export const GroupNotificationSchema =
  SchemaFactory.createForClass(GroupNotification);
