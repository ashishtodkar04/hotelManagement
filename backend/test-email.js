const nodemailer = require('nodemailer');
require('dotenv').config({ path: 'e:/hotelManagement/backend/.env' });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

async function testMail() {
    try {
        console.log("Email:", process.env.EMAIL);
        let info = await transporter.sendMail({
            from: process.env.EMAIL,
            to: process.env.EMAIL,
            subject: "Test Email",
            text: "This is a test email."
        });
        console.log("Success:", info.response);
    } catch (err) {
        console.error("Error:", err.message);
    }
}
testMail();
