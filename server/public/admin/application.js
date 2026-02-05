const errorBox = document.getElementById('error');
const details = document.getElementById('details');
const title = document.getElementById('title');
const referenceActions = document.getElementById('reference-actions');
const referenceStatus = document.getElementById('reference-status');
const referenceButton = document.getElementById('send-reference');
const id = window.location.pathname.split('/').pop();

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function addRow(label, value) {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value || '';
    details.append(dt, dd);
}

async function loadApplication() {
    try {
        const response = await fetch(`/api/applications/${id}`);
        if (response.status === 401) {
            window.location.href = `/admin/login?returnTo=${encodeURIComponent(`/admin/applications/${id}`)}`;
            return;
        }
        const payload = await response.json();
        if (!response.ok || !payload.success) {
            throw new Error(payload.message || 'Failed to load application.');
        }
        const data = payload.data;
        title.textContent = data.full_name;
        addRow('Email', data.email);
        addRow('Phone', data.phone);
        addRow('Address', data.address);
        addRow('Postcode', data.postcode);
        addRow('Emergency Contact', data.emergency_name);
        addRow('Emergency Phone', data.emergency_phone);
        addRow('Role', data.role);
        addRow('Food Hygiene Certificate', data.food_hygiene_certificate);
        addRow('Certificate Brought', data.food_hygiene_certificate_bring);
        addRow('Availability', data.availability);
        addRow('Experience', data.experience);
        addRow('Support Needs', data.support_needs);
        addRow('Why Work Here', data.why_work_here);
        addRow('Referee Name', data.referee_name || '');
        addRow('Referee Email', data.referee_email || '');
        addRow('Referee Relationship', data.referee_relationship || '');
        addRow('Reference Requested', data.reference_requested_at ? formatDate(data.reference_requested_at) : 'Not sent');
        addRow('Submitted', formatDate(data.created_at));
        addRow('Application ID', data.id);

        // Link to hosted PDF for this application (served under the protected /admin path)
        try {
            const dt = document.createElement('dt');
            dt.textContent = 'Application PDF';
            const dd = document.createElement('dd');
            const a = document.createElement('a');
            a.href = `/admin/pdfs/application_${data.id}.pdf`;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = 'Open PDF (admin access required)';
            dd.appendChild(a);
            details.append(dt, dd);
        } catch (e) {
            // non-fatal
        }

        if (data.referee_email && data.referee_name) {
            referenceActions.style.display = 'flex';
            if (data.reference_requested_at) {
                referenceStatus.textContent = 'Reference request already sent.';
                referenceButton.disabled = true;
            }

            referenceButton.addEventListener('click', async () => {
                referenceButton.disabled = true;
                referenceStatus.textContent = 'Sending reference request...';
                try {
                    const response = await fetch(`/api/applications/${id}/reference`, {
                        method: 'POST'
                    });
                    const payload = await response.json();
                    if (!response.ok || !payload.success) {
                        throw new Error(payload.message || 'Failed to send reference request.');
                    }
                    referenceStatus.textContent = 'Reference request sent.';
                } catch (error) {
                    referenceStatus.textContent = error.message;
                    referenceButton.disabled = false;
                }
            }, { once: true });
        }
    } catch (error) {
        errorBox.textContent = error.message;
        errorBox.style.display = 'block';
        title.textContent = 'Application not available';
    }
}

loadApplication();
