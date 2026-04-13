# backend/src/members

Team membership and email invite system.

| File | Purpose |
|---|---|
| `schemas/member.schema.ts` | MongoDB document: projectId, userId, role (owner/admin/member) |
| `schemas/member-invite.schema.ts` | MongoDB document: invite token, email, status, expiry |
| `dto/member.dto.ts` | Validation for invite and role-change payloads |
| `members.service.ts` | Membership CRUD + invite creation + accept/reject invite |
| `members.controller.ts` | Routes under /api/projects/:id/members |
| `invites.controller.ts` | Routes under /api/invites (token-based accept/reject) |
| `project-invitations.controller.ts` | Routes under /api/projects/:id/invitations (list/cancel) |
| `members.module.ts` | Registers schemas, provides MembersService and EmailService |
