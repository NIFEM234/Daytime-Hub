document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    const toast = document.getElementById('toast');
    const submitButton = form?.querySelector('button[type="submit"]');
    const submitText = submitButton?.querySelector('.btn-text');
    const emailInput = form?.querySelector('input[name="email"]');
    const SENT_KEY = 'contactMessageSentEmails';

    function showToast(message, success = true) {
        toast.textContent = message;
        toast.style.display = 'block';
        toast.style.background = success ? '#1e88e5' : '#d9534f';
        toast.style.color = '#fff';
        toast.style.padding = '12px 18px';
        toast.style.borderRadius = '8px';
        toast.style.position = 'fixed';
        toast.style.right = '20px';
        toast.style.bottom = '20px';
        toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
        setTimeout(() => { toast.style.display = 'none'; }, 5000);
    }

    if (!form) return;

    const getSentEmails = () => {
        try {
            const stored = localStorage.getItem(SENT_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (err) {
            console.warn('Failed to read sent email list', err);
            return [];
        }
    };

    const setSentEmail = (email) => {
        const list = getSentEmails();
        const normalized = email.toLowerCase();
        if (!list.includes(normalized)) {
            list.push(normalized);
            localStorage.setItem(SENT_KEY, JSON.stringify(list));
        }
    };

    const hasSentEmail = (email) => {
        const list = getSentEmails();
        return list.includes(email.toLowerCase());
    };

    const lockForm = () => {
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.setAttribute('aria-disabled', 'true');
        }
        if (submitText) {
            submitText.textContent = 'Message Sent.';
        }
        const inputs = form.querySelectorAll('input, select, textarea, button');
        inputs.forEach((el) => {
            if (el !== submitButton) {
                el.disabled = true;
            }
        });
    };

    const checkEmailLock = () => {
        const email = emailInput?.value?.trim();
        if (email && hasSentEmail(email)) {
            lockForm();
        }
    };

    emailInput?.addEventListener('blur', checkEmailLock);
    emailInput?.addEventListener('change', checkEmailLock);

    const apiMeta = document.querySelector('meta[name="api-base"]');
    const apiMetaValue = apiMeta?.getAttribute('content')?.trim();
    const isFileOrigin = window.location.protocol === 'file:' || window.location.origin === 'null';
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const isLocalhostNonApiPort = isLocalhost && window.location.port && window.location.port !== '3000';
    const apiBase = apiMetaValue
        || (isFileOrigin ? 'http://daytimehub.org' : '')
        || (isLocalhostNonApiPort ? 'http://localhost:3000' : '');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const payload = Object.fromEntries(fd.entries());
        const email = String(payload.email || '').trim();

        if (email && hasSentEmail(email)) {
            showToast('Message already sent from this email.', false);
            lockForm();
            return;
        }

        try {
            const resp = await fetch(`${apiBase}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();
            if (resp.ok && data.success) {
                showToast('Message sent — we will reply shortly.');
                if (email) {
                    setSentEmail(email);
                }
                lockForm();
            } else {
                showToast(data.message || 'Failed to send message', false);
            }
        } catch (err) {
            console.error(err);
            showToast('Server error sending message', false);
        }
    });
});
