import { Router } from 'express';
import { z } from 'zod';
import { saveApplication, getApplications, getApplicationById, markReferenceRequested } from '../services/db.js';
import { generateApplicationPdf } from '../services/pdfService.js';
import { sendApplicationEmail, sendReferenceRequestEmail } from '../services/emailService.js';
import path from 'path';
import fs from 'fs';

const router = Router();

const applicationSchema = z.object({
    fullName: z.string().min(2).max(120),
    email: z.string().email().max(160),
    address: z.string().min(5).max(250),
    postcode: z.string().min(3).max(20),
    phone: z.string().min(6).max(30),
    emergencyName: z.string().min(2).max(120),
    emergencyPhone: z.string().min(6).max(30),
    role: z.string().min(2).max(80),
    availability: z.string().min(5).max(600),
    experience: z.string().max(2000).optional().nullable(),
    supportNeeds: z.string().max(2000).optional().nullable(),
    whyWorkHere: z.string().max(2000).optional().nullable(),
    howDidYouFindOut: z.string().max(300).optional().nullable(),
    nationalityVisa: z.string().max(200).optional().nullable(),
    foodHygieneCertificate: z.string().max(20).optional().nullable(),
    foodHygieneBring: z.string().max(20).optional().nullable(),
    referee1Name: z.string().max(120).optional().nullable(),
    referee1Address: z.string().max(250).optional().nullable(),
    referee1Postcode: z.string().max(20).optional().nullable(),
    referee1Email: z.string().email().max(160).optional().nullable(),
    referee1Phone: z.string().max(30).optional().nullable(),
    referee1Relationship: z.string().max(200).optional().nullable(),
    referee2Name: z.string().max(120).optional().nullable(),
    referee2Address: z.string().max(250).optional().nullable(),
    referee2Postcode: z.string().max(20).optional().nullable(),
    referee2Email: z.string().email().max(160).optional().nullable(),
    referee2Phone: z.string().max(30).optional().nullable(),
    referee2Relationship: z.string().max(200).optional().nullable(),
    signature: z.string().max(120).optional().nullable(),
    signatureDate: z.string().max(20).optional().nullable(),
    refereeName: z.string().max(120).optional().nullable(),
    refereeEmail: z.string().email().max(160).optional().nullable(),
    refereeRelationship: z.string().max(200).optional().nullable(),
    consent: z.boolean().refine(value => value === true, {
        message: 'Consent required'
    })
}).superRefine((data, ctx) => {
    if (data.role?.includes('Kitchen') && data.foodHygieneCertificate !== 'Yes') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['foodHygieneCertificate'],
            message: 'Kitchen roles require a Level 2 Food Hygiene Certificate.'
        });
    }
});

router.post('/apply', async (req, res, next) => {
    try {
        // Step 1 — Validate the form data
        const parsed = applicationSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid form data',
                errors: parsed.error.flatten()
            });
        }

        const application = parsed.data;

        // Step 2 — Save to database
        // If this fails we return a real error to the user
        let saved;
        try {
            saved = await saveApplication(application);
        } catch (dbErr) {
            console.error('Database save failed:', dbErr?.message || dbErr);
            return res.status(500).json({
                success: false,
                message: 'Could not save your application. Please try again.'
            });
        }

        // Step 3 — Respond to the user immediately
        // We do this BEFORE email/PDF so a broken email never causes a 500 error
        res.json({ success: true, message: 'Application submitted successfully' });

        // Step 4 — Generate PDF and send email in the background
        // This runs AFTER the response is already sent to the user
        // Any error here is logged but does NOT affect the user
        setImmediate(async () => {
            let pdfBuffer = null;

            // Try to generate the PDF
            try {
                pdfBuffer = await generateApplicationPdf(saved);
            } catch (pdfErr) {
                console.error('PDF generation failed for application', saved.id, ':', pdfErr?.message || pdfErr);
                // Continue without PDF — we can still try to send a text email
            }

            // Try to save PDF to disk for the admin panel
            let pdfUrlPath;
            if (pdfBuffer) {
                try {
                    const pdfDir = path.join(process.cwd(), 'public', 'admin', 'pdfs');
                    fs.mkdirSync(pdfDir, { recursive: true });
                    const filename = `application_${saved.id}.pdf`;
                    fs.writeFileSync(path.join(pdfDir, filename), pdfBuffer);
                    pdfUrlPath = `/admin/pdfs/${filename}`;
                } catch (pdfSaveErr) {
                    console.error('Could not save PDF to disk for application', saved.id, ':', pdfSaveErr?.message || pdfSaveErr);
                    // Continue — email will still work without a disk path
                }
            }

            // Try to send the notification email
            try {
                await sendApplicationEmail(saved, pdfBuffer, application.email, pdfUrlPath);
                console.log('Application email sent successfully for id', saved.id);
            } catch (emailErr) {
                console.error('Email send failed for application', saved.id, ':', emailErr?.message || emailErr);
                // The application is safely in the database — this is just a notification failure
                // Admin can still see it in the admin panel at /admin
            }
        });

    } catch (error) {
        next(error);
    }
});

router.get('/applications', async (_req, res, next) => {
    try {
        const applications = await getApplications();
        return res.json({ success: true, data: applications });
    } catch (error) {
        next(error);
    }
});

router.get('/applications/:id', async (req, res, next) => {
    try {
        const application = await getApplicationById(req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        return res.json({ success: true, data: application });
    } catch (error) {
        next(error);
    }
});

router.post('/applications/:id/reference', async (req, res, next) => {
    try {
        const application = await getApplicationById(req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (!application.referee_email || !application.referee_name) {
            return res.status(400).json({ success: false, message: 'Referee details are missing' });
        }

        await sendReferenceRequestEmail(application);
        const updated = await markReferenceRequested(application.id);

        return res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

export default router;
