import { Module } from '@nestjs/common';
import { UserModule } from '../users/user.module';
import { OpenAiToolsService } from './openaiTools.service';

@Module({
  imports: [UserModule],
  providers: [OpenAiToolsService],
  exports: [OpenAiToolsService],
})
export class OpenAiToolsModule {}
