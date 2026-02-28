import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  type WsResponse,
} from '@nestjs/websockets';
import { WsEventType } from 'src/types/socket.type';

@WebSocketGateway(3040, {
  cors: {
    origin: '*',
  },
})
export class EventGateway {
  @SubscribeMessage(WsEventType.SEND_MESSAGE)
  handlePrivateSendMessage(
    @MessageBody() data,
  ): WsResponse<{ message: string }> {
    return {
      event: WsEventType.RECEIVE_MESSAGE,
      data: { message: data.message.value },
    };
  }
}
