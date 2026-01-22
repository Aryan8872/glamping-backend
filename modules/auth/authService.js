import prisma from "../../utils/prismaClient.js";
import bcrypt from "bcrypt";
import {
  hashToken,
  generateToken,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from "../../utils/authUtils.js";
import { BadRequestError, UnauthorizedError } from "../../utils/error.js";

const SALT_ROUNDS = 12;

export const registerUser = async ({
  fullName,
  email,
  password,
  phoneNumber,
}) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new BadRequestError("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  return await prisma.user.create({
    data: {
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      userType: "ADMIN", // Defaulting to admin for this request
    },
  });
};

export const loginUser = async ({ email, password, ip, userAgent }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid credentials");
  }

  if (user.userStatus === "DISABLED") {
    throw new UnauthorizedError("Your account has been disabled");
  }

  return await createSessionAndTokens(user.id, ip, userAgent);
};

export const createSessionAndTokens = async (userId, ip, userAgent) => {
  const sessionId = generateToken();
  const refreshToken = generateToken();
  const hashedRefresh = hashToken(refreshToken);

  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY);
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);

  await prisma.$transaction([
    prisma.session.create({
      data: {
        id: sessionId,
        userId,
        ip,
        userAgent,
        expiresAt,
      },
    }),
    prisma.refreshToken.create({
      data: {
        token: hashedRefresh,
        userId,
        expiresAt: refreshExpiresAt,
      },
    }),
  ]);

  return { sessionId, refreshToken, userId };
};

export const refreshSession = async (oldRefreshToken, ip, userAgent) => {
  const hashedOld = hashToken(oldRefreshToken);

  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: hashedOld },
    include: { user: true },
  });

  if (
    !tokenRecord ||
    tokenRecord.expiresAt < new Date() ||
    tokenRecord.revokedAt
  ) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  // Token rotation
  const userId = tokenRecord.userId;
  const newSessionId = generateToken();
  const newRefreshToken = generateToken();
  const hashedNewRefresh = hashToken(newRefreshToken);

  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY);
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    }),
    prisma.session.create({
      data: {
        id: newSessionId,
        userId,
        ip,
        userAgent,
        expiresAt,
      },
    }),
    prisma.refreshToken.create({
      data: {
        token: hashedNewRefresh,
        userId,
        expiresAt: refreshExpiresAt,
      },
    }),
  ]);

  return { sessionId: newSessionId, refreshToken: newRefreshToken, userId };
};

export const logoutUser = async (sessionId, refreshToken) => {
  const hashedRefresh = refreshToken ? hashToken(refreshToken) : null;

  const actions = [];
  if (sessionId) {
    actions.push(
      prisma.session.delete({ where: { id: sessionId } }).catch(() => {}),
    );
  }
  if (hashedRefresh) {
    actions.push(
      prisma.refreshToken
        .update({
          where: { token: hashedRefresh },
          data: { revokedAt: new Date() },
        })
        .catch(() => {}),
    );
  }

  await Promise.all(actions);
};

export const verifyEmail = async (token) => {
  if (!token) throw new BadRequestError("Token is required");

  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  });

  if (!user) throw new BadRequestError("Invalid or expired verification token");

  return await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      verificationToken: null,
    },
  });
};
