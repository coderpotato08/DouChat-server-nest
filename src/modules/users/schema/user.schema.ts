import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude } from 'class-transformer';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 20,
  })
  username: string;

  @Prop({
    required: true,
    maxlength: 30,
  })
  nickname?: string;

  @Prop({
    required: true,
    minlength: 8,
  })
  @Exclude()
  password: string;

  @Prop({ default: '' })
  avatarImage: string;

  @Prop({ enum: ['man', 'girl'] })
  gender?: 'man' | 'girl';

  @Prop()
  phoneNumber?: string;

  @Prop({ default: '' })
  sign?: string;

  @Prop({
    unique: true,
    maxlength: 50,
  })
  email?: string;

  @Prop({ default: '' })
  token?: string;

  @Prop({ default: '' })
  thirdAccessToken?: string;

  @Prop({
    enum: ['github'],
    default: undefined,
  })
  thirdPlatform?: 'github';
}

export const UserSchema = SchemaFactory.createForClass(User);
