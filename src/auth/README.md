# backend/src/auth

Handles user authentication (register, login) and JWT token validation.

| File | Purpose |
|---|---|
| `auth.controller.ts` | HTTP endpoints: POST /api/auth/register, POST /api/auth/login |
| `auth.service.ts` | Business logic: create user, verify password, sign JWT |
| `auth.module.ts` | Wires together Passport, JWT, UsersModule, MembersModule |
| `dto/auth.dto.ts` | Validation rules for register (strong password) and login payloads |
| `guards/jwt-auth.guard.ts` | Protects routes — add @UseGuards(JwtAuthGuard) to any controller |
| `strategies/jwt.strategy.ts` | Validates Bearer tokens, attaches user to req.user |
