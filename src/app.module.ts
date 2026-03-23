import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/users/user.module';
import { FriendsModule } from './modules/friends/friends.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import configuration from './configuration';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './interceptor/transform.interceptor';
import { AdminGuard } from './guards/admin.guard';
import { EventModule } from './modules/event/event.module';
import { OpenAiModule } from './modules/openai/openai.module';
import { OpenAiToolsModule } from './modules/openaiTools/openaiTools.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          uri: configService.get<string>('db.mongo.uri'),
        };
      },
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    FriendsModule,
    EventModule,
    OpenAiModule,
    OpenAiToolsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AdminGuard,
    },
    AppService,
  ],
})
export class AppModule {}
