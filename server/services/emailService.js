import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_TO = process.env.EMAIL_TO;
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || '').toLowerCase();
const SMTP_HOST = process.env.SMTP_HOST || (EMAIL_PROVIDER === 'gmail' ? 'smtp.gmail.com' : undefined);
const SMTP_PORT = Number(process.env.SMTP_PORT || (EMAIL_PROVIDER === 'gmail' ? '465' : '')) || undefined;
const SMTP_SECURE = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : SMTP_PORT === 465;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const canUseSmtp = Boolean(EMAIL_USER && EMAIL_PASS && SMTP_HOST && SMTP_PORT);
const transporter = canUseSmtp
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS
        }
    })
    : null;

if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
}

async function sendMail(message, logLabel) {
    if (transporter) {
        return transporter.sendMail(message);
    }
    if (!SENDGRID_API_KEY) {
        throw new Error('Email is not configured. Set SMTP settings or SENDGRID_API_KEY, EMAIL_FROM, EMAIL_TO.');
    }
    const [response] = await sgMail.send(message);
    if (logLabel) {
        console.log(logLabel, {
            statusCode: response?.statusCode,
            headers: response?.headers
        });
    }
    return response;
}

export async function sendApplicationEmail(application, pdfBuffer, replyTo) {
    if (!EMAIL_FROM || !EMAIL_TO) {
        throw new Error('Email is not configured. Set EMAIL_FROM and EMAIL_TO.');
    }

    const email = {
        to: EMAIL_TO,
        from: EMAIL_FROM,
        replyTo: replyTo,
        subject: `New Volunteer Application – ${application.full_name}`,
        text: `A new volunteer application was received.\n\nName: ${application.full_name}\nEmail: ${application.email}\nPhone: ${application.phone}\nRole: ${application.role}\n\nView in dashboard: ${APP_BASE_URL}/admin/applications/${application.id}`,
        attachments: [
            {
                content: pdfBuffer.toString('base64'),
                filename: `application_${application.full_name.replace(/\s+/g, '_')}.pdf`,
                type: 'application/pdf',
                disposition: 'attachment'
            }
        ]
    };

    try {
        await sendMail(email, 'Email response:');
    } catch (error) {
        console.error('Email error:', {
            message: error?.message,
            code: error?.code,
            responseStatus: error?.response?.statusCode,
            responseBody: error?.response?.body,
            responseHeaders: error?.response?.headers
        });
        throw error;
    }
}


export async function sendReferenceRequestEmail(application) {
    if (!EMAIL_FROM) {
        throw new Error('Email is not configured. Set EMAIL_FROM.');
    }

    const email = {
        to: EMAIL_TO,
        from: EMAIL_FROM,
        replyTo: EMAIL_TO,
        subject: `Reference request for ${application.full_name}`,
        text: `Dear ${application.referee_name},\n\n${application.full_name} has applied to volunteer with DayTime Hub and listed you as a referee.\n\nWe would appreciate your comments on their suitability for the role, including:\n- How long you have known them and in what capacity\n- What they can contribute to this role\n- Any concerns you may have\n- How we can best support them\n\nPlease reply to this email with your feedback.\n\nMany thanks,\nDayTime Hub`
    };

    try {
        await sendMail(email, 'Reference email response:');
    } catch (error) {
        console.error('Reference email error:', {
            message: error?.message,
            code: error?.code,
            responseStatus: error?.response?.statusCode,
            responseBody: error?.response?.body,
            responseHeaders: error?.response?.headers
        });
        throw error;
    }
}

export async function sendContactEmail(contact, pdfBuffer) {
    if (!EMAIL_FROM || !EMAIL_TO) {
        throw new Error('Email is not configured. Set EMAIL_FROM and EMAIL_TO.');
    }

    const email = {
        to: EMAIL_TO,
        from: EMAIL_FROM,
        replyTo: contact.email || EMAIL_TO,
        subject: `Contact message – ${contact.name || 'Website'}`,
        text: `A new contact message was submitted.\n\nName: ${contact.name}\nEmail: ${contact.email}\nPhone: ${contact.phone || ''}\nSubject: ${contact.subject || ''}\n\nMessage:\n${contact.message || ''}`,
        attachments: []
    };

    if (pdfBuffer) {
        email.attachments.push({
            content: pdfBuffer.toString('base64'),
            filename: `contact_${(contact.name || 'message').replace(/\s+/g, '_')}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
        });
    }

    try {
        await sendMail(email, 'Contact email response:');
    } catch (error) {
        console.error('Contact email error:', error?.response?.body || error?.message || error);
        throw error;
    }
}
