import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { toObjectId } from 'src/utils/format';

export type GroupUserDocument = HydratedDocument<GroupUser>;

@Schema({ collection: 'group_users' })
export class GroupUser {
  _id: Types.ObjectId;

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

  @Prop({ type: Date, default: () => new Date() })
  time?: Date;
}

export const GroupUserSchema = SchemaFactory.createForClass(GroupUser);
