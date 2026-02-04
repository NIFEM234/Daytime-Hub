Security: moving secrets out of .env and into the environment

Overview
- Do not store production secrets in repository files. Keep `.env` only for local development.
- Use platform-specific environment variable storage for production (systemd, Docker, cloud provider, Kubernetes secrets, etc.).

Quick checklist
- Add `.env` and `server/.env` to `.gitignore` (already done).
- Create `server/.env.example` with placeholders (added).
- Rotate any exposed keys (SendGrid, DB password) immediately.

How to set environment variables in common environments

Linux systemd (example service file snippet)
- In the unit file (`/etc/systemd/system/daytime-hub.service`):

[Service]
Environment=PORT=3000
Environment=DATABASE_URL=postgresql://postgres:your_db_password@localhost:5432/daytime_hub
Environment=SENDGRID_API_KEY=your_sendgrid_key
Environment=ADMIN_USER=AdminUserDTH
Environment=ADMIN_PASS=YourStrongPassword

- Then reload and restart:

sudo systemctl daemon-reload
sudo systemctl restart daytime-hub

Docker (docker run)
- Provide env vars on run:

docker run -d -p 3000:3000 \
  -e DATABASE_URL='postgresql://postgres:password@db:5432/daytime_hub' \
  -e SENDGRID_API_KEY='SG.xxx' \
  -e ADMIN_PASS='YourStrongPassword' \
  your-image:tag

Docker Compose (recommended)
- Use an external env file that is not committed, or define env vars in the environment where you run `docker-compose up`.
- Example `docker-compose.yml` (don't commit `.env` with secrets):

services:
  app:
    image: your-image
    environment:
      - DATABASE_URL
      - SENDGRID_API_KEY
      - ADMIN_PASS

Kubernetes
- Create a Secret and mount or expose as env vars:

kubectl create secret generic daytime-secrets \
  --from-literal=DATABASE_URL='postgresql://postgres:pwd@...' \
  --from-literal=SENDGRID_API_KEY='SG.xxxx' \
  --from-literal=ADMIN_PASS='YourStrongPassword'

Then reference the secret in your pod spec.

Azure App Service
- In the Azure Portal, go to your Web App → Configuration → Application settings and add the keys there.

Heroku
- `heroku config:set SENDGRID_API_KEY=xxx DATABASE_URL=...`

Windows (PowerShell)
- Set for current process / session:

$env:SENDGRID_API_KEY = "your_key"

- Persist as user/system env var (requires admin for system):

setx SENDGRID_API_KEY "your_key"

Code changes (already applied)
- `server/server.js` now only loads `.env` when `NODE_ENV !== 'production'`.
- Keep `server/.env.example` in the repo to document required variables.

Next steps for you
1. Rotate the SendGrid API key and DB password if they were exposed.
2. Set the production environment variables via your deployment method.
3. Remove any `.env` from the production server filesystem, or ensure it contains no secrets if you must keep it.
4. Optionally store secrets in a secrets manager (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault) for extra security.

If you want, I can:
- Help run a script to update production env variables (if you provide access details), or
- Provide a prepared `systemd` unit file or `docker-compose.yml` configured to read env vars (no secrets included), or
- Generate a strong admin password for you and show how to update it safely.
