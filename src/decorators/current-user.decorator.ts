import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserType, UserStatus } from '@prisma/client';

export interface AuthenticatedUser {
  id: number;
  email: string;
  fullName: string;
  userType: UserType;
  userStatus: UserStatus;
  profilePicture?: string | null;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    return data ? user?.[data] : user;
  },
);
