# Security Phase 3 Operations Runbook

## GitHub repository settings

Enable branch protection for `main`: require pull requests, require the backend, frontend, secret-scan, dependency-review and CodeQL checks, dismiss stale approvals, and block force pushes/deletions. Enable GitHub secret scanning, push protection and private vulnerability reporting.

Set repository variables:

- `FRONTEND_HEALTH_URL=https://academy.khiladi-khoj.com`
- `BACKEND_HEALTH_URL=https://<render-service>/api/health`

For manually triggered audit verification, set read-only GitHub Actions secrets `SECURITY_AUDIT_MONGO_URI`, `SECURITY_AUDIT_JWT_ACCESS_SECRET`, `SECURITY_AUDIT_JWT_REFRESH_SECRET`, and `SECURITY_AUDIT_LOG_SIGNING_KEY`. The MongoDB user should only have `read` on `khiladi_academy_manager`.

## MongoDB Atlas least privilege

Create a dedicated application user with `readWrite` on only `khiladi_academy_manager`. Do not grant `atlasAdmin`, `dbOwner`, `readWriteAnyDatabase`, `userAdminAnyDatabase`, or access to `admin`. Create a separate read-only audit user. Restrict Network Access to Render outbound IP/CIDR where the hosting plan supports stable egress; never leave `0.0.0.0/0` permanently. Require TLS and rotate credentials after removing old users.

Run before deployment:

```powershell
cd backend
npm run security:verify-production
```

## Vercel and Render verification

Deploy both services, then run:

```powershell
$env:FRONTEND_HEALTH_URL="https://academy.khiladi-khoj.com"
$env:BACKEND_HEALTH_URL="https://your-render-service.onrender.com/api/health"
cd backend
npm run security:verify-headers
```

## Backup restoration drill

Never restore a drill over production. Create an isolated Atlas project/cluster or clearly named `khiladi_academy_manager_restore_drill` database. Restore the newest backup there using Atlas Restore or `mongorestore`, create a read-only drill user, and run:

```powershell
$env:BACKUP_RESTORE_URI="mongodb+srv://readonly-user:password@restore-cluster/khiladi_academy_manager_restore_drill?retryWrites=true&w=majority&appName=khiladi-restore-drill"
cd backend
npm run backup:verify-restore
```

Record backup timestamp, restore start/end time, counts returned by the script, RPO/RTO, tester, and cleanup confirmation. Delete the temporary database and credentials after evidence is retained. Perform this quarterly.

## Audit incident response

Treat `SECURITY_ALERT audit persistence failed` or audit integrity failures as security incidents. Preserve application logs, stop destructive bulk operations if audit writes are unavailable, verify MongoDB health and credentials, run `npm run security:verify-audit`, and investigate affected timestamps before restoring normal operations.
