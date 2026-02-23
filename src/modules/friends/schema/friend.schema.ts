import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FriendDocument = HydratedDocument<Friend>;

@Schema({ timestamps: true })
export class Friend {
  _id: Types.ObjectId;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  friendId: string;

  createdAt: Date;
  updatedAt: Date;
}

export const FriendSchema = SchemaFactory.createForClass(Friend);
