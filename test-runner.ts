import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from './src/app.module.js';
import { PrismaService } from './src/prisma/prisma.service.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    process.stdout.write(`  ⏳ ${name}... `);
    await fn();
    console.log(`\x1b[32m✔ PASSED\x1b[0m`);
    passedTests++;
  } catch (err: any) {
    console.log(`\x1b[31m✖ FAILED\x1b[0m`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('  🚀 RUNNING CAMPORA NESTJS FULL E2E TEST SUITE');
  console.log('======================================================\n');

  process.env.DATABASE_URL =
    process.env.DATABASE_URL_TEST ||
    'postgresql://postgres:postgrespass@localhost:5432/glamping_test';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication = moduleFixture.createNestApplication();
  app.use(cookieParser());

  // Guards are now auto-registered via APP_GUARD in AppModule — no manual registration needed.

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.init();
  const server = app.getHttpServer();
  const prisma = app.get(PrismaService);

  async function cleanDb() {
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
  }

  // Create an Admin session helper for protected endpoints
  async function createAdminSession(): Promise<string> {
    const admin = await prisma.user.create({
      data: {
        fullName: 'Admin User',
        email: `admin-${Date.now()}@campora.com`,
        phoneNumber: '9841000000',
        userType: 'SUPERADMIN',
      },
    });

    const session = await prisma.session.create({
      data: {
        userId: admin.id,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    return `sessionId=${session.id}`;
  }

  console.log('👉 [1/5] AUTHENTICATION & USER MANAGEMENT MODULE');
  await cleanDb();

  let userSessionCookie = '';

  await test('POST /auth/register - Register a new user', async () => {
    const res = await request(server).post('/auth/register').send({
      fullName: 'Alice Camper',
      email: 'alice@example.com',
      password: 'Password123!',
      phoneNumber: '9841000001',
    });
    assert(res.status === 201, `Expected status 201, got ${res.status}`);
    assert(res.body.message === 'Registration successful', 'Expected success message');
    assert(res.body.data.email === 'alice@example.com', 'Email matching');
  });

  await test('POST /auth/register - Reject duplicate email registration', async () => {
    const res = await request(server).post('/auth/register').send({
      fullName: 'Alice Duplicate',
      email: 'alice@example.com',
      password: 'Password123!',
      phoneNumber: '9841000002',
    });
    assert(res.status === 400, `Expected status 400, got ${res.status}`);
  });

  await test('POST /auth/login - Login user and issue session cookie', async () => {
    const res = await request(server).post('/auth/login').send({
      email: 'alice@example.com',
      password: 'Password123!',
    });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    assert(!!cookies, 'Cookie headers missing');
    userSessionCookie = cookies.find((c) => c.startsWith('sessionId='))!;
    assert(!!userSessionCookie, 'sessionId cookie missing');
  });

  await test('GET /auth/me - Access protected user profile with session cookie', async () => {
    const res = await request(server).get('/auth/me').set('Cookie', userSessionCookie);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(res.body.data.email === 'alice@example.com', 'User email matching');
  });

  await test('GET /auth/me - Reject unauthenticated access', async () => {
    const res = await request(server).get('/auth/me');
    assert(res.status === 401, `Expected status 401, got ${res.status}`);
  });

  console.log('\n👉 [2/5] CAMPSITES & DISCOVERY MODULE');
  await cleanDb();

  let campId = 0;
  const adminCookie = await createAdminSession();

  await test('POST /campsite/new - Create new campsite with facilities and metadata', async () => {
    const facility = await prisma.facility.create({
      data: { name: 'WiFi & Stargazing', slug: 'wifi-stargazing', icon: 'wifi.png' },
    });

    const res = await request(server)
      .post('/campsite/new')
      .set('Cookie', adminCookie)
      .send({
        name: 'Himalayan Luxury Glamping',
        description: 'Stunning mountain views with full amenities and bonfire',
        pricePerNight: 150,
        location: 'Nagarkot Hills',
        facilities: [facility.id],
        maxAdult: 4,
        maxChildren: 2,
        maxPets: 1,
        isFeatured: true,
      });

    assert(res.status === 201, `Expected status 201, got ${res.status}`);
    assert(res.body.data.name === 'Himalayan Luxury Glamping', 'Camp name matches');
    campId = res.body.data.id;
  });

  await test('GET /campsite/all - Fetch list of all campsites with pagination', async () => {
    const res = await request(server).get('/campsite/all');
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(res.body.data.length >= 1, 'Contains created camp');
  });

  await test('GET /campsite/:id - Fetch single campsite details', async () => {
    const res = await request(server).get(`/campsite/${campId}`);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(res.body.data.id === campId, 'Camp ID matches');
  });

  await test('PATCH /campsite/:id - Update campsite information', async () => {
    const res = await request(server)
      .patch(`/campsite/${campId}`)
      .set('Cookie', adminCookie)
      .send({
        name: 'Himalayan Luxury Glamping & Spa',
        pricePerNight: 180,
      });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(res.body.data.name === 'Himalayan Luxury Glamping & Spa', 'Name updated');
    assert(Number(res.body.data.pricePerNight) === 180, 'Price updated');
  });

  console.log('\n👉 [3/5] BOOKINGS & AVAILABILITY ENGINE');
  await cleanDb();

  let testCampId = 0;
  const checkIn = new Date(Date.now() + 86400000 * 3);
  const checkOut = new Date(Date.now() + 86400000 * 5);

  await test('POST /booking/new - Create a verified campsite booking with price computation', async () => {
    const camp = await prisma.campSite.create({
      data: {
        name: 'Riverbank Glamp',
        slug: 'riverbank-glamp',
        description: 'Serene riverside glamping',
        pricePerNight: 90,
        maxAdult: 2,
        maxChildren: 1,
        isAvailable: true,
      },
    });
    testCampId = camp.id;

    const res = await request(server).post('/booking/new').send({
      campSiteId: camp.id,
      checkInDate: checkIn.toISOString(),
      checkOutDate: checkOut.toISOString(),
      adults: 2,
      guestUserFullName: 'Bob Smith',
      guestUserEmail: 'bob@example.com',
      guestUserPhoneNumber: '9841999888',
    });

    assert(res.status === 201, `Expected status 201, got ${res.status}`);
    assert(res.body.data.bookingStatus === 'BOOKED', 'Status is BOOKED');
    assert(Number(res.body.data.totalPrice) === 180, 'Total price is $180 for 2 nights');
  });

  await test('GET /booking/availability/:campId - Check date range availability', async () => {
    const res = await request(server)
      .get(`/booking/availability/${testCampId}`)
      .query({
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
      });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(res.body.data[0].remainingSlots === 1, 'Camp remaining slots computed accurately');
  });

  await test('POST /booking/new - Prevent overcapacity booking collision', async () => {
    // Attempt to book 2 adults when only 1 slot is left
    const res = await request(server).post('/booking/new').send({
      campSiteId: testCampId,
      checkInDate: checkIn.toISOString(),
      checkOutDate: checkOut.toISOString(),
      adults: 2,
      guestUserFullName: 'Charlie Clash',
      guestUserEmail: 'charlie@example.com',
      guestUserPhoneNumber: '9841999889',
    });
    assert(res.status === 409, `Expected status 409 Conflict, got ${res.status}`);
  });

  console.log('\n👉 [4/5] BLOGS, DESTINATIONS, EXPERIENCES & CONTACT');
  await cleanDb();

  const blogAdminCookie = await createAdminSession();

  await test('POST /blog/new & GET /blog/all - Publish and retrieve blog content', async () => {
    const res = await request(server)
      .post('/blog/new')
      .set('Cookie', blogAdminCookie)
      .send({
        title: 'Guide to Everest Region Trekking',
        excerpt: 'Essential gear and permits',
        content: 'Complete beginner guide to high altitude trekking...',
        author: 'Campora Guide',
        metaTitle: 'Everest Trek 2026',
        metaDescription: 'Complete 2026 guide',
        metaKeywords: 'everest, trekking, nepal',
        tags: ['everest', 'guide'],
      });
    assert(res.status === 201, `Expected status 201, got ${res.status}`);
    assert(res.body.data.title === 'Guide to Everest Region Trekking', 'Blog title matches');

    const all = await request(server).get('/blog/all');
    assert(all.status === 200, `Expected status 200, got ${all.status}`);
    assert(all.body.data.length >= 1, 'Blogs returned in list');
  });

  await test('POST /destination/new & GET /destination/all - Manage destinations', async () => {
    const res = await request(server)
      .post('/destination/new')
      .set('Cookie', blogAdminCookie)
      .send({
        name: 'Mustang Valley',
        title: 'The Forbidden Kingdom',
        description: 'Desert mountain landscapes with rich Tibetan culture',
        isFeatured: true,
      });
    assert(res.status === 201, `Expected status 201, got ${res.status}`);

    const all = await request(server).get('/destination/all');
    assert(all.status === 200, `Expected status 200, got ${all.status}`);
    assert(all.body.data.length >= 1, 'Destinations returned');
  });

  console.log('\n👉 [5/5] ADMIN DASHBOARD & ROLE-BASED ACCESS CONTROL');
  await cleanDb();

  await test('GET /dashboard - Allow SuperAdmin access with consolidated analytics', async () => {
    const admin = await prisma.user.create({
      data: {
        fullName: 'Lead Admin',
        email: 'superadmin@campora.com',
        phoneNumber: '9841000099',
        userType: 'SUPERADMIN',
      },
    });

    const session = await prisma.session.create({
      data: {
        userId: admin.id,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    const superAdminCookie = `sessionId=${session.id}`;

    const res = await request(server)
      .get('/dashboard')
      .set('Cookie', superAdminCookie);

    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(res.body.data.stats !== undefined, 'Stats object returned');
  });

  await test('GET /dashboard - Block standard USER access with 403 Forbidden', async () => {
    const normalUser = await prisma.user.create({
      data: {
        fullName: 'Regular User',
        email: 'regular@campora.com',
        phoneNumber: '9841000098',
        userType: 'USER',
      },
    });

    const session = await prisma.session.create({
      data: {
        userId: normalUser.id,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    const regularCookie = `sessionId=${session.id}`;

    const res = await request(server)
      .get('/dashboard')
      .set('Cookie', regularCookie);

    assert(res.status === 403, `Expected status 403 Forbidden, got ${res.status}`);
  });

  await prisma.$disconnect();
  await app.close();

  console.log('\n======================================================');
  console.log(`  📊 TEST RESULTS: \x1b[32m${passedTests} PASSED\x1b[0m, \x1b[31m${failedTests} FAILED\x1b[0m (Total: ${passedTests + failedTests})`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
