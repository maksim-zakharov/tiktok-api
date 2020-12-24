import '@utils/puppeteer-extension';

import * as dotenv from 'dotenv';
import axios from 'axios';
import { Tiktok } from "./tiktok.models";
import CollectionResponse = Tiktok.CollectionResponse;
import ChallengeItem = Tiktok.ChallengeItem;
import { createBrowser, createPage, tryNavigate } from "@utils/puppeteer-extension";

import * as cheerio from 'cheerio';

export class TiktokService {

  private _dictionary = {};

  constructor() {
    dotenv.config()
  }

  async getRecommendedTagsByTag(tagName: string, top = 20) {

    const items: ChallengeItem[] = [];

    for (let i = 0; i < 100; i++) {
      const { itemList } = await this.getChallengesByTag(tagName, i * 35, 35);
      if (!itemList) {
        break;
      }
      items.push(...itemList);
    }

    const allChallenges: any = selectMany<ChallengeItem>(items, item => item.challenges);

    const topChallenges = countBy(allChallenges, i => i.title).sort(function(a, b) {
      if (a[1] > b[1]) {
        return -1;
      }
      if (a[1] < b[1]) {
        return 1;
      }
      // a должно быть равным b
      return 0;
    }).splice(0, top);

    return topChallenges;
  }

  async getChallengesByTag(tagName: string, offset = 0, count = 30)
    : Promise<any>
  // : Promise<CollectionResponse<ChallengeItem>>
  {
    if (count > 35) {
      throw new Error("Count doesn't be great than 35");
    }

    let tagId = Object.entries(this._dictionary).find(([key, value]) => key === tagName)?.slice(1);
    if (!tagId) {
      // const _browser = await createBrowser();
      //
      // const page = await createPage(_browser);
      //
      // await tryNavigate(page, `https://www.tiktok.com/tag/${tagName}?lang=ru-RU`);
      //
      // const content = await page.content();
      // const $ = cheerio.load(content);
      console.log(tagName)
      const response = await axios.get(`https://www.tiktok.com/tag/${encodeURIComponent(tagName)}?lang=ru-RU`);
      const $ = cheerio.load(response.data);

      tagId = $('meta[property="al:ios:url"]').first().attr('content').split('?')[0].split('/')[4] as any;
      this._dictionary[tagName] = tagId;
    }

    return await axios.get(`https://m.tiktok.com/api/challenge/item_list/?aid=1988&challengeID=${tagId}&count=${count}&cursor=${offset}`)
      .then(async (response) => {
        if (response.data.type) {
          response.data = await this.getByPuppeteer(`https://m.tiktok.com/api/challenge/item_list/?aid=1988&challengeID=70578828&count=${count}&cursor=${offset}`);
          console.log(JSON.stringify(response.headers))
          console.log(JSON.stringify(response.data))
          return response.data;
        } else {
          return response.data;
        }
      })
    // .then(console.log)
  }

  getByPuppeteer = async (url) => {

    const _browser = await createBrowser();

    const page = await createPage(_browser);

    await tryNavigate(page, url);

    const content = await page.content();
    const $ = cheerio.load(content);
    return $('body').text();
  }
}

const countBy = <T = any>(arr: T[], predicate?: (value: T) => unknown) => {
  return Object.entries(arr.reduce((acc, val) => {
    const value = predicate(val);
    acc[value.toString()] = (acc[value.toString()] || 0) + 1;
    return acc;
  }, {} as any));
};

const selectMany = <T>(items, predicate?: (value: T) => unknown): T => {
  return items.map(predicate).reduce((arr, curr) => arr.concat(curr), []);
};

const distinct = <T>(items, selector?: (x: T) => unknown): Array<T> => {
  if (!selector) {
    return Array.from<T>(new Set(items));
  }
  const result = [];
  const resultIndex = [];
  const selectedItems = items.map(selector);
  selectedItems.forEach((el, index) => {
    if (!resultIndex.includes(el)) {
      resultIndex.push(el);
      result.push(items[index]);
    }
  });
  return result;
};


