#!/usr/bin/env node
import 'dotenv/config';
import { sendApplicationEmail } from './services/emailService.js';

// Test script to send a fake volunteer application email.
// Usage: from the `server` folder run `node test-send-application.js`

const application = {
    id: 'test-app-1',
    full_name: 'Test Applicant',
    email: 'applicant@example.com',
    phone: '0123456789',
    role: 'Volunteer'
};

// Minimal dummy PDF buffer (the email service will attach base64 content)
const pdfBuffer = Buffer.from('%PDF-1.4\n% Dummy PDF for testing\n');

(async () => {
    try {
        console.log('Sending test volunteer application email...');
        await sendApplicationEmail(application, pdfBuffer, application.email);
        console.log('Test application email sent — check the recipient inbox (and spam).');
    } catch (err) {
        console.error('Test application send failed:');
        console.error(err && err.message ? err.message : err);
        if (err && err.response) console.error('Response:', err.response);
        process.exitCode = 1;
    }
    process.exit();
})();
