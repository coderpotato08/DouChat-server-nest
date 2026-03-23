import { Body, Controller, Post } from '@nestjs/common';
import { MessageService } from './message.service';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post('/loadUserMessageList')
  loadUserMessageList(@Body() body: any) {
    return this.messageService.loadMessageList(body);
  }

  @Post('/loadGroupMessageList')
  loadGroupMessageList(@Body() body: any) {
    return this.messageService.loadGroupMessageList(body);
  }

  @Post('/searchMessageList')
  searchMessageList(@Body() body: any) {
    return this.messageService.searchMessageList(body);
  }

  @Post('/searchMatchGroupMessageList')
  searchMatchGroupMessageList(@Body() body: any) {
    return this.messageService.searchMatchGroupMessageList(body);
  }

  @Post('/searchMatchUserMessageList')
  searchMatchUserMessageList(@Body() body: any) {
    return this.messageService.searchMatchUserMessageList(body);
  }
}
