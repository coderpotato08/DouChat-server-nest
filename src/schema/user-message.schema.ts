import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { toObjectId } from 'src/utils/format';

export type UserMessageDocument = HydratedDocument<UserMessage>;

@Schema({ collection: 'user_messages' })
export class UserMessage {
  _id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    set: toObjectId,
  })
  fromId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    set: toObjectId,
  })
  toId: Types.ObjectId;

  @Prop({ type: Number })
  msgType: number;

  @Prop({ type: MongooseSchema.Types.Mixed })
  msgContent: unknown;

  @Prop({ type: Date, default: () => new Date() })
  time?: Date;

  @Prop({ type: Number, default: 0 })
  state: number;
}

export const UserMessageSchema = SchemaFactory.createForClass(UserMessage);
