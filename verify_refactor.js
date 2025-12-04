import { createCampSchema } from "./modules/camps/campValidation.js";
import { createBlogSchema } from "./modules/blogs/blogValidation.js";
import { createDiscountSchema } from "./modules/discount/discountValidation.js";
import { createAdventureSchema } from "./modules/adventure/adventureValidation.js";
import { createUserSchema } from "./modules/user/userValidation.js";
import { createBookingSchema } from "./modules/bookings/bookingValidation.js";
import { createFacilitySchema } from "./modules/facility/facilityValidation.js";
import { createGallerySchema } from "./modules/gallery/galleryValidation.js";
import { updateContactSchema } from "./modules/contact/contactValidation.js";
import { updateAboutUsSchema } from "./modules/aboutUs/aboutUsValidation.js";

const verifySchemas = () => {
  console.log("Verifying All Zod Schemas...\n");

  try {
    // Camp
    createCampSchema.parse({
      name: "Test Camp",
      description: "A very long description for testing purposes",
      pricePerNight: 100,
    });
    console.log("✅ Camp Schema Valid");

    // Blog
    createBlogSchema.parse({
      title: "Test Blog Title",
      excerpt: "This is a short excerpt for the blog.",
      content:
        "This is the full content of the blog post, which must be longer.",
      author: "Test Author",
    });
    console.log("✅ Blog Schema Valid");

    // Discount
    createDiscountSchema.parse({
      name: "Summer Sale",
      type: "PERCENTAGE",
      amount: 15,
      startsAt: new Date(),
    });
    console.log("✅ Discount Schema Valid");

    // Adventure
    createAdventureSchema.parse({
      name: "Hiking",
      description: "Hiking in the mountains",
      title: "Mountain Hiking",
      pageDescription: "Experience the thrill of hiking.",
    });
    console.log("✅ Adventure Schema Valid");

    // User
    createUserSchema.parse({
      fullName: "John Doe",
      email: "john@example.com",
      phoneNumber: "1234567890",
    });
    console.log("✅ User Schema Valid");

    // Booking
    createBookingSchema.parse({
      checkInDate: "2023-12-25",
      checkOutDate: "2023-12-30",
      adults: 2,
      campSiteId: 1,
      totalPrice: 500,
    });
    console.log("✅ Booking Schema Valid");

    // Facility
    createFacilitySchema.parse({
      name: "WiFi",
      icon: "wifi-icon",
    });
    console.log("✅ Facility Schema Valid");

    // Gallery
    createGallerySchema.parse({
      title: "Summer Gallery",
    });
    console.log("✅ Gallery Schema Valid");

    // Contact
    updateContactSchema.parse({
      email: "contact@example.com",
      phoneNumber: "1234567890",
    });
    console.log("✅ Contact Schema Valid");

    // AboutUs
    updateAboutUsSchema.parse({
      title: "About Our Company",
      mission: "Our mission statement",
    });
    console.log("✅ AboutUs Schema Valid");

    console.log("\n🎉 All schemas validated successfully!");
  } catch (error) {
    console.error("❌ Schema Verification Failed:", error.errors);
    process.exit(1);
  }
};

verifySchemas();
