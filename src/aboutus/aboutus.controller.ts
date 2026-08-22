import { Controller, Get, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { AboutUsService } from './aboutus.service.js';
import { Public } from '../decorators/public.decorator.js';

@Controller('aboutus')
export class AboutUsController {
  constructor(private readonly aboutUsService: AboutUsService) {}

  @Public()
  @Get()
  async getAboutUs() {
    const data = await this.aboutUsService.getAboutUsService();
    return { message: 'successfully returned aboutus data', data };
  }

  @Put()
  async createOrUpdateAboutUs(@Body() body: any) {
    const data = await this.aboutUsService.createOrUpdateAboutUsService(body);
    return { message: 'successfully updated about us data', data };
  }

  @Put('stat/:id')
  async updateAboutUsStat(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    const data = await this.aboutUsService.updateAboutUsStat(id, body);
    return { message: 'successfully updated about us stat', data };
  }

  @Delete('stat/:id')
  async deleteAboutUsStat(@Param('id', ParseIntPipe) id: number) {
    await this.aboutUsService.deleteAboutUsStat(id);
    return { message: 'successfully deleted stat data' };
  }
}
