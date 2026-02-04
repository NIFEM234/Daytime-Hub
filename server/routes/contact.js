import express from 'express';
import rateLimit from 'express-rate-limit';
import { saveContactMessage } from '../services/db.js';
import { generateContactPdf } from '../services/pdfService.js';
import { sendContactEmail } from '../services/emailService.js';

const router = express.Router();

const contactLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many messages. Please try again later.' }
});

router.post('/contact', contactLimiter, async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body || {};
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Name, email and message are required' });
        }

        const saved = await saveContactMessage({ name, email, phone, subject, message });

        // respond quickly to the client to avoid front-end errors
        res.json({ success: true, data: saved });

        // perform PDF generation and email sending asynchronously; log errors but don't fail the client
        (async () => {
            try {
                const contactRecord = { ...saved };
                const pdfBuffer = await generateContactPdf(contactRecord);
                await sendContactEmail(contactRecord, pdfBuffer);
                console.log('Contact message emailed for id', contactRecord.id);
            } catch (bgErr) {
                console.error('Background error sending contact email:', bgErr);
            }
        })();

        return;
    } catch (err) {
        console.error('Contact route error (save):', err);
        return res.status(500).json({ success: false, message: 'Server error saving message' });
    }
});

export default router;
