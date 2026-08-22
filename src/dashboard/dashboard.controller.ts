import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { Roles } from '../decorators/roles.decorator.js';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles('SUPERADMIN', 'ADMIN')
  @Get()
  async getDashboardData() {
    const data = await this.dashboardService.getDashboardData();
    return { message: 'Dashboard data fetched successfully', data };
  }

  @Roles('SUPERADMIN', 'ADMIN')
  @Get('stats')
  async getDashboardStats() {
    const data = await this.dashboardService.getDashboardStats();
    return { message: 'Dashboard stats fetched successfully', data };
  }
}
