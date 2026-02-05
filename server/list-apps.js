import { getApplications } from './services/db.js';

(async () => {
    try {
        const apps = await getApplications();
        console.log('Applications count:', apps.length);
        console.log('Most recent application:', apps[0]);
    } catch (e) {
        console.error('Error listing applications:', e && e.message ? e.message : e);
    }
    process.exit();
})();
