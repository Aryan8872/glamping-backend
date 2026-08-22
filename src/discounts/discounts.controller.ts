import {
  Controller, Get, Post, Put, Delete, Param, Query, Body,
  ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { DiscountsService } from './discounts.service.js';
import { Public } from '../decorators/public.decorator.js';

@Controller('discount')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post('new')
  @HttpCode(HttpStatus.CREATED)
  async createDiscount(@Body() body: any) {
    const discount = await this.discountsService.createDiscountService(body);
    return { message: 'Discount created successfully', data: discount };
  }

  @Public()
  @Get('all')
  async getAllDiscounts(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
  ) {
    if (q !== undefined || page !== undefined || limit !== undefined || active !== undefined) {
      const result = await this.discountsService.searchDiscounts({
        q, page: Number(page) || 1, perPage: Number(limit) || 10, active,
      });
      return { message: 'Discounts fetched successfully', ...result };
    }
    const discounts = await this.discountsService.getAllDiscountsService();
    return { message: 'Discounts fetched successfully', data: discounts };
  }

  @Public()
  @Get('active')
  async getActiveDiscounts() {
    const discounts = await this.discountsService.getActiveDiscountsService();
    return { message: 'Active discounts fetched successfully', data: discounts };
  }

  @Public()
  @Get('featured')
  async getFeaturedDiscount() {
    const discount = await this.discountsService.getFeaturedDiscountService();
    if (!discount) return { message: 'No featured discount found', data: null };
    return { message: 'Featured discount fetched successfully', data: discount };
  }

  @Public()
  @Get(':id')
  async getDiscountById(@Param('id', ParseIntPipe) id: number) {
    const discount = await this.discountsService.getDiscountByIdService(id);
    if (!discount) return { message: 'Discount not found' };
    return { message: 'Discount fetched successfully', data: discount };
  }

  @Put(':id')
  async updateDiscount(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const updated = await this.discountsService.updateDiscountService(id, body);
    return { message: 'Discount updated successfully', data: updated };
  }

  @Delete(':id')
  async deleteDiscount(@Param('id', ParseIntPipe) id: number) {
    await this.discountsService.deleteDiscountService(id);
    return { message: 'Discount deleted successfully' };
  }
}
