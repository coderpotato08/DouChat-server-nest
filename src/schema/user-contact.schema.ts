import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { toObjectId } from 'src/utils/format';

export type UserContactDocument = HydratedDocument<UserContact>;

@Schema({ collection: 'usercontacts' })
export class UserContact {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, type: String })
  contactId: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User', set: toObjectId }],
    required: true,
  })
  users: [Types.ObjectId, Types.ObjectId];

  @Prop({ type: Date, default: () => new Date() })
  createTime?: Date;

  @Prop({ type: Number, default: 0 })
  unreadNum?: number;
}

export const UserContactSchema = SchemaFactory.createForClass(UserContact);
