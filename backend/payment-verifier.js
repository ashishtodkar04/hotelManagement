const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
const db = require('./config/db'); 
const { processIncomingPayment } = require('./services/paymentService');

const config = {
    imap: {
        user: process.env.EMAIL,
        password: process.env.EMAIL_APP_PASSWORD,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 3000,
        tlsOptions: { rejectUnauthorized: false }
    }
};

async function checkEmailsForPayments(io) {
    console.log("[EMAIL-VERIFIER] Checking inbox...");
    
    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = [
            'UNSEEN',
            ['SINCE', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()]
        ];
        
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT'],
            markSeen: true 
        };

        const messages = await connection.search(searchCriteria, fetchOptions);

        for (let item of messages) {
            try {
                const headerPart = item.parts.find(p => p.which === 'HEADER');
                const textPart = item.parts.find(part => part.which === 'TEXT');
                
                if (!headerPart || !textPart) continue;

                const mail = await simpleParser(headerPart.body + textPart.body);
                const emailText = mail.text || mail.html || '';

                // Extract amount and UTR
                const amountMatch = emailText.match(/₹\s?([\d,]+(?:\.\d{1,2})?)/);
                const utrMatch = emailText.match(/(?:Transaction ID|UTR|Ref|ID):\s?([A-Z0-9]+)/i);

                if (amountMatch) {
                    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
                    const transactionId = utrMatch ? utrMatch[1] : null;
                    
                    // STRICT KEYWORD CHECK
                    const isCredit = /credited|received|deposited|added|transfer/i.test(emailText);
                    if (!isCredit) {
                        console.log(`[EMAIL-VERIFIER] ❌ Skipping: Not a credit email for ₹${amount}`);
                        continue;
                    }

                    console.log(`[EMAIL-VERIFIER] Detected Payment: ₹${amount} | TXN: ${transactionId}`);

                    // Process via Payment Service
                    await processIncomingPayment({
                        amount,
                        transactionId,
                        source: 'EMAIL',
                        rawText: emailText,
                        io
                    });
                }
            } catch (msgErr) {
                console.error("[EMAIL-VERIFIER] Failed to process message:", msgErr.message);
            }
        }
        
        connection.end();
    } catch (err) {
        console.error("[EMAIL-VERIFIER] IMAP Error:", err.message);
    }
}

function startEmailAutomation(io) {
    setInterval(() => checkEmailsForPayments(io), 120000); // Check every 2 mins
    checkEmailsForPayments(io);
}

module.exports = { startEmailAutomation };