import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { toObjectId } from 'src/utils/format';

export type MeetingDocument = HydratedDocument<Meeting>;

@Schema({ collection: 'meetings' })
export class Meeting {
  _id: Types.ObjectId;

  @Prop({ type: String, default: () => randomUUID() })
  meetingId?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    set: toObjectId,
  })
  creator?: Types.ObjectId;

  @Prop({ type: String })
  meetingName?: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User', set: toObjectId }],
    default: [],
  })
  userList?: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  isJoinedMuted: boolean;

  @Prop({ type: Date })
  createTime: Date;

  @Prop({ type: Date })
  endTime: Date;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);
