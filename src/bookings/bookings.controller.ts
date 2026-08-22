import {
  Controller, Get, Post, Put, Patch, Param, Query, Body,
  HttpCode, HttpStatus, ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Public } from '../decorators/public.decorator.js';

@Controller('booking')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('new')
  @HttpCode(HttpStatus.CREATED)
  async createBooking(@Body() body: any) {
    const booking = await this.bookingsService.createBooking(body);
    return { message: 'Booking created', data: booking };
  }

  @Get('all')
  async getAllBookings(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
  ) {
    const result = await this.bookingsService.searchBookings({
      q, page: Number(page) || 1, perPage: Number(limit) || 15, status, checkIn, checkOut,
    });
    return {
      message: 'Bookings fetched successfully',
      data: result.results, total: result.total,
      page: result.page, limit: result.limit,
      totalPages: result.totalPages, hasMore: result.hasMore,
    };
  }

  @Public()
  @Get('availability/:campId')
  async getCampAvailability(
    @Param('campId', ParseIntPipe) campId: number,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
  ) {
    if (!checkIn || !checkOut) throw new BadRequestException('checkIn and checkOut are required');
    const availability = await this.bookingsService.getCampAvailability(
      campId, new Date(checkIn), new Date(checkOut),
    );
    return { message: 'Availability fetched', data: availability };
  }

  @Get(':id')
  async getBooking(@Param('id', ParseIntPipe) id: number) {
    const booking = await this.prisma.campBookings.findUnique({ where: { id } });
    if (!booking) return { message: 'Not found' };
    return { message: 'OK', data: booking };
  }

  @Put(':id')
  async updateBooking(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const updated = await this.bookingsService.updateBooking(id, body);
    return { message: 'Booking updated', data: updated };
  }

  @Patch(':id/cancel')
  async cancelBooking(@Param('id', ParseIntPipe) id: number) {
    const cancelled = await this.bookingsService.cancelBooking(id);
    return { message: 'Booking cancelled', data: cancelled };
  }
}
