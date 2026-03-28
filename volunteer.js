const apiMeta = document.querySelector('meta[name="api-base"]');
const apiMetaValue = apiMeta?.getAttribute('content')?.trim();
const isFileOrigin = window.location.protocol === 'file:' || window.location.origin === 'null';
const API_BASE_URL = apiMetaValue || (isFileOrigin ? 'http://daytimehub.org' : '');

const form = document.getElementById('volunteer-form');
if (form) {
    const statusEl = form.querySelector('.form-status');
    const submitBtn = form.querySelector('button[type="submit"]');

    // ── Error highlight helpers ──────────────────────────────────────────────

    /** Mark a field red and attach a one-time listener to clear it on input. */
    function markFieldError(el) {
        if (!el) return;
        el.classList.add('field-error');
        const clear = () => {
            el.classList.remove('field-error');
            el.removeEventListener('input', clear);
            el.removeEventListener('change', clear);
        };
        el.addEventListener('input', clear);
        el.addEventListener('change', clear);
    }

    /** Scroll smoothly to a field, then focus it. */
    function scrollToField(el) {
        if (!el) return;
        try {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {
            el.scrollIntoView(false);
        }
        setTimeout(() => {
            try { el.focus(); } catch (_) {}
        }, 350);
    }

    /** Mark a group of radio buttons (role-options) as errored. */
    function markGroupError(groupEl) {
        if (!groupEl) return;
        groupEl.classList.add('field-group-error');
        const clear = () => {
            groupEl.classList.remove('field-group-error');
            groupEl.removeEventListener('change', clear);
        };
        groupEl.addEventListener('change', clear);
    }

    /** Clear all field-error states on the form. */
    function clearAllErrors() {
        form.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
        form.querySelectorAll('.field-group-error').forEach(el => el.classList.remove('field-group-error'));
    }

    // ── Modal popup ──────────────────────────────────────────────────────────

    const showSubmissionPopup = () => {
        const existing = document.querySelector('.submission-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'submission-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Application sent');

        modal.innerHTML = `
            <div class="submission-modal__backdrop" data-close="true"></div>
            <div class="submission-modal__content">
                <button class="submission-modal__close" type="button" aria-label="Close" data-close="true">×</button>
                <h3>Your application has been sent!</h3>
                <p>Thank you for applying. We will be in touch soon.</p>
            </div>
        `;

        modal.addEventListener('click', (event) => {
            if (event.target?.getAttribute('data-close') === 'true') {
                modal.remove();
            }
        });

        document.body.appendChild(modal);

        setTimeout(() => {
            if (modal.isConnected) modal.remove();
        }, 3500);
    };

    // ── Status message ───────────────────────────────────────────────────────

    const setStatus = (message, type) => {
        if (!statusEl) return;
        statusEl.textContent = message || '';
        statusEl.className = 'form-status';
        statusEl.classList.remove('error', 'success', 'form-status--highlight');
        if (type === 'error') statusEl.classList.add('error', 'form-status--highlight');
        if (type === 'success') statusEl.classList.add('success', 'form-status--highlight');
    };

    // ── Email validation ─────────────────────────────────────────────────────

    const isValidEmail = (value) => {
        if (!value) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    };

    // ── Submit handler ───────────────────────────────────────────────────────

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearAllErrors();
        setStatus('Sending your application…', 'idle');
        if (submitBtn) submitBtn.disabled = true;

        const formData = new FormData(form);
        const cleanOptional = (value) => {
            const trimmed = value?.trim();
            return trimmed ? trimmed : null;
        };

        const selectedRole = formData.get('role');
        const foodHygieneCertificate = formData.get('foodHygieneCertificate');

        // ── Required field checks ──────────────────────────────────────────
        const requiredChecks = [
            { name: 'fullName',       label: 'Full name' },
            { name: 'email',          label: 'Email address' },
            { name: 'address',        label: 'Address' },
            { name: 'postcode',       label: 'Postcode' },
            { name: 'phone',          label: 'Phone number' },
            { name: 'emergencyName',  label: 'Emergency contact name' },
            { name: 'emergencyPhone', label: 'Emergency contact phone' },
            { name: 'role',           label: 'Volunteer role' },
            { name: 'availability',   label: 'Availability' },
            { name: 'nationalityVisa',label: 'Nationality / Visa status' }
        ];

        for (const chk of requiredChecks) {
            const v = formData.get(chk.name);
            if (!v || (typeof v === 'string' && !v.trim())) {
                setStatus(`${chk.label} is required.`, 'error');

                // For radio-button groups, highlight the whole group container
                if (chk.name === 'role') {
                    const groupEl = form.querySelector('.role-options[aria-label="Volunteer role options"]');
                    markGroupError(groupEl);
                    scrollToField(groupEl);
                } else if (chk.name === 'nationalityVisa') {
                    const groupEl = form.querySelector('[name="nationalityVisa"]');
                    markGroupError(groupEl?.closest('.form-grid') || groupEl);
                    scrollToField(groupEl);
                } else {
                    const el = form.querySelector(`[name="${chk.name}"]`);
                    markFieldError(el);
                    scrollToField(el);
                }

                if (submitBtn) submitBtn.disabled = false;
                return;
            }
        }

        // ── Email format ───────────────────────────────────────────────────
        const emailVal = formData.get('email')?.toString?.().trim();
        if (!isValidEmail(emailVal)) {
            setStatus('Please enter a valid email address.', 'error');
            const el = form.querySelector('[name="email"]');
            markFieldError(el);
            scrollToField(el);
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        // ── Kitchen role / food hygiene check ──────────────────────────────
        if (selectedRole?.toString().includes('Kitchen') && foodHygieneCertificate !== 'Yes') {
            setStatus('Kitchen roles require a Level 2 Food Hygiene Certificate.', 'error');
            const groupEl = form.querySelector('.role-options[aria-label="Food hygiene certificate"]');
            markGroupError(groupEl);
            scrollToField(groupEl);
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        // ── Consent checkbox ───────────────────────────────────────────────
        const consentChecked = form.querySelector('input[name="consent"]:checked');
        if (!consentChecked) {
            setStatus('You must consent to data processing to submit this form.', 'error');
            const el = form.querySelector('input[name="consent"]');
            markFieldError(el);
            scrollToField(el);
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        // ── Build payload ──────────────────────────────────────────────────
        const payload = {
            fullName:              formData.get('fullName')?.trim(),
            email:                 formData.get('email')?.trim(),
            address:               formData.get('address')?.trim(),
            postcode:              formData.get('postcode')?.trim(),
            phone:                 formData.get('phone')?.trim(),
            emergencyName:         formData.get('emergencyName')?.trim(),
            emergencyPhone:        formData.get('emergencyPhone')?.trim(),
            role:                  selectedRole,
            availability:          formData.get('availability')?.trim(),
            experience:            cleanOptional(formData.get('experience')),
            supportNeeds:          cleanOptional(formData.get('supportNeeds')),
            whyWorkHere:           cleanOptional(formData.get('whyWorkHere')),
            howDidYouFindOut:      cleanOptional(formData.get('howDidYouFindOut')),
            nationalityVisa:       cleanOptional(formData.get('nationalityVisa')),
            referee1Name:          cleanOptional(formData.get('referee1Name')),
            referee1Address:       cleanOptional(formData.get('referee1Address')),
            referee1Postcode:      cleanOptional(formData.get('referee1Postcode')),
            referee1Email:         cleanOptional(formData.get('referee1Email')),
            referee1Phone:         cleanOptional(formData.get('referee1Phone')),
            referee1Relationship:  cleanOptional(formData.get('referee1Relationship')),
            referee2Name:          cleanOptional(formData.get('referee2Name')),
            referee2Address:       cleanOptional(formData.get('referee2Address')),
            referee2Postcode:      cleanOptional(formData.get('referee2Postcode')),
            referee2Email:         cleanOptional(formData.get('referee2Email')),
            referee2Phone:         cleanOptional(formData.get('referee2Phone')),
            referee2Relationship:  cleanOptional(formData.get('referee2Relationship')),
            signature:             cleanOptional(formData.get('signature')),
            signatureDate:         cleanOptional(formData.get('signatureDate')),
            refereeName:           cleanOptional(formData.get('refereeName')),
            refereeEmail:          cleanOptional(formData.get('refereeEmail')),
            refereeRelationship:   cleanOptional(formData.get('refereeRelationship')),
            foodHygieneCertificate:cleanOptional(formData.get('foodHygieneCertificate')),
            foodHygieneBring:      cleanOptional(formData.get('foodHygieneBring')),
            consent:               !!formData.get('consent')
        };

        // ── Submit to API ──────────────────────────────────────────────────
        try {
            const response = await fetch(`${API_BASE_URL}/api/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                form.reset();
                setTimeout(() => {
                    setStatus('Your application has been sent.', 'success');
                    showSubmissionPopup();
                }, 800);
            } else {
                const data = await response.json().catch(() => null);
                if (data && data.errors) {
                    const flat = data.errors;
                    const fieldErrors = flat.fieldErrors || {};
                    const messages = [];
                    for (const key of Object.keys(fieldErrors)) {
                        const arr = fieldErrors[key] || [];
                        for (const m of arr) messages.push(`${key}: ${m}`);
                        // Highlight the first errored server-side field
                        const el = form.querySelector(`[name="${key}"]`);
                        if (el) {
                            markFieldError(el);
                            if (messages.length === arr.length) scrollToField(el);
                        }
                    }
                    const output = messages.length
                        ? messages.join(' — ')
                        : (data.message || 'Submission failed. Please check the form.');
                    setStatus(output, 'error');
                } else {
                    setStatus(data?.message || 'Submission failed. Please try again.', 'error');
                }
            }
        } catch (error) {
            setStatus('Submission failed. Please try again.', 'error');
        }

        if (submitBtn) submitBtn.disabled = false;
    });
}

// ── Date & signature preview ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const todayBtn   = document.getElementById('fillTodayBtn');
    const dateInput  = document.getElementById('signatureDate');
    if (todayBtn && dateInput) {
        todayBtn.addEventListener('click', () => {
            const now  = new Date();
            const yyyy = now.getFullYear();
            const mm   = String(now.getMonth() + 1).padStart(2, '0');
            const dd   = String(now.getDate()).padStart(2, '0');
            dateInput.value = `${yyyy}-${mm}-${dd}`;
        });
    }

    const sigInput   = document.getElementById('signatureInput');
    const sigPreview = document.getElementById('signaturePreview');
    if (sigInput && sigPreview) {
        sigInput.addEventListener('input', () => {
            sigPreview.textContent = sigInput.value;
        });
    }
});
