import { Types } from 'mongoose';

export const toObjectId = (v: string | Types.ObjectId) =>
  v instanceof Types.ObjectId ? v : new Types.ObjectId(v);

export const objectIdToString = (v: string | Types.ObjectId) => v.toString();
