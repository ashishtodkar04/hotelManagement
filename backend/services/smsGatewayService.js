const db = require('../config/db');

/**
 * Queue an outgoing SMS to be sent by the Android App Gateway.
 * @param {string} phoneNumber - The user's phone number
 * @param {string} message - The SMS text to send
 */
async function queueOutgoingSms(phoneNumber, message) {
    if (!phoneNumber || !message) return false;

    // Clean phone number (remove non-digits, ensure length)
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (cleanedPhone.length < 10) return false;

    try {
        await db.execute(
            'INSERT INTO outgoing_sms (phone_number, message, status) VALUES (?, ?, "pending")',
            [cleanedPhone, message]
        );
        console.log(`[SMS-GATEWAY] Queued SMS for ${cleanedPhone}`);
        return true;
    } catch (err) {
        console.error('[SMS-GATEWAY] Failed to queue SMS:', err.message);
        return false;
    }
}

module.exports = { queueOutgoingSms };
