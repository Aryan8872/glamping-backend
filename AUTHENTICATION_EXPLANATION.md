# Secure Session-Based Authentication System

This document explains the implementation of the secure, session-based authentication system for the Campora Admin Panel.

## Architecture Overview

The system uses **server-side sessions** stored in a PostgreSQL database (via Prisma) and **refresh tokens** stored in HTTP-only cookies to manage user authentication. Unlike simple JWTs, this design allows for full control over session revocation and provides a robust mechanism for token rotation.

### 1. Registration
- **Password Hashing**: Passwords are hashed using `bcrypt` with **12 rounds** of salting.
- **Role Assignment**: For this implementation, registered users are defaulted to the `ADMIN` role.
- **Verification**: An optional email verification token is generated, which can be verified via the `/auth/verify-email` endpoint.

### 2. Login & Session Creation
- When a user logs in, the backend:
    1. Validates the password.
    2. Generates a unique `sessionId` (opaque) and a `refreshToken` (opaque).
    3. Hahses the `refreshToken` and stores it in the database.
    4. Creates a `Session` record in the database with the user's IP and User Agent.
    5. Sends both tokens to the client via **HTTP-only, Secure, SameSite: Strict** cookies.

### 3. Session Management
- **Short-lived access**: The `sessionId` represents an active session, typically checked on every request via the `authGuard` middleware.
- **Sliding Expiration**: Every time an active user makes a request, the `authGuard` checks if the session is nearing its half-life. If so, it automatically extends the `expiresAt` timestamp, ensuring active users stay logged in.
- **Brute Force Protection**: A rate limiter is applied to the login route, limiting attempts to 10 per 15 minutes per IP.

### 4. Refresh Flow (Token Rotation)
The `/auth/refresh` endpoint implements a secure rotation strategy:
1. It verifies the provided `refreshToken` against the hashed value in the DB.
2. If valid, it **invalidates (revokes)** the old refresh token.
3. It creates a **new session** and a **new refresh token**.
4. This "one-time use" nature of refresh tokens prevents replay attacks if a token is ever stolen.

### 5. Logout
- When a user logs out, we explicitly:
    1. Delete the active `Session` from the database.
    2. Mark the `refreshToken` as revoked in the database.
    3. Clear the cookies on the client side.

## Security Features & Prevention of Vulnerabilities

| Feature | Protection Against |
| :--- | :--- |
| **HTTP-only Cookies** | **XSS (Cross-Site Scripting)**: Javascript cannot access the session tokens. |
| **SameSite: Strict** | **CSRF (Cross-Site Request Forgery)**: Cookies are only sent for first-party requests. |
| **Token Rotation** | **Replay Attacks**: Stolen refresh tokens are rendered useless after the next legitimate refresh. |
| **Session Fixation Prevention** | Each login generates an entirely new session ID; old ones (if any) are not reused. |
| **Database-backed Sessions** | **Instant Revocation**: If a user is compromised, an admin can delete their sessions from the DB immediately. |
| **Bcrypt (12 Rounds)** | **Rainbow Tables / Brute Force**: Makes offline password cracking extremely slow. |
| **Rate Limiting** | **Credential Stuffing**: Slows down automated login attempts. |

## Session Lifecycle in this Project

1. **User enters credentials** -> POST `/auth/login`.
2. **Server responds** with 200 and cookies -> Frontend redirects to `/`.
3. **Frontend makes API calls** -> Cookies are sent automatically via `credentials: 'include'`.
4. **Access session expires (15m)** -> API returns 401.
5. **Frontend Interceptor (`authFetch`)** -> Catches 401, calls `/auth/refresh` automatically.
6. **Server rotates tokens** -> Frontend retries original request with new session.
7. **Inactivity (>7 days)** -> Refresh token expires, user is redirected to `/login`.
