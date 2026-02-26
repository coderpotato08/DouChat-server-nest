import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApplyStatusEnum } from 'src/enum/response.enum';

export type FriendNotificationDocument = HydratedDocument<FriendNotification>;

@Schema({ timestamps: true, collection: 'friend_notifications' })
export class FriendNotification {
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

  @Prop({
    required: true,
    default: ApplyStatusEnum.APPLYING,
    enum: ApplyStatusEnum,
  })
  status: ApplyStatusEnum; // 0: APPLYING, 1: ACCEPT, 2: REJECTED

  @Prop({ default: () => new Date() })
  applyTime: Date;
}

export const FriendNotificationSchema =
  SchemaFactory.createForClass(FriendNotification);
