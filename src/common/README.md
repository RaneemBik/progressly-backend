# backend/src/common

Shared services used across multiple modules.

| File | Purpose |
|---|---|
| `email.service.ts` | Sends invite emails via SMTP (Nodemailer). Non-fatal: if SMTP is not configured, logs the invite link and continues without throwing. |
