import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';

import { default as axios } from 'axios';
import * as cheerio from 'cheerio';
import { TiktokService } from '../tiktok.service';
import { TelegrafContext } from 'telegraf/typings/context';

const Extra = require('telegraf/extra');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Markup = require('telegraf/markup');
const Composer = require('telegraf/composer');
const WizardScene = require('telegraf/scenes/wizard');

@Injectable()
export class TelegramBotService {
  constructor(private readonly tiktokService: TiktokService) {
    const stepHandler = new Composer();
    stepHandler.action('recommended-tags', (ctx) => {
      ctx.reply('Введите название тега');
      return ctx.wizard.next();
    });

    const superWizard = new WizardScene('super-wizard',
      (ctx) => {
        ctx.reply('Выберите команду', Markup.inlineKeyboard([Markup.callbackButton('С этим тегом выбирают', 'recommended-tags')]).extra());
        return ctx.wizard.next();
      },
      stepHandler,
      async (ctx) => {
        const tags = await this.tiktokService.getRecommendedTagsByTag(ctx.message.text);
        await Promise.all(tags.map(([key, value]) => ctx.reply(`${key}: ${value}`)))
          .then(() => ctx.reply('Выберите команду', Markup.inlineKeyboard([Markup.callbackButton('С этим тегом выбирают', 'recommended-tags')]).extra()));
        return ctx.scene.leave();
      },
    );

    const bot = new Telegraf(process.env.TELEGRAM_BOTTOKEN);
    const stage = new Stage([superWizard], { default: 'super-wizard' });
    bot.use(session());
    bot.use(stage.middleware());
    bot.launch();
  }

  convertTimeString(timeString) {
    if (timeString && timeString.includes('назад')) {
      return '';
    }
    return timeString;
  }

  formatMessage(project) {
    return `Проект: ${project.title}`;
  }
}

