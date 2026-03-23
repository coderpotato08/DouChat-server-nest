import { Types } from 'mongoose';
import { MessageTypeEnum } from 'src/types/shared.type';

export const toObjectId = (v: string | Types.ObjectId) =>
  v instanceof Types.ObjectId ? v : new Types.ObjectId(v);

export const objectIdToString = (v: string | Types.ObjectId) => v.toString();


export const formatMessageText = (content: any, type: MessageTypeEnum): string => {
  if (content === '' || content == null) return '';
  if (type === MessageTypeEnum.IMAGE || type === MessageTypeEnum.TEXT) {
    let str = String(content);
    str = str.replace(/<img.*?>/g, '[图片]');
    str = str.replace(/<.*?>/g, '');
    return str;
  }
  if (type === MessageTypeEnum.FILE) {
    return `[文件] ${content?.filename ?? ''}`;
  }
  return '';
};

export const messageFilter = (message: any, keyword: string): boolean => {
  const { msgContent, msgType } = message;
  if (msgType === MessageTypeEnum.FILE || msgType === MessageTypeEnum.VIDEO) {
    return msgContent?.filename?.indexOf(keyword) > -1;
  }
  if (msgType === MessageTypeEnum.TEXT) {
    return String(msgContent).indexOf(keyword) > -1;
  }
  return false;
};