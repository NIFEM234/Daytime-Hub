import PDFDocument from 'pdfkit';

export function generateApplicationPdf(application) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(18).text('Volunteer Application', { align: 'center' });
        doc.moveDown(1.5);

        const fields = [
            ['Full Name', application.full_name],
            ['Email Address', application.email],
            ['Address', application.address],
            ['Postcode', application.postcode],
            ['Phone Number', application.phone],
            ['Emergency Contact Name', application.emergency_name],
            ['Emergency Contact Phone', application.emergency_phone],
            ['Role', application.role],
            ['Food Hygiene Certificate', application.food_hygiene_certificate || 'N/A'],
            ['Certificate Brought', application.food_hygiene_certificate_bring || 'N/A'],
            ['Availability', application.availability],
            ['Relevant Qualifications, Skills & Experience', application.experience || 'N/A'],
            ['Support Needs', application.support_needs || 'N/A'],
            ['Why would you like to work here?', application.why_work_here || 'N/A'],
            ['How did you first find out about this volunteer role?', application.how_did_you_find_out || 'N/A'],
            ['Nationality / Visa Status', application.nationality_visa || 'N/A'],
            ['Referee 1 Name', application.referee1_name || 'N/A'],
            ['Referee 1 Address', application.referee1_address || 'N/A'],
            ['Referee 1 Postcode', application.referee1_postcode || 'N/A'],
            ['Referee 1 Email', application.referee1_email || 'N/A'],
            ['Referee 1 Phone', application.referee1_phone || 'N/A'],
            ['Referee 1 Relationship', application.referee1_relationship || 'N/A'],
            ['Referee 2 Name', application.referee2_name || 'N/A'],
            ['Referee 2 Address', application.referee2_address || 'N/A'],
            ['Referee 2 Postcode', application.referee2_postcode || 'N/A'],
            ['Referee 2 Email', application.referee2_email || 'N/A'],
            ['Referee 2 Phone', application.referee2_phone || 'N/A'],
            ['Referee 2 Relationship', application.referee2_relationship || 'N/A'],
            ['Signature', application.signature || 'N/A'],
            ['Signature Date', application.signature_date || 'N/A'],
            ['Submitted', application.created_at ? new Date(application.created_at).toLocaleString() : 'N/A']
        ];

        fields.forEach(([label, value]) => {
            doc.font('Helvetica-Bold').fontSize(12).text(label);
            doc.font('Helvetica').fontSize(11).text(String(value));
            doc.moveDown(0.75);
        });

        doc.end();
    });
}

export function generateContactPdf(contact) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(18).text('Contact Message', { align: 'center' });
        doc.moveDown(1.5);

        const fields = [
            ['Name', contact.name],
            ['Email', contact.email],
            ['Phone', contact.phone || 'N/A'],
            ['Subject', contact.subject || 'N/A'],
            ['Message', contact.message || ''],
            ['Submitted', contact.created_at ? new Date(contact.created_at).toLocaleString() : new Date().toLocaleString()]
        ];

        fields.forEach(([label, value]) => {
            doc.font('Helvetica-Bold').fontSize(12).text(label);
            doc.font('Helvetica').fontSize(11).text(String(value));
            doc.moveDown(0.75);
        });

        doc.end();
    });
}
