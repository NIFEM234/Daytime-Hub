Rotate SendGrid API key

1. Best (Dashboard):
   - Log in to https://app.sendgrid.com/ -> Settings -> API Keys.
   - Create a new API key (give it a descriptive name), copy the new value.
   - Replace `SENDGRID_API_KEY` in your production environment (see below how to set env vars).
   - Revoke the old API key once you confirm the new key works.

2. Via API (advanced):
   - You can create/revoke keys via the SendGrid API, but this requires an existing key with permission to manage API keys. Prefer the Dashboard if unsure.

Rotate Postgres password

1. On the Postgres host (psql):
   ALTER USER postgres WITH PASSWORD 'NewStrongPasswordHere';

2. Update your production environment variable `DATABASE_URL` to use the new password. Example form:
   postgresql://postgres:NewStrongPasswordHere@db-host:5432/daytime_hub

3. Restart your application so it picks up the updated `DATABASE_URL`.

Update environment variables for systemd

1. Create `/etc/daytime-hub/daytime.env` (owner root, mode 600):
   PORT=3000
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@db-host:5432/daytime_hub
   SENDGRID_API_KEY=SG.your_new_key
   ADMIN_USER=AdminUserDTH
   ADMIN_PASS=YourNewStrongAdminPassword

2. Set proper permissions and restart service:
   sudo mkdir -p /etc/daytime-hub
   sudo chown root:root /etc/daytime-hub/daytime.env
   sudo chmod 600 /etc/daytime-hub/daytime.env
   sudo systemctl daemon-reload
   sudo systemctl restart daytime-hub

Update environment variables for Docker Compose

1. Edit `prod.env` (not committed) with new values.
2. Recreate the service:
   docker-compose -f docker-compose.prod.yml up -d --no-deps --build app

Notes and precautions

- Always keep backups before making DB user/password changes.
- Test new keys/passwords in a staging environment first if possible.
- Do NOT commit any files containing real secrets to version control.
- Use a secrets manager (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault) for production when possible.
