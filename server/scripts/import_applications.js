import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { Pool } from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const csvPath = path.join(__dirname, '..', '..', 'volunteer_applications.csv');

if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found at ${csvPath}`);
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const insertQuery = `
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
        created_at
    ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
    )
    ON CONFLICT (id) DO NOTHING;
`;

async function run() {
    const csvText = fs.readFileSync(csvPath, 'utf8');
    const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    const countResult = await pool.query('SELECT COUNT(*) FROM volunteer_applications');
    const existingCount = Number(countResult.rows[0]?.count || 0);
    if (existingCount > 0) {
        console.log(`Table already has ${existingCount} rows. Importing new rows only.`);
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let inserted = 0;

        for (const row of records) {
            const values = [
                row.id,
                row.full_name,
                row.email,
                row.address,
                row.postcode,
                row.phone,
                row.emergency_name,
                row.emergency_phone,
                row.role,
                row.availability,
                row.experience || null,
                row.support_needs || null,
                row.created_at || null
            ];
            const result = await client.query(insertQuery, values);
            if (result.rowCount > 0) inserted += 1;
        }

        await client.query('COMMIT');
        console.log(`Import complete. Inserted ${inserted} row(s).`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Import failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
