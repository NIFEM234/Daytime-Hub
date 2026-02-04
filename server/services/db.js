import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const _connectionString = process.env.DATABASE_URL;
const connectionString = typeof _connectionString === 'string' ? _connectionString : (_connectionString == null ? undefined : String(_connectionString));
if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set or is invalid');
}

const pool = new Pool({
    connectionString
});

export async function saveApplication(data) {
    const id = uuidv4();
    const query = `
        INSERT INTO volunteer_applications (
            id,
            full_name,
            email,
            address,
            postcode,
            phone,
            emergency_name,
            emergency_phone,
            role,
            availability,
            experience,
            support_needs,
            why_work_here,
            how_did_you_find_out,
            nationality_visa,
            food_hygiene_certificate,
            food_hygiene_certificate_bring,
            referee1_name,
            referee1_address,
            referee1_postcode,
            referee1_email,
            referee1_phone,
            referee1_relationship,
            referee2_name,
            referee2_address,
            referee2_postcode,
            referee2_email,
            referee2_phone,
            referee2_relationship,
            referee_name,
            referee_email,
            referee_relationship
        ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32
        )
        RETURNING *;
    `;

    const values = [
        id,
        data.fullName,
        data.email,
        data.address,
        data.postcode,
        data.phone,
        data.emergencyName,
        data.emergencyPhone,
        data.role,
        data.availability,
        data.experience || null,
        data.supportNeeds || null,
        data.whyWorkHere || null,
        data.howDidYouFindOut || null,
        data.nationalityVisa || null,
        data.foodHygieneCertificate || null,
        data.foodHygieneBring || null,
        data.referee1Name || null,
        data.referee1Address || null,
        data.referee1Postcode || null,
        data.referee1Email || null,
        data.referee1Phone || null,
        data.referee1Relationship || null,
        data.referee2Name || null,
        data.referee2Address || null,
        data.referee2Postcode || null,
        data.referee2Email || null,
        data.referee2Phone || null,
        data.referee2Relationship || null,
        data.refereeName || null,
        data.refereeEmail || null,
        data.refereeRelationship || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
}

export async function markReferenceRequested(id) {
    const result = await pool.query(
        'UPDATE volunteer_applications SET reference_requested_at = NOW() WHERE id = $1 RETURNING *',
        [id]
    );
    return result.rows[0];
}

export async function getApplications() {
    const result = await pool.query(
        'SELECT * FROM volunteer_applications ORDER BY created_at DESC'
    );
    return result.rows;
}

export async function getApplicationById(id) {
    const result = await pool.query(
        'SELECT * FROM volunteer_applications WHERE id = $1',
        [id]
    );
    return result.rows[0];
}

export async function saveContactMessage(data) {
    const id = uuidv4();
    // ensure table exists
    await pool.query(`
        CREATE TABLE IF NOT EXISTS contact_messages (
            id UUID PRIMARY KEY,
            name TEXT,
            email TEXT,
            phone TEXT,
            subject TEXT,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const query = `
        INSERT INTO contact_messages (id, name, email, phone, subject, message)
        VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;
    `;
    const values = [id, data.name || null, data.email || null, data.phone || null, data.subject || null, data.message || null];
    const result = await pool.query(query, values);
    return result.rows[0];
}
