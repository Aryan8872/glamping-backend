import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '@prisma/client';
import { ROLES_KEY } from '../../../decorators/roles.decorator.js';
import { AuthenticatedUser } from '../../../decorators/current-user.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest() as {
      user: AuthenticatedUser;
    };

    if (!user || !user.userType) {
      throw new ForbiddenException({
        message: 'No role assigned or user unauthenticated',
      });
    }

    // SUPERADMIN has access to all roles
    if (user.userType === UserType.SUPERADMIN) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.userType);
    if (!hasRole) {
      throw new ForbiddenException({
        message: `Access denied: Insufficient permissions`,
      });
    }

    return true;
  }
}
