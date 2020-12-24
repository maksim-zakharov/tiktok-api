import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TiktokService } from './tiktok.service';
import { TelegramBotService } from './telegram-bot/telegram-bot.service';

@Module({
  imports: [
    ConfigModule.forRoot(), // load .env file
  ],
  controllers: [AppController],
  providers: [AppService, TiktokService, TelegramBotService],
})
export class AppModule {
}
