# backend/src/tasks

Task management with dependency enforcement.

| File | Purpose |
|---|---|
| `schemas/task.schema.ts` | MongoDB document: title, status, priority, assigneeId, dependsOn[], isBlocked |
| `dto/task.dto.ts` | Validation for create, update, and addDependency payloads |
| `services/dependency-validator.service.ts` | Validates deps: no self-reference, no circular, all IDs exist in project |
| `tasks.service.ts` | CRUD + dependency mode enforcement + isBlocked recalculation |
| `tasks.controller.ts` | HTTP routes under /api/projects/:id/tasks |
| `tasks.module.ts` | Registers schemas, provides TasksService and DependencyValidatorService |
