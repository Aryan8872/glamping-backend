import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { SessionAuthGuard } from '../src/common/guards/authguard/session-auth.guard.js';
import { RolesGuard } from '../src/common/guards/rolekeyguard/role.guard.js';
import { Reflector } from '@nestjs/core';

describe('Campora Full E2E Suite (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminSessionCookie: string;
  let userSessionCookie: string;

  beforeAll(async () => {
    // Switch to test database
    process.env.DATABASE_URL =
      process.env.DATABASE_URL_TEST ||
      'postgresql://postgres:postgrespass@localhost:5432/glamping_test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    
    // Register guards globally
    const reflector = app.get(Reflector);
    prisma = app.get(PrismaService);
    app.useGlobalGuards(
      new SessionAuthGuard(reflector, prisma),
      new RolesGuard(reflector),
    );

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
  });

  beforeEach(async () => {
    // Clean up all tables to avoid conflict
    await prisma.campBookings.deleteMany();
    await prisma.discount.deleteMany();
    await prisma.campSiteAdventure.deleteMany();
    await prisma.campSiteExperience.deleteMany();
    await prisma.campSiteFacility.deleteMany();
    await prisma.facility.deleteMany();
    await prisma.adventure.deleteMany();
    await prisma.experience.deleteMany();
    await prisma.destination.deleteMany();
    await prisma.campSite.deleteMany();
    await prisma.blog.deleteMany();
    await prisma.gallery.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.stat.deleteMany();
    await prisma.coreValue.deleteMany();
    await prisma.aboutUs.deleteMany();
    await prisma.session.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('1. Authentication Module', () => {
    it('/auth/register (POST) - should register a new standard user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          fullName: 'Jane Camper',
          email: 'jane@example.com',
          password: 'Password123!',
          phoneNumber: '9800000001',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Registration successful');
      expect(res.body.data.email).toBe('jane@example.com');
      expect(res.body.data.fullName).toBe('Jane Camper');
    });

    it('/auth/register (POST) - should reject duplicate email registration', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          fullName: 'User One',
          email: 'duplicate@example.com',
          password: 'Password123!',
          phoneNumber: '9800000001',
        });

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          fullName: 'User Two',
          email: 'duplicate@example.com',
          password: 'Password123!',
          phoneNumber: '9800000002',
        });

      expect(res.status).toBe(409);
    });

    it('/auth/login (POST) & /auth/me (GET) - should login and access protected /me with session cookie', async () => {
      // 1. Register user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          fullName: 'Active User',
          email: 'active@example.com',
          password: 'Password123!',
          phoneNumber: '9800000003',
        });

      // 2. Login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'active@example.com',
          password: 'Password123!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.message).toBe('Login successful');

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      userSessionCookie = cookies.find((c: string) => c.startsWith('sessionId='))!;
      expect(userSessionCookie).toBeDefined();

      // 3. Access protected /auth/me
      const meRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', userSessionCookie);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.email).toBe('active@example.com');
    });

    it('/auth/me (GET) - should reject unauthenticated request', async () => {
      const res = await request(app.getHttpServer()).get('/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('2. Campsites Module', () => {
    it('/campsite/new (POST) & /campsite/all (GET) & /campsite/search (GET) - should create and search camps', async () => {
      // 1. Create a Facility
      const facility = await prisma.facility.create({
        data: {
          name: 'Campfire Pit',
          slug: 'campfire-pit',
          icon: 'fire-icon.png',
        },
      });

      // 2. Create Campsite via service / controller
      const campRes = await request(app.getHttpServer())
        .post('/campsite/new')
        .send({
          name: 'Mountain High Camp',
          description: 'A beautiful campsite with mountain view and bonfires',
          pricePerNight: 120,
          location: 'Pokhara Hills',
          facilities: [facility.id],
          maxAdult: 4,
          maxChildren: 2,
          maxPets: 1,
          isFeatured: true,
        });

      expect(campRes.status).toBe(201);
      expect(campRes.body.data.name).toBe('Mountain High Camp');
      const campId = campRes.body.data.id;

      // 3. Fetch all camps
      const allRes = await request(app.getHttpServer()).get('/campsite/all');
      expect(allRes.status).toBe(200);
      expect(allRes.body.data.length).toBeGreaterThanOrEqual(1);

      // 4. Fetch specific camp by ID
      const singleRes = await request(app.getHttpServer()).get(`/campsite/${campId}`);
      expect(singleRes.status).toBe(200);
      expect(singleRes.body.data.name).toBe('Mountain High Camp');
      expect(singleRes.body.data.campSiteFacilities.length).toBe(1);

      // 5. Update Camp
      const updateRes = await request(app.getHttpServer())
        .patch(`/campsite/${campId}`)
        .send({
          name: 'Mountain High Luxury Camp',
          pricePerNight: 150,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('Mountain High Luxury Camp');
      expect(Number(updateRes.body.data.pricePerNight)).toBe(150);
    });
  });

  describe('3. Bookings Module & Availability Engine', () => {
    it('/booking/new (POST) & /booking/availability/:campId (GET) - should create booking and manage availability', async () => {
      // 1. Seed a Camp
      const camp = await prisma.campSite.create({
        data: {
          name: 'Lakeside Camp',
          slug: 'lakeside-camp',
          description: 'Right on the lake shore',
          pricePerNight: 80,
          maxAdult: 2,
          maxChildren: 1,
          isAvailable: true,
        },
      });

      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 5);
      const checkOutDate = new Date();
      checkOutDate.setDate(checkOutDate.getDate() + 7);

      // 2. Create Booking
      const bookingRes = await request(app.getHttpServer())
        .post('/booking/new')
        .send({
          campSiteId: camp.id,
          checkInDate: checkInDate.toISOString(),
          checkOutDate: checkOutDate.toISOString(),
          adults: 2,
          children: 0,
          pets: 0,
          guestUserFullName: 'Bob Camper',
          guestUserEmail: 'bob@example.com',
          guestUserPhoneNumber: '9812345678',
        });

      expect(bookingRes.status).toBe(201);
      expect(bookingRes.body.data.bookingStatus).toBe('BOOKED');
      expect(Number(bookingRes.body.data.totalPrice)).toBe(160); // 2 nights * $80

      // 3. Verify availability query shows unavailable for overlapping dates
      const availRes = await request(app.getHttpServer())
        .get(`/booking/availability/${camp.id}`)
        .query({
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate.toISOString(),
        });

      expect(availRes.status).toBe(200);
      expect(availRes.body.data.isAvailable).toBe(false);

      // 4. Overlapping booking creation must be rejected
      const overlapRes = await request(app.getHttpServer())
        .post('/booking/new')
        .send({
          campSiteId: camp.id,
          checkInDate: checkInDate.toISOString(),
          checkOutDate: checkOutDate.toISOString(),
          adults: 2,
          children: 0,
          pets: 0,
          guestUserFullName: 'Alice Conflict',
          guestUserEmail: 'alice@example.com',
          guestUserPhoneNumber: '9812345679',
        });

      expect(overlapRes.status).toBe(400);
    });
  });

  describe('4. Blogs, Destinations & Facilities Modules', () => {
    it('/blog/new (POST) & /blog/all (GET) - should manage blog articles', async () => {
      const blogRes = await request(app.getHttpServer())
        .post('/blog/new')
        .send({
          title: 'Top 10 Camping Tips in 2026',
          excerpt: 'Quick tips for wilderness survival',
          content: 'Here are the top 10 tips for camping safely and happily...',
          author: 'Expert Hiker',
          metaTitle: 'Camping Tips 2026',
          metaDescription: 'Complete guide for 2026 camping',
          metaKeywords: 'camping, hiking, travel',
          tags: ['tips', 'hiking', 'travel'],
        });

      expect(blogRes.status).toBe(201);
      expect(blogRes.body.data.title).toBe('Top 10 Camping Tips in 2026');

      const allBlogs = await request(app.getHttpServer()).get('/blog/all');
      expect(allBlogs.status).toBe(200);
      expect(allBlogs.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('/destination/new (POST) & /destination/all (GET) - should manage destinations', async () => {
      const destRes = await request(app.getHttpServer())
        .post('/destination/new')
        .send({
          name: 'Annapurna Base Sanctuary',
          title: 'Explore the Himalayas',
          description: 'A breathtaking high altitude camp location',
          isFeatured: true,
        });

      expect(destRes.status).toBe(201);
      expect(destRes.body.data.name).toBe('Annapurna Base Sanctuary');

      const allDest = await request(app.getHttpServer()).get('/destination/all');
      expect(allDest.status).toBe(200);
      expect(allDest.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('5. Admin Dashboard Module & Roles Guard', () => {
    it('/dashboard (GET) - should allow Admin/SuperAdmin and provide aggregate analytics', async () => {
      // 1. Create Superadmin User in DB
      const admin = await prisma.user.create({
        data: {
          fullName: 'Super Admin',
          email: 'admin@campora.com',
          password: 'hashedPassword',
          phoneNumber: '9800009999',
          userType: 'SUPERADMIN',
        },
      });

      // 2. Create an authenticated Session for Superadmin
      const session = await prisma.session.create({
        data: {
          userId: admin.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      adminSessionCookie = `sessionId=${session.id}`;

      // 3. Seed some dummy data for aggregate calculation
      const camp = await prisma.campSite.create({
        data: {
          name: 'Stats Camp',
          slug: 'stats-camp',
          description: 'For stats verification',
          pricePerNight: 100,
        },
      });

      await prisma.campBookings.create({
        data: {
          campSiteId: camp.id,
          checkInDate: new Date(),
          checkOutDate: new Date(Date.now() + 86400000),
          adults: 2,
          totalPrice: 200,
          bookingStatus: 'BOOKED',
          createdAt: new Date(),
        },
      });

      // 4. Request /dashboard as Admin
      const dashRes = await request(app.getHttpServer())
        .get('/dashboard')
        .set('Cookie', adminSessionCookie);

      expect(dashRes.status).toBe(200);
      expect(dashRes.body.data.stats).toBeDefined();
      expect(dashRes.body.data.stats.totalCampsites).toBeGreaterThanOrEqual(1);
      expect(dashRes.body.data.stats.monthlyBookings).toBeGreaterThanOrEqual(1);
      expect(Number(dashRes.body.data.stats.monthlyRevenue)).toBeGreaterThanOrEqual(200);
    });

    it('/dashboard (GET) - should reject standard USER due to RoleGuard', async () => {
      // 1. Create normal USER in DB
      const user = await prisma.user.create({
        data: {
          fullName: 'Standard User',
          email: 'regular@campora.com',
          phoneNumber: '9800001111',
          userType: 'USER',
        },
      });

      // 2. Create Session for standard user
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const regularUserCookie = `sessionId=${session.id}`;

      // 3. Request /dashboard as standard USER
      const res = await request(app.getHttpServer())
        .get('/dashboard')
        .set('Cookie', regularUserCookie);

      expect(res.status).toBe(403);
    });
  });
});
