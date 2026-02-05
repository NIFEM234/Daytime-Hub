const apiMeta = document.querySelector('meta[name="api-base"]');
const apiMetaValue = apiMeta?.getAttribute('content')?.trim();
const isFileOrigin = window.location.protocol === 'file:' || window.location.origin === 'null';
const API_BASE_URL = apiMetaValue || (isFileOrigin ? 'http://daytimehub.org' : '');

const form = document.getElementById('volunteer-form');
if (form) {
    const statusEl = form.querySelector('.form-status');
    const submitBtn = form.querySelector('button[type="submit"]');

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
                <h3>Your application has been sent, please.</h3>
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
            if (modal.isConnected) {
                modal.remove();
            }
        }, 3500);
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (statusEl) {
            statusEl.textContent = 'Sending your application...';
            statusEl.className = 'form-status';
        }
        if (submitBtn) submitBtn.disabled = true;

        const formData = new FormData(form);
        const cleanOptional = (value) => {
            const trimmed = value?.trim();
            return trimmed ? trimmed : null;
        };

        const selectedRole = formData.get('role');
        const foodHygieneCertificate = formData.get('foodHygieneCertificate');
        if (selectedRole?.includes('Kitchen') && foodHygieneCertificate !== 'Yes') {
            if (statusEl) {
                statusEl.textContent = 'Kitchen roles require a Level 2 Food Hygiene Certificate.';
                statusEl.classList.add('error');
            }
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        const payload = {
            fullName: formData.get('fullName')?.trim(),
            email: formData.get('email')?.trim(),
            address: formData.get('address')?.trim(),
            postcode: formData.get('postcode')?.trim(),
            phone: formData.get('phone')?.trim(),
            emergencyName: formData.get('emergencyName')?.trim(),
            emergencyPhone: formData.get('emergencyPhone')?.trim(),
            role: selectedRole,
            availability: formData.get('availability')?.trim(),
            experience: cleanOptional(formData.get('experience')),
            supportNeeds: cleanOptional(formData.get('supportNeeds')),
            whyWorkHere: cleanOptional(formData.get('whyWorkHere')),
            howDidYouFindOut: cleanOptional(formData.get('howDidYouFindOut')),
            nationalityVisa: cleanOptional(formData.get('nationalityVisa')),
            referee1Name: cleanOptional(formData.get('referee1Name')),
            referee1Address: cleanOptional(formData.get('referee1Address')),
            referee1Postcode: cleanOptional(formData.get('referee1Postcode')),
            referee1Email: cleanOptional(formData.get('referee1Email')),
            referee1Phone: cleanOptional(formData.get('referee1Phone')),
            referee1Relationship: cleanOptional(formData.get('referee1Relationship')),
            referee2Name: cleanOptional(formData.get('referee2Name')),
            referee2Address: cleanOptional(formData.get('referee2Address')),
            referee2Postcode: cleanOptional(formData.get('referee2Postcode')),
            referee2Email: cleanOptional(formData.get('referee2Email')),
            referee2Phone: cleanOptional(formData.get('referee2Phone')),
            referee2Relationship: cleanOptional(formData.get('referee2Relationship')),
            signature: cleanOptional(formData.get('signature')),
            signatureDate: cleanOptional(formData.get('signatureDate')),
            refereeName: cleanOptional(formData.get('refereeName')),
            refereeEmail: cleanOptional(formData.get('refereeEmail')),
            refereeRelationship: cleanOptional(formData.get('refereeRelationship')),
            foodHygieneCertificate: cleanOptional(formData.get('foodHygieneCertificate')),
            foodHygieneBring: cleanOptional(formData.get('foodHygieneBring')),
            consent: !!formData.get('consent')
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setTimeout(() => {
                    if (statusEl) {
                        statusEl.textContent = 'Your application has been sent.';
                        statusEl.classList.add('success', 'form-status--highlight');
                    }
                    showSubmissionPopup();
                }, 800);
                form.reset();
            } else {
                const data = await response.json().catch(() => null);
                // If the server returned validation details, surface them to the user
                if (data && data.errors) {
                    // zod.flatten() returns { formErrors: [], fieldErrors: { field: [msgs...] } }
                    const flat = data.errors;
                    const fieldErrors = flat.fieldErrors || {};
                    const messages = [];
                    for (const key of Object.keys(fieldErrors)) {
                        const arr = fieldErrors[key] || [];
                        for (const m of arr) messages.push(`${key}: ${m}`);
                    }
                    const output = messages.length ? messages.join(' — ') : (data.message || 'Submission failed. Please check the form.');
                    if (statusEl) {
                        statusEl.textContent = output;
                        statusEl.classList.add('error');
                    }
                } else {
                    if (statusEl) {
                        statusEl.textContent = data?.message || 'Submission failed. Please try again.';
                        statusEl.classList.add('error');
                    }
                }
            }
        } catch (error) {
            if (statusEl) {
                statusEl.textContent = 'Submission failed. Please try again.';
                statusEl.classList.add('error');
            }
        }

        if (submitBtn) submitBtn.disabled = false;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const todayBtn = document.getElementById('fillTodayBtn');
    const dateInput = document.getElementById('signatureDate');
    if (todayBtn && dateInput) {
        todayBtn.addEventListener('click', () => {
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            dateInput.value = `${yyyy}-${mm}-${dd}`;
        });
    }

    const sigInput = document.getElementById('signatureInput');
    const sigPreview = document.getElementById('signaturePreview');
    if (sigInput && sigPreview) {
        sigInput.addEventListener('input', () => {
            sigPreview.textContent = sigInput.value;
        });
    }
});
