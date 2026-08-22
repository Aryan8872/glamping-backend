import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  hashToken,
  generateToken,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from '../common/utils/auth-utils.js';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async registerUser(data: {
    fullName: string;
    email: string;
    password: string;
    phoneNumber: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    return this.prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        password: hashedPassword,
        phoneNumber: data.phoneNumber,
        userType: 'ADMIN',
      },
    });
  }

  async loginUser(data: {
    email: string;
    password: string;
    ip?: string;
    userAgent?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.userStatus === 'DISABLED') {
      throw new UnauthorizedException('Your account has been disabled');
    }

    return this.createSessionAndTokens(user.id, data.ip, data.userAgent);
  }

  async createSessionAndTokens(userId: number, ip?: string, userAgent?: string) {
    const sessionId = generateToken();
    const refreshToken = generateToken();
    const hashedRefresh = hashToken(refreshToken);

    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY);
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);

    await this.prisma.$transaction([
      this.prisma.session.create({
        data: { id: sessionId, userId, ip, userAgent, expiresAt },
      }),
      this.prisma.refreshToken.create({
        data: { token: hashedRefresh, userId, expiresAt: refreshExpiresAt },
      }),
    ]);

    return { sessionId, refreshToken, userId };
  }

  async refreshSession(oldRefreshToken: string, ip?: string, userAgent?: string) {
    const hashedOld = hashToken(oldRefreshToken);

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: hashedOld },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.expiresAt < new Date() ||
      tokenRecord.revokedAt
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const userId = tokenRecord.userId;
    const newSessionId = generateToken();
    const newRefreshToken = generateToken();
    const hashedNewRefresh = hashToken(newRefreshToken);

    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY);
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.session.create({
        data: { id: newSessionId, userId, ip, userAgent, expiresAt },
      }),
      this.prisma.refreshToken.create({
        data: { token: hashedNewRefresh, userId, expiresAt: refreshExpiresAt },
      }),
    ]);

    return { sessionId: newSessionId, refreshToken: newRefreshToken, userId };
  }

  async logoutUser(sessionId?: string, refreshToken?: string) {
    const hashedRefresh = refreshToken ? hashToken(refreshToken) : null;
    const actions: Promise<any>[] = [];

    if (sessionId) {
      actions.push(
        this.prisma.session.delete({ where: { id: sessionId } }).catch(() => {}),
      );
    }
    if (hashedRefresh) {
      actions.push(
        this.prisma.refreshToken
          .update({
            where: { token: hashedRefresh },
            data: { revokedAt: new Date() },
          })
          .catch(() => {}),
      );
    }

    await Promise.all(actions);
  }

  async verifyEmail(token: string) {
    if (!token) throw new BadRequestException('Token is required');

    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) throw new BadRequestException('Invalid or expired verification token');

    return this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), verificationToken: null },
    });
  }
}
