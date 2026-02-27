import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { toObjectId } from 'src/utils/format';

export type FriendDocument = HydratedDocument<Friend>;

@Schema({ timestamps: true, collection: 'friends' })
export class Friend {
  _id: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'User',
    set: toObjectId,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'User',
    set: toObjectId,
  })
  friendId: Types.ObjectId;
}

export const FriendSchema = SchemaFactory.createForClass(Friend);
