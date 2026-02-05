#!/usr/bin/env node
import 'dotenv/config';
import PDFDocument from 'pdfkit';
import { sendApplicationEmail } from './services/emailService.js';

// Lightweight test script to send a volunteer application email with a generated PDF attachment.
// Usage: from the `server` folder run `node test-send-volunteer-email.js`

function createSamplePdfBuffer(application) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(20).text('Volunteer Application', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Name: ${application.full_name}`);
        doc.text(`Email: ${application.email}`);
        doc.text(`Phone: ${application.phone || ''}`);
        doc.text(`Role: ${application.role || ''}`);
        doc.moveDown();
        doc.text('Message:');
        doc.text(application.message || 'No message provided.');

        doc.end();
    });
}

const application = {
    id: 'test-12345',
    full_name: 'Test Volunteer',
    email: 'volunteer.test@example.com',
    phone: '0123456789',
    role: 'Community Volunteer',
    message: 'I want to help in the community events.'
};

(async () => {
    try {
        console.log('Generating PDF...');
        const pdfBuffer = await createSamplePdfBuffer(application);
        console.log('PDF generated, size:', pdfBuffer.length);

        console.log('Sending volunteer application email...');
        await sendApplicationEmail(application, pdfBuffer, application.email);
        console.log('Volunteer test email sent — check recipient inbox (and spam).');
    } catch (err) {
        console.error('Test send failed:');
        console.error(err && err.message ? err.message : err);
        if (err && err.response) console.error('Response:', err.response);
        process.exitCode = 1;
    }
    process.exit();
})();
