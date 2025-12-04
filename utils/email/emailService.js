import nodemailer from "nodemailer";
import { generateBookingConfirmationEmail } from "./templates/bookingConfirmation.js";

/**
 * Create email transporter
 * Supports Gmail, custom SMTP, or test account
 */
const createTransporter = () => {
  const emailConfig = {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  };

  // If no credentials provided, log warning
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn(
      "⚠️  Email credentials not configured. Emails will not be sent."
    );
    console.warn("   Add EMAIL_USER and EMAIL_PASSWORD to your .env file");
    return null;
  }

  return nodemailer.createTransport(emailConfig);
};

/**
 * Send booking confirmation email
 * @param {Object} bookingDetails - Booking information
 * @param {string} recipientEmail - Email address to send to
 * @returns {Promise<Object>} Email send result
 */
export const sendBookingConfirmationEmail = async (
  bookingDetails,
  recipientEmail
) => {
  try {
    const transporter = createTransporter();

    // If transporter is null (no credentials), skip sending
    if (!transporter) {
      console.log(
        `📧 Email would be sent to: ${recipientEmail} (skipped - no credentials)`
      );
      return {
        success: false,
        skipped: true,
        message: "Email credentials not configured",
      };
    }

    const emailHtml = generateBookingConfirmationEmail(bookingDetails);

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || "Glamping Reservations",
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      },
      to: recipientEmail,
      subject: `Booking Confirmed - ${bookingDetails.campSiteName} 🏕️`,
      html: emailHtml,
      // Optional: Add plain text version
      text: `
Hi ${bookingDetails.guestName},

Your booking has been confirmed!

Booking Details:
- Booking ID: #${bookingDetails.bookingId}
- Campsite: ${bookingDetails.campSiteName}
- Check-in: ${new Date(bookingDetails.checkInDate).toLocaleDateString()}
- Check-out: ${new Date(bookingDetails.checkOutDate).toLocaleDateString()}
- Guests: ${bookingDetails.adults} Adult(s)${
        bookingDetails.children ? `, ${bookingDetails.children} Child(ren)` : ""
      }
- Total: $${bookingDetails.totalPrice.toFixed(2)}

We look forward to hosting you!

Questions? Contact us at support@example.com
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Booking confirmation email sent to: ${recipientEmail}`);
    console.log(`   Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      recipient: recipientEmail,
    };
  } catch (error) {
    console.error(
      `❌ Failed to send booking confirmation email to ${recipientEmail}:`,
      error.message
    );

    // Don't throw error - we don't want email failures to break booking creation
    return {
      success: false,
      error: error.message,
      recipient: recipientEmail,
    };
  }
};

/**
 * Verify email configuration
 * @returns {Promise<boolean>} True if email is configured correctly
 */
export const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      return false;
    }

    await transporter.verify();
    console.log("✅ Email service is ready");
    return true;
  } catch (error) {
    console.error("❌ Email service verification failed:", error.message);
    return false;
  }
};
