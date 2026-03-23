import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { toObjectId } from 'src/utils/format';

export type GroupMessageDocument = HydratedDocument<GroupMessage>;

@Schema({ collection: 'group_messages' })
export class GroupMessage {
  _id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    set: toObjectId,
  })
  fromId?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Group',
    set: toObjectId,
  })
  groupId: Types.ObjectId;

  @Prop({ type: Number })
  msgType: number;

  @Prop({ type: MongooseSchema.Types.Mixed })
  msgContent: unknown;

  @Prop({ type: Date, default: () => new Date() })
  time?: Date;
}

export const GroupMessageSchema = SchemaFactory.createForClass(GroupMessage);
