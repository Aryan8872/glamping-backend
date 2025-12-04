/**
 * Generate booking confirmation email HTML template
 * @param {Object} bookingData - Booking information
 * @returns {string} HTML email template
 */
export const generateBookingConfirmationEmail = (bookingData) => {
  const {
    bookingId,
    guestName,
    campSiteName,
    checkInDate,
    checkOutDate,
    adults,
    children = 0,
    pets = 0,
    totalPrice,
    nights,
  } = bookingData;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Booking Confirmed! 🎉</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Your adventure awaits</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong>${guestName}</strong>,
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Great news! Your booking has been successfully confirmed. We're excited to host you at <strong>${campSiteName}</strong>.
              </p>

              <!-- Booking Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="color: #667eea; margin: 0 0 20px 0; font-size: 20px;">Booking Details</h2>
                    
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding: 8px 0;">Booking ID:</td>
                        <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">#${bookingId}</td>
                      </tr>
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding: 8px 0;">Campsite:</td>
                        <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">${campSiteName}</td>
                      </tr>
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding: 8px 0;">Check-in:</td>
                        <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">${new Date(
                          checkInDate
                        ).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}</td>
                      </tr>
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding: 8px 0;">Check-out:</td>
                        <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">${new Date(
                          checkOutDate
                        ).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}</td>
                      </tr>
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding: 8px 0;">Duration:</td>
                        <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">${nights} night${
    nights > 1 ? "s" : ""
  }</td>
                      </tr>
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding: 8px 0;">Guests:</td>
                        <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">${adults} Adult${
    adults > 1 ? "s" : ""
  }${children > 0 ? `, ${children} Child${children > 1 ? "ren" : ""}` : ""}${
    pets > 0 ? `, ${pets} Pet${pets > 1 ? "s" : ""}` : ""
  }</td>
                      </tr>
                      <tr style="border-top: 2px solid #dee2e6;">
                        <td style="color: #667eea; font-size: 16px; font-weight: bold; padding: 15px 0 0 0;">Total Amount:</td>
                        <td style="color: #667eea; font-size: 18px; font-weight: bold; text-align: right; padding: 15px 0 0 0;">$${totalPrice.toFixed(
                          2
                        )}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Important Information -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 30px; border-radius: 4px;">
                <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;">
                  <strong>📌 Important:</strong> Please arrive during check-in hours and bring a valid ID. Contact us if you need to modify your booking.
                </p>
              </div>

              <!-- Call to Action -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">View Booking Details</a>
                  </td>
                </tr>
              </table>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                Questions? Contact us at <a href="mailto:support@example.com" style="color: #667eea; text-decoration: none;">support@example.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="color: #999999; font-size: 12px; margin: 0; line-height: 1.6;">
                This is an automated confirmation email. Please do not reply to this message.
              </p>
              <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                © ${new Date().getFullYear()} Glamping Reservations. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
