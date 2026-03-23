import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAiController } from './openai.controller';
import { OpenAiService } from './openai.service';
import { OpenAiToolsModule } from '../openaiTools/openaiTools.module';

@Module({
  imports: [ConfigModule, OpenAiToolsModule],
  controllers: [OpenAiController],
  providers: [OpenAiService],
  exports: [OpenAiService],
})
export class OpenAiModule {}
