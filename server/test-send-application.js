#!/usr/bin/env node
import 'dotenv/config';
import { sendApplicationEmail } from './services/emailService.js';

const application = {
    id: 'test-application-001',
    full_name: 'Test Volunteer',
    email: 'test-volunteer@example.com',
    phone: '01234 567890',
    role: 'Volunteer Helper',
    referee_name: 'Referee Name'
};

// Minimal PDF-like buffer for attachment testing
const pdfBuffer = Buffer.from('This is a test PDF content for application.');

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
