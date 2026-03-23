import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { toObjectId } from 'src/utils/format';

export type GroupMessageReadDocument = HydratedDocument<GroupMessageRead>;

@Schema({ collection: 'group_message_reads' })
export class GroupMessageRead {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, set: toObjectId })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, set: toObjectId })
  groupId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, set: toObjectId })
  messageId: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  unread: boolean;
}

export const GroupMessageReadSchema =
  SchemaFactory.createForClass(GroupMessageRead);
