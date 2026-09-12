# V3.0 New Environment Migration

This checklist prepares the new environment without touching the current server or DNS.

## Data policy

Initialize a new empty database from migrations. Do not import historical test users, registrations, orders, payment/refund transactions, invoices, follows, QR instances, sessions, or user-specific certificates. Preserve only approved configuration: `ActivitySeries`, categories, approved activities, banners, certificate templates, required Admin configuration, and static upload assets.

## Preflight parameters

Record and verify the new server OS/version, CPU/RAM/disk, public IP, SSH user/port, firewall rules, timezone, Node/npm/PM2/Nginx versions, database host/port/name/user, MySQL version, charset, and security-group allowlist. Secrets must be supplied out of band and never committed.

## Database sequence

1. Create an empty `utf8mb4` database.
2. Set `DB_SYNCHRONIZE=false` and run the backend migration path from the V2.9H baseline through the latest migration, including `v3.0a-user-identity`.
3. Verify `schema_migrations`, `uq_user_user_code`, `uq_user_wechat_app_openid`, registration/order/payment/follow unique constraints, and foreign keys.
4. Run `npm -w backend run audit:v30-duplicates` and retain the read-only report.
5. Load only the configuration data approved by the product owner.

## Deployment and cutover

Build locally, upload the complete backend `dist`, Admin `dist`, production environment file, and approved uploads. Start PM2 and Nginx on the new host. Verify `/health`, activity APIs, Admin access, TLS, uploads, and WeChat legal-domain configuration using the new IP or a temporary hosts entry before changing DNS.

Change `api.tenselog.cn` and `admin.tenselog.cn` only after all checks pass. Then verify DNS, TLS, login, registration, Follow, Mine, Journey, check-in, and Admin. Keep the old environment read-only with backups until a full acceptance cycle completes; rollback means restoring DNS to the old host and stopping writes on the new host.

## Waiting for user input

No remote operation is authorized until the new server and database parameters are provided. Required values are listed in “Preflight parameters”.
