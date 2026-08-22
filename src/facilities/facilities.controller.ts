import {
  Controller, Get, Post, Put, Delete, Param, Body,
  ParseIntPipe,
} from '@nestjs/common';
import { FacilitiesService } from './facilities.service.js';
import { Public } from '../decorators/public.decorator.js';

@Controller('facility')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Post('new')
  async createFacility(@Body() body: any) {
    const facility = await this.facilitiesService.createFacility(body);
    return { message: 'successfully created facility details', data: facility };
  }

  @Public()
  @Get('all')
  async getAllFacilities() {
    const facilities = await this.facilitiesService.getAllFacilities();
    return { message: 'successfully returned all facility details', data: facilities };
  }

  @Public()
  @Get(':id')
  async getFacilityById(@Param('id', ParseIntPipe) id: number) {
    const facility = await this.facilitiesService.getFacilityById(id);
    if (!facility) return { message: 'Facility not found' };
    return { message: 'successfully returned searched facility details', data: facility };
  }

  @Put(':id')
  async updateFacility(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    const updated = await this.facilitiesService.updateFacility(id, body);
    return { message: 'successfully updated facility details', data: updated };
  }

  @Delete(':id')
  async deleteFacility(@Param('id', ParseIntPipe) id: number) {
    await this.facilitiesService.deleteFacility(id);
    return { message: 'successfully deleted facility detail' };
  }
}
