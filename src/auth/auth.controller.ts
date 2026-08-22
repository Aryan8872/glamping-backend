import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { registerSchema, loginSchema } from './auth.schemas.js';
import {
  COOKIE_OPTIONS,
} from '../common/utils/auth-utils.js';
import { Public } from '../decorators/public.decorator.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.registerUser(body);
    return {
      message: 'Registration successful',
      data: { id: user.id, email: user.email, fullName: user.fullName },
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip;
    const userAgent = req.get('user-agent');

    const { sessionId, refreshToken, userId } =
      await this.authService.loginUser({
        email: body.email,
        password: body.password,
        ip,
        userAgent,
      });

    res.cookie('sessionId', sessionId, COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { message: 'Login successful', userId };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const oldRefreshToken = req.cookies?.refreshToken;
    if (!oldRefreshToken) {
      res.status(HttpStatus.UNAUTHORIZED).json({ message: 'No refresh token provided' });
      return;
    }

    const ip = req.ip;
    const userAgent = req.get('user-agent');

    const { sessionId, refreshToken, userId } =
      await this.authService.refreshSession(oldRefreshToken, ip, userAgent);

    res.cookie('sessionId', sessionId, COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { message: 'Session refreshed', userId };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { sessionId, refreshToken } = req.cookies || {};

    await this.authService.logoutUser(sessionId, refreshToken);

    res.clearCookie('sessionId', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    return { message: 'Logged out successfully' };
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    const user = await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully', userId: user.id };
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return { data: user };
  }
}
