import prisma from "../utils/prismaClient.js";
import { UnauthorizedError } from "../utils/error.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authGuard = asyncHandler(async (req, res, next) => {
  const { sessionId } = req.cookies;

  // Simple CSRF protection: check for a custom header if it's a mutation
  // Since we use fetch with JSON, checking for Content-Type or a custom header is effective
  if (
    req.method !== "GET" &&
    !req.get("Content-Type")?.includes("application/json")
  ) {
    throw new UnauthorizedError("CSFR: Missing required headers");
  }

  if (!sessionId) {
    throw new UnauthorizedError("Unauthorized: No session provided");
  }

  const session = await prisma.session.findUnique({
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
    // If session expired, client should try /auth/refresh
    throw new UnauthorizedError("Unauthorized: Session expired or invalid");
  }

  if (session.user.userStatus === "DISABLED") {
    throw new UnauthorizedError("Your account has been disabled");
  }

  // Sliding expiration: if session is more than halfway to expiry, extend it
  const now = new Date();
  const timeRemaining = session.expiresAt.getTime() - now.getTime();
  const halfDuration = 7.5 * 60 * 1000; // 7.5 minutes (half of 15m)

  if (timeRemaining < halfDuration) {
    const newExpiry = new Date(now.getTime() + 15 * 60 * 1000);
    await prisma.session.update({
      where: { id: sessionId },
      data: { expiresAt: newExpiry },
    });
  }

  req.user = session.user;
  req.sessionId = sessionId;
  next();
});

export const adminGuard = (req, res, next) => {
  if (req.user.userType !== "ADMIN" && req.user.userType !== "SUPERADMIN") {
    return res
      .status(403)
      .json({ message: "Forbidden: Admin access required" });
  }
  next();
};
