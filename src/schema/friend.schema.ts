import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FriendDocument = HydratedDocument<Friend>;

@Schema({ timestamps: true, collection: 'friends' })
export class Friend {
  _id: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'User',
    set: (v: string | Types.ObjectId) => v instanceof Types.ObjectId ? v : new Types.ObjectId(v),
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'User',
    set: (v: string | Types.ObjectId) => v instanceof Types.ObjectId ? v : new Types.ObjectId(v),
  })
  friendId: Types.ObjectId;
}

export const FriendSchema = SchemaFactory.createForClass(Friend);
