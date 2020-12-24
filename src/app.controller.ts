import { Controller, Get, Query } from '@nestjs/common';
import { TiktokService } from './tiktok.service';
import { Tiktok } from './tiktok.models';

@Controller()
export class AppController {
  constructor(private readonly tiktokService: TiktokService) {
  }

  @Get('recommended-tags')
  async getRecommendedTagsByTag(
    @Query('tag') tag: string,
    @Query('top') top = 15,
  ): Promise<Array<any>> {
    return this.tiktokService.getRecommendedTagsByTag(tag, top);
  }
}
