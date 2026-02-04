const content = document.getElementById('content');
const errorBox = document.getElementById('error');
const searchInput = document.getElementById('search');
let allRows = [];

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function render(rows) {
    if (!rows.length) {
        content.innerHTML = '<div class="empty">No applications found.</div>';
        return;
    }

    const tableRows = rows.map(row => `
        <tr>
            <td><a href="/admin/applications/${row.id}">${row.full_name}</a></td>
            <td>${row.email}</td>
            <td>${row.phone}</td>
            <td><span class="chip">${row.role}</span></td>
            <td>${formatDate(row.created_at)}</td>
        </tr>
    `).join('');

    content.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Submitted</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
}

function filterRows() {
    const term = searchInput.value.trim().toLowerCase();
    if (!term) {
        render(allRows);
        return;
    }
    const filtered = allRows.filter(row => {
        return [row.full_name, row.email, row.role]
            .filter(Boolean)
            .some(value => value.toLowerCase().includes(term));
    });
    render(filtered);
}

async function loadApplications() {
    try {
        const response = await fetch('/api/applications');
        if (response.status === 401) {
            window.location.href = `/admin/login?returnTo=${encodeURIComponent('/admin')}`;
            return;
        }
        const payload = await response.json();
        if (!response.ok || !payload.success) {
            throw new Error(payload.message || 'Failed to load applications.');
        }
        allRows = payload.data || [];
        render(allRows);
    } catch (error) {
        errorBox.textContent = error.message;
        errorBox.style.display = 'block';
    }
}

searchInput.addEventListener('input', filterRows);
loadApplications();
