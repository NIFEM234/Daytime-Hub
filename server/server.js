// REMINDER: Review GDPR compliance weekly!
// - Check consent mechanisms
// - Update privacy policy if needed
// - Ensure data access/erasure requests are handled
// - Confirm personal data is secure and not publicly exposed
// (Set a recurring calendar reminder for this task)
// Load environment variables from .env for local/dev runs.
import 'dotenv/config';

// Log unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import applyRouter from './routes/apply.js';
import contactRouter from './routes/contact.js';
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';
import https from 'https';

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || '';
const ADMIN_PASS = process.env.ADMIN_PASS || '';
const SESSION_COOKIE = 'admin_session';
const sessions = new Map();
const isProd = process.env.NODE_ENV === 'production';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const siteRootDir = path.join(__dirname, '..');
const siteImgDir = path.join(siteRootDir, 'img');
const siteVideoDir = path.join(siteRootDir, 'video');
const publicFiles = new Set([
    'index.html',
    '404.html',
    'about.html',
    'contact.html',
    'cookie-policy.html',
    'donate.html',
    'eligibility.html',
    'gallery.html',
    'privacy.html',
    'safeguarding.html',
    'volunteer.html',
    'styles.css',
    'script.js',
    'contact.js',
    'volunteer.js',
    'site.webmanifest',
    'robots.txt',
    'sitemap.xml',
    'apple-touch-icon.svg',
    'favicon.svg'
]);

const _databaseUrl = process.env.DATABASE_URL;
const databaseUrl = typeof _databaseUrl === 'string' ? _databaseUrl : (_databaseUrl == null ? undefined : String(_databaseUrl));
if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set or is invalid');
    process.exit(1);
}

const pool = new Pool({
    connectionString: databaseUrl
});

const ensureApplicationColumns = async () => {
    const columns = [
        "referee_name TEXT",
        "referee_email TEXT",
        "referee_relationship TEXT",
        "reference_requested_at TIMESTAMP",
        "signature TEXT",
        "signature_date DATE",
        "food_hygiene_certificate TEXT",
        "food_hygiene_certificate_bring TEXT",
        "why_work_here TEXT"
    ];
    for (const columnDef of columns) {
        const [columnName] = columnDef.split(' ');
        await pool.query(
            `ALTER TABLE volunteer_applications ADD COLUMN IF NOT EXISTS ${columnName} ${columnDef.split(' ').slice(1).join(' ')}`
        );
    }
};


// Improved startup error handling
(async () => {
    try {
        const result = await pool.query('select current_database() as db, inet_server_addr() as host, inet_server_port() as port');
        console.log('Connected to DB:', result.rows[0]);
        await ensureApplicationColumns();
    } catch (error) {
        console.error('Startup error:', error);
        process.exit(1);
    }
})();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((req, res, next) => {
    if (isProd) {
        const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
        if (!isHttps) {
            return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
        }
        res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }
    const csp = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "connect-src 'self'",
        "font-src 'self' data:",
        "frame-src 'self' https://www.google.com https://www.google.com/maps",
        "frame-ancestors 'self'",
        "base-uri 'self'",
        "form-action 'self'"
    ].join('; ');

    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    next();
});

const corsAllowlist = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5500,http://127.0.0.1:5500')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
const allowAllOrigins = corsAllowlist.includes('*');

app.use(cors({
    origin: (origin, callback) => {
        if (allowAllOrigins) return callback(null, true);
        if (!origin) return callback(null, true);
        if (origin === 'null') return callback(null, true);
        if (corsAllowlist.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    }
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(publicDir));
app.use('/img', express.static(siteImgDir));
app.use('/video', express.static(siteVideoDir));

app.get('/', (_req, res) => {
    res.sendFile(path.join(siteRootDir, 'index.html'));
});

app.get('/:file', (req, res, next) => {
    const file = path.basename(req.params.file || '');
    if (!publicFiles.has(file)) {
        return next();
    }
    return res.sendFile(path.join(siteRootDir, file));
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Please try again later.' }
});

function parseCookies(cookieHeader = '') {
    return cookieHeader.split(';').reduce((acc, part) => {
        const [key, ...valueParts] = part.trim().split('=');
        if (!key) return acc;
        acc[key] = decodeURIComponent(valueParts.join('='));
        return acc;
    }, {});
}

function hasValidSession(req) {
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies[SESSION_COOKIE];
    return token && sessions.has(token);
}

function requireAdminAuth(req, res, next) {
    if (!ADMIN_USER || !ADMIN_PASS) {
        return res.status(500).json({ success: false, message: 'Admin credentials not configured' });
    }

    if (hasValidSession(req)) {
        return next();
    }

    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/html')) {
        const returnTo = encodeURIComponent(req.originalUrl || '/admin');
        return res.redirect(`/admin/login?returnTo=${returnTo}`);
    }

    return res.status(401).json({ success: false, message: 'Authentication required' });
}

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/applications', requireAdminAuth);
app.use('/api', applyRouter);
app.use('/api', contactRouter);

app.get('/admin/login', (_req, res) => {
    res.sendFile(path.join(publicDir, 'admin', 'login.html'));
});

app.post('/admin/login', loginLimiter, (req, res) => {
    const { username, password, returnTo } = req.body || {};
    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
        return res.redirect('/admin/login?error=invalid');
    }

    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, { createdAt: Date.now() });
    const cookieOptions = `HttpOnly; Path=/; SameSite=Lax${isProd ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; ${cookieOptions}`);
    const safeReturnTo = typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')
        ? returnTo
        : '/admin';
    return res.redirect(safeReturnTo);
});

app.post('/admin/logout', (req, res) => {
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies[SESSION_COOKIE];
    if (token) {
        sessions.delete(token);
    }
    const cookieOptions = `Max-Age=0; Path=/; SameSite=Lax${isProd ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; ${cookieOptions}`);
    return res.redirect('/admin/login');
});

app.get('/admin', requireAdminAuth, (_req, res) => {
    res.sendFile(path.join(publicDir, 'admin', 'index.html'));
});

app.get('/admin/applications/:id', requireAdminAuth, (_req, res) => {
    res.sendFile(path.join(publicDir, 'admin', 'application.html'));
});

const staticPages = [
    { path: '/about', file: 'about.html' },
    { path: '/contact', file: 'contact.html' },
    { path: '/cookie-policy', file: 'cookie-policy.html' },
    { path: '/donate', file: 'donate.html' },
    { path: '/eligibility', file: 'eligibility.html' },
    { path: '/gallery', file: 'gallery.html' },
    { path: '/privacy', file: 'privacy.html' },
    { path: '/safeguarding', file: 'safeguarding.html' },
    { path: '/volunteer', file: 'volunteer.html' }
];

for (const page of staticPages) {
    app.get(page.path, (_req, res) => {
        res.sendFile(path.join(siteRootDir, page.file));
    });
}

app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    const accept = req.headers.accept || '';
    if (accept.includes('text/html')) {
        return res.status(404).sendFile(path.join(siteRootDir, '404.html'));
    }
    return next();
});

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
});

const sslKeyPath = process.env.SSL_KEY_PATH;
const sslCertPath = process.env.SSL_CERT_PATH;

if (sslKeyPath && sslCertPath && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    const sslOptions = {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath)
    };
    https.createServer(sslOptions, app).listen(PORT, () => {
        console.log(`HTTPS server running on port ${PORT}`);
    });
} else {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
