import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { toObjectId } from 'src/utils/format';

export type GroupContactDocument = HydratedDocument<GroupContact>;

@Schema({ collection: 'group_contacts' })
export class GroupContact {
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
    ref: 'Group',
    set: toObjectId,
  })
  groupId: Types.ObjectId;

  @Prop({ type: Date, default: () => new Date() })
  createTime?: Date;

  @Prop({ type: Number, default: 0 })
  unreadNum: number;
}

export const GroupContactSchema = SchemaFactory.createForClass(GroupContact);
