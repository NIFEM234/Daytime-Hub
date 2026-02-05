#!/usr/bin/env node
import 'dotenv/config';
import { sendContactEmail } from './services/emailService.js';

// Lightweight test script to send a contact email using existing env vars.
// Usage: from the `server` folder run `node test-send-email.js`

const contact = {
    name: 'Local Test User',
    email: 'local-test@example.com',
    phone: '',
    subject: 'Local SMTP test',
    message: 'This is a test message sent by test-send-email.js'
};

(async () => {
    try {
        console.log('Sending test contact email...');
        await sendContactEmail(contact, null);
        console.log('Test email sent — check the recipient inbox (and spam).');
    } catch (err) {
        console.error('Test send failed:');
        console.error(err && err.message ? err.message : err);
        // If nodemailer/SendGrid response available, show it for debugging
        if (err && err.response) console.error('Response:', err.response);
        process.exitCode = 1;
    }
    process.exit();
})();
