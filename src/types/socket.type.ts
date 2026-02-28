/** 会议相关Websocket Event */
export enum MeetingEventType {
  CREATE_MEETING = 'create-meeting', // 创建会议
  INVITE_MEETING = 'meeting-invite', // 会议邀请
  RECEIVE_INVITE = 'receive-invite', // 接受会议邀请
  REJECT_INVITE = 'reject-invite', // 拒绝会议邀请
  JOIN_MEETING = 'join-meeting', // 加入会议
  JOINED_MEETING = 'joined-meeting', // 加入会议成功
  DEVICE_STATUS_CHANGE = 'device-status-change', // 设备状态改变
  END_MEETING = 'end-meeting', // 结束会议
  LEAVE_MEETING = 'leave-meeting', // 退出会议
  SEND_OFFER = 'send-offer', // 发送sdp
  ANSWER_OFFER = 'answer-offer', // 响应sdp
  ICE_CANDIDATE = 'ice_candidate', // 发送ICE到其他客户端
  JOIN_SUCCESS = 'join-success', // 加入会议成功
}

/** 私人聊天相关Websocket Event */
export enum PrivateChatEventType {
  ADD_USER = 'add-user', // 用户登录
  USER_QUIT_APP = 'user-quit-app', // 用户退出登录
  SEND_MESSAGE = 'send-message', // 私人消息发送
  RECEIVE_MESSAGE = 'receive-message', // 私人消息接收
  READ_MESSAGE = 'read-message', // 消息已读
}

/** 群聊相关Websocket Event */
export enum GroupChatEventType {
  ADD_GROUOP_USER = 'add-group-user', // 用户加入群聊
  SEND_GROUP_MESSAGE = 'send-group-message', // 群消息发送
  RECEIVE_GROUP_MESSAGE = 'receive-group-message', // 群消息接收
  GROUP_MESSAGE_UNREAD = 'group-message-unread', // 未读群消息 +1
  READ_GROUP_MESSAGE = 'read-group-message', // 群消息已读
  ACCEPT_GROUP_INVITE = 'accept-group-invite', // 接受群邀请
  NEW_GROUP_USER_JOIN = 'new-group-user-join', // 接受群邀请，通知所有群用户新用户入群
  GROUP_USER_QUIT = 'group-user-quit', // 通知所有群用户用户退出群
}

export const WsEventType = {
  ...MeetingEventType,
  ...PrivateChatEventType,
  ...GroupChatEventType,
} as const;

export type WsEventType = (typeof WsEventType)[keyof typeof WsEventType];
