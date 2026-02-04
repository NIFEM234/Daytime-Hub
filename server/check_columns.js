const { Pool } = require('pg');
const conn = process.env.DATABASE_URL;
if (!conn) {
    console.error('Error: DATABASE_URL environment variable is not set. Aborting.');
    process.exit(1);
}
const pool = new Pool({ connectionString: conn });
(async () => {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='volunteer_applications' ORDER BY ordinal_position");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await pool.end();
    }
})();
