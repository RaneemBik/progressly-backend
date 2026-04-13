# backend/src

NestJS application source code.

| File / Folder | Purpose |
|---|---|
| `main.ts` | Entry point — bootstraps the app, configures CORS, validation, and port |
| `app.module.ts` | Root module — imports and wires all feature modules |
| `auth/` | Authentication: register, login, JWT strategy, guards |
| `users/` | User schema and database operations |
| `projects/` | Project CRUD, soft-delete (trash), restore |
| `tasks/` | Task CRUD, dependency validation, graph data |
| `members/` | Team membership, invite flow, email notifications |
| `common/` | Shared services (EmailService) |
