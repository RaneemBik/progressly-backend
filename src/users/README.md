# backend/src/users

Manages user accounts in MongoDB.

| File | Purpose |
|---|---|
| `schemas/user.schema.ts` | MongoDB document: name, email, hashed password, avatar |
| `users.service.ts` | create, findByEmail, findById, validatePassword |
| `users.module.ts` | Registers User schema, provides/exports UsersService |
