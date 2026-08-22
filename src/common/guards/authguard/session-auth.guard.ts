import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../decorators/public.decorator.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

/**
 * Session-based authentication guard that matches the Express authGuard.
 * Validates sessionId cookie, loads user from DB, supports sliding session expiry.
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();

    // CSRF protection: non-GET mutation must be JSON
    if (
      request.method !== 'GET' &&
      !request.headers['content-type']?.includes('application/json') &&
      !request.headers['content-type']?.includes('multipart/form-data')
    ) {
      throw new UnauthorizedException('CSRF: Missing required headers');
    }

    const sessionId = request.cookies?.sessionId;

    if (!sessionId) {
      throw new UnauthorizedException('Unauthorized: No session provided');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            userType: true,
            userStatus: true,
            profilePicture: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Unauthorized: Session expired or invalid');
    }

    if (session.user.userStatus === 'DISABLED') {
      throw new UnauthorizedException('Your account has been disabled');
    }

    // Sliding expiration: extend session if more than halfway expired
    const now = new Date();
    const timeRemaining = session.expiresAt.getTime() - now.getTime();
    const halfDuration = 7.5 * 60 * 1000; // 7.5 minutes

    if (timeRemaining < halfDuration) {
      const newExpiry = new Date(now.getTime() + 15 * 60 * 1000);
      await this.prisma.session
        .update({ where: { id: sessionId }, data: { expiresAt: newExpiry } })
        .catch(() => {}); // non-blocking
    }

    request.user = session.user;
    request.sessionId = sessionId;
    return true;
  }
}
