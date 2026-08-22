import { PrismaClient, UserType, UserStatus, DiscountType, BlogStatus, GalleryStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgrespass@localhost:5432/glamping?schema=public';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log('\n======================================================');
  console.log('  🌱 SEEDING CAMPORA PRODUCTION & DEMO DATA');
  console.log('======================================================\n');

  // 1. Clean existing records in dependency order
  console.log('🧹 Cleaning old data...');
  await prisma.campSiteExperience.deleteMany();
  await prisma.campSiteAdventure.deleteMany();
  await prisma.campSiteFacility.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.campBookings.deleteMany();
  await prisma.campSite.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.adventure.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.destination.deleteMany();
  await prisma.gallery.deleteMany();
  await prisma.blog.deleteMany();
  await prisma.coreValue.deleteMany();
  await prisma.stat.deleteMany();
  await prisma.aboutUs.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.session.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users & Hosts
  console.log('👥 Seeding Users & SuperAdmin...');
  const passwordHash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.create({
    data: {
      fullName: 'Super Administrator',
      email: 'admin@campora.com',
      phoneNumber: '+977-9841000001',
      password: passwordHash,
      userType: UserType.SUPERADMIN,
      userStatus: UserStatus.ENABLED,
      isFeatured: true,
      yearsOfExperience: 10,
      hostTagline: 'Master Wilderness Expedition Leader',
      profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    },
  });

  const hostTenzing = await prisma.user.create({
    data: {
      fullName: 'Tenzing Sherpa',
      email: 'tenzing@campora.com',
      phoneNumber: '+977-9841000002',
      password: passwordHash,
      userType: UserType.CAMPHOST,
      userStatus: UserStatus.ENABLED,
      isFeatured: true,
      yearsOfExperience: 14,
      hostTagline: 'High Altitude Glamping Expert',
      profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    },
  });

  const hostMaya = await prisma.user.create({
    data: {
      fullName: 'Maya Gurung',
      email: 'maya@campora.com',
      phoneNumber: '+977-9841000003',
      password: passwordHash,
      userType: UserType.CAMPHOST,
      userStatus: UserStatus.ENABLED,
      isFeatured: true,
      yearsOfExperience: 8,
      hostTagline: 'Annapurna Valley Host & Botanist',
      profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
    },
  });

  // 3. Seed Destinations
  console.log('🏔️ Seeding Destinations...');
  const destEverest = await prisma.destination.create({
    data: {
      name: 'Everest Region',
      slug: 'everest-region',
      title: 'Roof of the World',
      description: 'Experience majestic towering peaks, pristine glacial valleys, and the legendary Sherpa culture.',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=800&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1600&auto=format&fit=crop',
    },
  });

  const destAnnapurna = await prisma.destination.create({
    data: {
      name: 'Annapurna Sanctuary',
      slug: 'annapurna-sanctuary',
      title: 'Lush Alpine Vistas',
      description: 'Lush rhododendron forests opening into dramatic mountain amphitheaters under Annapurna South.',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1585409677983-0f6c41ca0f33?q=80&w=800&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1585409677983-0f6c41ca0f33?q=80&w=1600&auto=format&fit=crop',
    },
  });

  const destMustang = await prisma.destination.create({
    data: {
      name: 'Mustang Valley',
      slug: 'mustang-valley',
      title: 'The Forbidden Kingdom',
      description: 'Dramatic desert canyons, ancient cliff caves, and windswept Buddhist monasteries.',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600&auto=format&fit=crop',
    },
  });

  // 4. Seed Experiences
  console.log('⛺ Seeding Experiences...');
  const expStargazing = await prisma.experience.create({
    data: {
      title: 'Stargazing & Astrology Domes',
      name: 'Stargazing Domes',
      slug: 'stargazing-domes',
      description: 'Sleep under crystal-clear Himalayan skies with heated geodesic glass domes.',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=800&auto=format&fit=crop',
    },
  });

  const expRiverside = await prisma.experience.create({
    data: {
      title: 'Riverside Safari Tents',
      name: 'Riverside Glamping',
      slug: 'riverside-glamping',
      description: 'Listen to the soothing rush of mountain rivers with luxury wooden deck tents.',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800&auto=format&fit=crop',
    },
  });

  const expForest = await prisma.experience.create({
    data: {
      title: 'Pine Forest Eco Cabins',
      name: 'Forest Cabins',
      slug: 'forest-cabins',
      description: 'Secluded sustainable cabins immersed in fragrant Himalayan pine canopies.',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=800&auto=format&fit=crop',
    },
  });

  // 5. Seed Facilities
  console.log('🔥 Seeding Facilities...');
  const facWifi = await prisma.facility.create({
    data: { name: 'High-Speed Starlink WiFi', slug: 'starlink-wifi', icon: 'wifi', description: 'Blazing fast satellite internet' },
  });
  const facHeater = await prisma.facility.create({
    data: { name: 'Heated Mattress & Fireplace', slug: 'heating', icon: 'fire', description: 'Cozy alpine heating' },
  });
  const facBath = await prisma.facility.create({
    data: { name: 'Private Luxury Ensuite', slug: 'ensuite-bath', icon: 'bath', description: 'Hot spring water shower' },
  });
  const facDining = await prisma.facility.create({
    data: { name: 'Organic Mountain Dining', slug: 'organic-dining', icon: 'utensils', description: 'Farm-to-table gourmet meals' },
  });

  // 6. Seed Adventures
  console.log('🧗 Seeding Adventures...');
  const advHeli = await prisma.adventure.create({
    data: {
      name: 'Everest Heli-Glamping Safari',
      slug: 'everest-heli-glamping',
      title: 'Flight over Nuptse & Lhotse',
      description: 'Private helicopter transfers with champagne breakfast overlooking Mount Everest.',
      pageDescription: 'Take your luxury outdoor holiday to new heights with our premier Himalayan helicopter journey.',
      coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=800&auto=format&fit=crop',
      bannerImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1600&auto=format&fit=crop',
      isActive: true,
    },
  });

  const advRafting = await prisma.adventure.create({
    data: {
      name: 'Trishuli River Luxury Descent',
      slug: 'trishuli-river-descent',
      title: 'White Water & White Sand Glamping',
      description: 'Paddle world-class rapids by day, relax in private luxury riverside cabanas by night.',
      pageDescription: 'Combine adrenaline and pure tranquility along Nepal’s most scenic alpine waterway.',
      coverImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800&auto=format&fit=crop',
      bannerImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1600&auto=format&fit=crop',
      isActive: true,
    },
  });

  // 7. Seed Campsites
  console.log('🏕️ Seeding Campsites...');
  const camp1 = await prisma.campSite.create({
    data: {
      name: 'Everest Panoramic Celestial Dome',
      slug: 'everest-celestial-dome',
      description: 'Perched high in the Solukhumbu highlands, this custom heated geodesic dome offers unmatched 360-degree views of Ama Dablam and Everest. Includes butler service and astronomy telescope.',
      pricePerNight: 280.00,
      isAvailable: true,
      isFeatured: true,
      location: 'Namche Highlands, Solukhumbu',
      latitude: 27.8069,
      longitude: 86.7140,
      maxAdult: 4,
      maxChildren: 2,
      maxPets: 1,
      hostId: hostTenzing.id,
      destinationId: destEverest.id,
      images: [
        'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1000&auto=format&fit=crop',
      ],
      campSiteFacilities: {
        create: [
          { facilityId: facWifi.id },
          { facilityId: facHeater.id },
          { facilityId: facBath.id },
          { facilityId: facDining.id },
        ],
      },
      experiences: {
        create: [{ experienceId: expStargazing.id }],
      },
      adventures: {
        create: [{ adventureId: advHeli.id }],
      },
    },
  });

  const camp2 = await prisma.campSite.create({
    data: {
      name: 'Annapurna Valley Pine Sanctuary',
      slug: 'annapurna-pine-sanctuary',
      description: 'Nestled deep in the pine forests of Ghandruk with private wooden decks facing the snow-capped Annapurna range.',
      pricePerNight: 195.00,
      isAvailable: true,
      isFeatured: true,
      location: 'Ghandruk, Kaski, Nepal',
      latitude: 28.3756,
      longitude: 83.8080,
      maxAdult: 3,
      maxChildren: 2,
      maxPets: 0,
      hostId: hostMaya.id,
      destinationId: destAnnapurna.id,
      images: [
        'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=1000&auto=format&fit=crop',
      ],
      campSiteFacilities: {
        create: [
          { facilityId: facWifi.id },
          { facilityId: facHeater.id },
          { facilityId: facDining.id },
        ],
      },
      experiences: {
        create: [{ experienceId: expForest.id }],
      },
    },
  });

  const camp3 = await prisma.campSite.create({
    data: {
      name: 'Mustang Canyon Safari Lodge',
      slug: 'mustang-canyon-safari-lodge',
      description: 'Luxury desert glamping situated on the red clay ridges of Upper Mustang, featuring traditional Tibetan woven interiors and open-fire barbecue nights.',
      pricePerNight: 220.00,
      isAvailable: true,
      isFeatured: true,
      location: 'Lo Manthang, Upper Mustang',
      latitude: 29.1825,
      longitude: 83.9567,
      maxAdult: 4,
      maxChildren: 2,
      maxPets: 1,
      hostId: hostTenzing.id,
      destinationId: destMustang.id,
      images: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1000&auto=format&fit=crop',
      ],
      campSiteFacilities: {
        create: [
          { facilityId: facWifi.id },
          { facilityId: facBath.id },
          { facilityId: facDining.id },
        ],
      },
      experiences: {
        create: [{ experienceId: expRiverside.id }],
      },
      adventures: {
        create: [{ adventureId: advRafting.id }],
      },
    },
  });

  // 8. Seed Discounts
  console.log('🏷️ Seeding Featured Discount Offer...');
  await prisma.discount.create({
    data: {
      name: 'Autumn Himalayan Escape Offer',
      description: 'Save 20% on all luxury dome retreats booked for this season.',
      type: DiscountType.PERCENTAGE,
      amount: 20,
      active: true,
      isFeatured: true,
      campId: camp1.id,
      adventureId: advHeli.id,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 9. Seed Sample Bookings
  console.log('📅 Seeding Sample Bookings...');
  const now = new Date();
  const checkIn1 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const checkOut1 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  await prisma.campBookings.create({
    data: {
      campSiteId: camp1.id,
      checkInDate: checkIn1,
      checkOutDate: checkOut1,
      adults: 2,
      guestUserFullName: 'Alexander Wright',
      guestUserEmail: 'alex.wright@example.com',
      guestUserPhoneNumber: '+1-555-0199',
      totalPrice: 840.00,
      bookingStatus: 'BOOKED',
      paymentStatus: 'CLEARED',
    },
  });

  // 10. Seed Blogs
  console.log('📰 Seeding Blogs...');
  await prisma.blog.create({
    data: {
      title: 'The Ultimate Guide to Luxury Glamping in the Himalayas',
      slug: 'ultimate-guide-luxury-glamping-himalayas',
      excerpt: 'Everything you need to know about high altitude luxury camping domes, essential packing, and star-gazing.',
      content: 'Glamping in the Himalayas combines raw alpine wonder with five-star hospitality. From heated glass geodesic domes overlooking Everest to gourmet organic Sherpa dining, here is your complete 2026 traveler guide...',
      author: 'Campora Expeditions',
      status: BlogStatus.PUBLISHED,
      metaTitle: 'Ultimate Himalayan Glamping Guide 2026 | Campora',
      metaDescription: 'Complete beginner guide to high altitude luxury glamping.',
      metaKeywords: 'himalayas, glamping, nepal, everest, luxury camping',
      coverImage: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=1000&auto=format&fit=crop',
      tags: ['Guide', 'Himalayas', 'Glamping', 'Everest'],
    },
  });

  // 11. Seed Gallery
  console.log('🖼️ Seeding Gallery...');
  await prisma.gallery.create({
    data: {
      title: 'Celestial Nights & Mountain Lights',
      slug: 'celestial-nights-mountain-lights',
      description: 'Captured under moonlit summits and shooting stars across our Himalayan glamping sanctuaries.',
      excerpt: 'Visual poetry of Himalayan night skies.',
      galleryStatus: GalleryStatus.PUBLISHED,
      coverImage: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=1000&auto=format&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1000&auto=format&fit=crop',
      ],
    },
  });

  // 12. Seed AboutUs & Contact
  console.log('🏢 Seeding About Us & Contact Info...');
  await prisma.aboutUs.create({
    data: {
      id: 1,
      aboutUs: 'Campora is Nepal’s pioneering luxury wilderness and glamping network, curating unforgettable Himalayan retreats that respect local communities and preserve pristine alpine ecosystems.',
      textbox_1: 'Pioneering Sustainable Luxury Hospitality',
      textbox_2: 'Over 10,000+ happy adventurers hosted since 2020',
      mission: 'To bridge untouched wilderness with unparalleled comfort while empowering local indigenous mountain communities.',
      vision: 'To establish the world standard for eco-conscious high-altitude glamping.',
      stats: {
        create: [
          { heading: 'Destinations', value: '12+', icon: 'map-pin' },
          { heading: 'Luxury Camps', value: '45+', icon: 'tent' },
          { heading: 'Happy Guests', value: '15,000+', icon: 'users' },
          { heading: 'Star Rating', value: '4.95', icon: 'star' },
        ],
      },
      coreValues: {
        create: [
          { title: 'Eco-Conscious Wilderness', description: 'Zero single-use plastics and 100% solar-assisted heating.', icon: 'leaf' },
          { title: 'Authentic Hospitality', description: 'Warm local hosts sharing rich cultural heritage.', icon: 'heart' },
        ],
      },
    },
  });

  await prisma.contact.create({
    data: {
      id: 1,
      email: 'hello@campora.com',
      phoneNumber: '+977-1-4439000',
      address: 'Campora HQ, Lakeside Boulevard, Pokhara & Thamel, Kathmandu',
      facebookUrl: 'https://facebook.com/campora',
      instagramUrl: 'https://instagram.com/campora',
      twitterUrl: 'https://twitter.com/campora',
    },
  });

  console.log('\n======================================================');
  console.log('  ✨ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('  SuperAdmin Login: admin@campora.com / admin123');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
