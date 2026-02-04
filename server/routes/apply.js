import { Router } from 'express';
import { z } from 'zod';
import { saveApplication, getApplications, getApplicationById, markReferenceRequested } from '../services/db.js';
import { generateApplicationPdf } from '../services/pdfService.js';
import { sendApplicationEmail, sendReferenceRequestEmail } from '../services/emailService.js';

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
        const parsed = applicationSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, message: 'Invalid form data', errors: parsed.error.flatten() });
        }

        const application = parsed.data;
        const saved = await saveApplication(application);
        const pdfBuffer = await generateApplicationPdf(saved);
        await sendApplicationEmail(saved, pdfBuffer, application.email);

        return res.json({ success: true, message: 'Application submitted successfully' });
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
