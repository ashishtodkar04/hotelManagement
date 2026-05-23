const nodemailer = require('nodemailer');
const { HOTEL_NAME, HOTEL_TAGLINE, HOTEL_PHONE, HOTEL_YEAR } = require('../config/hotel');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

const sendBookingConfirmation = async (userEmail, bookingDetails, pdfBuffer = null) => {
    const { bookingRef, date, time, table, guests, amount, type } = bookingDetails;

    const isAdvance = type === 'advance';
    const subject = isAdvance
        ? `Reservation Confirmed: #${bookingRef} — ${HOTEL_NAME}`
        : `Payment Successful: #${bookingRef} — ${HOTEL_NAME}`;

    const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #0f172a; padding: 30px; text-align: center;">
            <h1 style="color: #fbbf24; margin: 0; font-size: 28px; letter-spacing: 1px;">${HOTEL_NAME.toUpperCase()}</h1>
            <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">${HOTEL_TAGLINE}</p>
        </div>

        <div style="padding: 40px 30px;">
            <h2 style="color: #1e293b; margin-top: 0;">Hello,</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                ${isAdvance
                    ? `Great news! Your reservation at ${HOTEL_NAME} has been officially confirmed. We've received your advance payment and your table is waiting.`
                    : `Thank you for dining with us at ${HOTEL_NAME}! We have received your final bill payment. We hope you enjoyed your meal.`}
            </p>

            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 30px 0; border: 1px dashed #cbd5e1;">
                <table style="width: 100%; font-size: 14px;">
                    <tr>
                        <td style="color: #64748b; padding: 5px 0;">Booking Reference:</td>
                        <td style="color: #0f172a; font-weight: bold; text-align: right;">#${bookingRef}</td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; padding: 5px 0;">Date:</td>
                        <td style="color: #0f172a; font-weight: bold; text-align: right;">${date}</td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; padding: 5px 0;">Time:</td>
                        <td style="color: #0f172a; font-weight: bold; text-align: right;">${time}</td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; padding: 5px 0;">Table:</td>
                        <td style="color: #0f172a; font-weight: bold; text-align: right;">${table}</td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; padding: 5px 0;">Guests:</td>
                        <td style="color: #0f172a; font-weight: bold; text-align: right;">${guests} Pax</td>
                    </tr>
                    <tr style="border-top: 1px solid #e2e8f0;">
                        <td style="color: #64748b; padding: 15px 0 5px 0;">Amount Received:</td>
                        <td style="color: #10b981; font-weight: 900; font-size: 18px; text-align: right; padding-top: 10px;">₹${amount}</td>
                    </tr>
                </table>
            </div>

            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                If you have any questions or need to modify your booking, please call us at ${HOTEL_PHONE}.
            </p>

            <div style="text-align: center; margin-top: 40px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard"
                   style="background-color: #fbbf24; color: #000000; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">
                    View My Bookings
                </a>
            </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                &copy; ${HOTEL_YEAR} ${HOTEL_NAME}. All rights reserved.<br>
                This is an automated message, please do not reply.
            </p>
        </div>
    </div>
    `;

    try {
        const mailOptions = {
            from: `"${HOTEL_NAME}" <${process.env.EMAIL}>`,
            to: userEmail,
            subject: subject,
            html: htmlContent
        };

        if (pdfBuffer) {
            mailOptions.attachments = [
                {
                    filename: `Invoice_${bookingRef}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ];
        }

        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Confirmation sent to ${userEmail}`);
    } catch (err) {
        console.error(`[EMAIL] Failed to send to ${userEmail}:`, err.message);
    }
};

const sendRegistrationEmail = async (userEmail, userName, password) => {
    const subject = `Welcome to ${HOTEL_NAME} — Your Sovereign Access Details`;

    const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #0f172a; padding: 30px; text-align: center;">
            <h1 style="color: #fbbf24; margin: 0; font-size: 28px; letter-spacing: 1px;">${HOTEL_NAME.toUpperCase()}</h1>
            <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">${HOTEL_TAGLINE}</p>
        </div>

        <div style="padding: 40px 30px;">
            <h2 style="color: #1e293b; margin-top: 0;">Namaste, ${userName}!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Welcome to the inner circle of ${HOTEL_NAME}. We've established your digital identity via Google.
            </p>

            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 30px 0; border: 1px dashed #cbd5e1;">
                <p style="color: #64748b; font-size: 14px; margin-bottom: 10px;">Your Sovereign Security Credentials:</p>
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; text-align: center;">
                    <span style="font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0f172a;">${password}</span>
                </div>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 10px; font-style: italic;">
                    * You can change this password anytime in your dashboard security settings.
                </p>
            </div>

            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                Use this password if you ever wish to bridge to your account without Google authentication.
            </p>

            <div style="text-align: center; margin-top: 40px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth"
                   style="background-color: #fbbf24; color: #000000; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">
                    Bridge to Dashboard
                </a>
            </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                &copy; ${HOTEL_YEAR} ${HOTEL_NAME}. All rights reserved.<br>
                This is an automated message, please do not reply.
            </p>
        </div>
    </div>
    `;

    try {
        await transporter.sendMail({
            from: `"${HOTEL_NAME}" <${process.env.EMAIL}>`,
            to: userEmail,
            subject: subject,
            html: htmlContent
        });
        console.log(`[EMAIL] Registration email sent to ${userEmail}`);
    } catch (err) {
        console.error(`[EMAIL] Failed to send registration email to ${userEmail}:`, err.message);
    }
};

module.exports = { sendBookingConfirmation, sendRegistrationEmail };

