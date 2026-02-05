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

let transporter = null;
if (canUseSmtp) {
    try {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_SECURE,
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS
            },
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000,
            logger: true,
            debug: false,
            tls: {
                rejectUnauthorized: true
            }
        });

        transporter.verify()
            .then(() => console.log('SMTP transporter verified'))
            .catch(async (err) => {
                console.error('SMTP transporter verify failed:', err && err.message);
                // If initial config uses implicit SSL (port 465 / secure true), try STARTTLS on 587 as a fallback
                try {
                    const shouldTryFallback = (SMTP_PORT === 465 || SMTP_SECURE === true || SMTP_PORT === undefined);
                    if (shouldTryFallback) {
                        const altPort = 587;
                        const altSecure = false; // use STARTTLS
                        console.warn(`Attempting SMTP fallback to ${SMTP_HOST}:${altPort} (STARTTLS)`);
                        const altTransport = nodemailer.createTransport({
                            host: SMTP_HOST,
                            port: altPort,
                            secure: altSecure,
                            auth: {
                                user: EMAIL_USER,
                                pass: EMAIL_PASS
                            },
                            connectionTimeout: 30000,
                            greetingTimeout: 30000,
                            socketTimeout: 30000,
                            logger: true,
                            debug: false,
                            tls: {
                                rejectUnauthorized: true
                            }
                        });
                        await altTransport.verify();
                        transporter = altTransport;
                        console.log('SMTP fallback transporter verified (STARTTLS)');
                    }
                } catch (altErr) {
                    console.error('SMTP fallback verify failed:', altErr && altErr.message);
                }
            });
    } catch (err) {
        console.error('Failed to create SMTP transporter with debug options:', err && err.message);
        transporter = null;
    }
}

if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
}

async function sendMail(message, logLabel) {
    // Prepare message copies for each provider.
    const msgForSmtp = Object.assign({}, message);
    if (Array.isArray(msgForSmtp.attachments)) {
        msgForSmtp.attachments = msgForSmtp.attachments.map(att => {
            const copy = Object.assign({}, att);
            // nodemailer expects Buffer for binary attachments
            if (typeof copy.content === 'string') {
                try { copy.content = Buffer.from(copy.content, 'base64'); } catch (e) { /* ignore */ }
            }
            return copy;
        });
    }

    const msgForSendGrid = Object.assign({}, message);
    if (Array.isArray(msgForSendGrid.attachments)) {
        msgForSendGrid.attachments = msgForSendGrid.attachments.map(att => {
            const copy = Object.assign({}, att);
            // SendGrid expects `content` to be a base64-encoded string
            if (Buffer.isBuffer(copy.content)) {
                copy.content = copy.content.toString('base64');
            } else if (typeof copy.content === 'string') {
                // assume it's already base64 or plain text
                // If it looks like raw text (not base64), convert to base64
                const looksLikeBase64 = /^[A-Za-z0-9+/=\s]+$/.test(copy.content) && copy.content.length % 4 === 0;
                if (!looksLikeBase64) {
                    copy.content = Buffer.from(copy.content).toString('base64');
                }
            }
            // map contentType -> type for SendGrid helper
            if (copy.contentType && !copy.type) copy.type = copy.contentType;
            return copy;
        });
    }

    // Prefer SendGrid if API key is present — more reliable on restricted hosts.
    if (SENDGRID_API_KEY) {
        try {
            const [response] = await sgMail.send(msgForSendGrid);
            if (logLabel) {
                console.log(logLabel, { statusCode: response?.statusCode, headers: response?.headers });
            }
            return response;
        } catch (sgErr) {
            console.error('SendGrid send failed:', sgErr && (sgErr.message || sgErr));
            // If SMTP is available, fall back to SMTP
            if (transporter) {
                try {
                    console.warn('Falling back to SMTP due to SendGrid failure');
                    const result = await transporter.sendMail(msgForSmtp);
                    return result;
                } catch (smtpErr) {
                    console.error('SMTP fallback after SendGrid failure also failed:', smtpErr && smtpErr.message);
                    // attach fallback info and rethrow
                    sgErr.fallbackError = smtpErr;
                    throw sgErr;
                }
            }
            throw sgErr;
        }
    }

    // If no SendGrid configured, try SMTP (existing behaviour)
    if (transporter) {
        try {
            const result = await transporter.sendMail(msgForSmtp);
            return result;
        } catch (smtpErr) {
            console.error('SMTP send failed:', smtpErr && smtpErr.message);
            throw smtpErr;
        }
    }

    throw new Error('Email is not configured. Set SENDGRID_API_KEY or SMTP settings (EMAIL_USER/EMAIL_PASS, SMTP_HOST, SMTP_PORT).');
}

export async function sendApplicationEmail(application, pdfBuffer, replyTo, pdfUrl) {
    if (!EMAIL_FROM || !EMAIL_TO) {
        throw new Error('Email is not configured. Set EMAIL_FROM and EMAIL_TO.');
    }

    const attachments = [];
    if (pdfBuffer) {
        attachments.push({
            content: pdfBuffer,
            filename: `application_${application.full_name.replace(/\s+/g, '_')}.pdf`,
            contentType: 'application/pdf',
            disposition: 'attachment'
        });
    }

    const pdfLink = pdfUrl ? `${APP_BASE_URL.replace(/\/$/, '')}${pdfUrl}` : null;

    const email = {
        to: EMAIL_TO,
        from: EMAIL_FROM,
        replyTo: replyTo,
        subject: `New Volunteer Application – ${application.full_name}`,
        text: `A new volunteer application was received.\n\nName: ${application.full_name}\nEmail: ${application.email}\nPhone: ${application.phone}\nRole: ${application.role}\n\nView in dashboard: ${APP_BASE_URL}/admin/applications/${application.id}` + (pdfLink ? `\n\nView PDF: ${pdfLink}` : ''),
        attachments
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
            content: pdfBuffer,
            filename: `contact_${(contact.name || 'message').replace(/\s+/g, '_')}.pdf`,
            contentType: 'application/pdf',
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
