# backend/src/projects

Full project lifecycle including soft-delete (trash) and restore.

| File | Purpose |
|---|---|
| `schemas/project.schema.ts` | MongoDB document: name, description, ownerId, dependencyMode, deletedAt |
| `dto/project.dto.ts` | Validation for create and update payloads |
| `projects.service.ts` | CRUD + softDelete / restore / hardDelete business logic |
| `projects.controller.ts` | HTTP routes: GET, POST, PUT, DELETE, PATCH /restore, DELETE /permanent |
| `projects.module.ts` | Registers schemas, provides ProjectsService |
