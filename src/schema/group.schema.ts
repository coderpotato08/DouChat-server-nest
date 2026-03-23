import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { toObjectId } from 'src/utils/format';

export type GroupDocument = HydratedDocument<Group>;

@Schema({ collection: 'groups' })
export class Group {
  _id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    set: toObjectId,
  })
  creator: Types.ObjectId;

  @Prop({ type: String })
  groupName: string;

  @Prop({ type: Number, unique: true })
  groupNumber: number;

  @Prop({ type: String })
  sign?: string;

  @Prop({ type: Date, default: () => new Date() })
  createTime?: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
