/**
 * jwt-auth.guard.ts — JWT Authentication Guard
 *
 * Apply this guard to any controller or route handler that requires the
 * user to be logged in:
 *
 *   @UseGuards(JwtAuthGuard)
 *
 * It extends NestJS's built-in AuthGuard('jwt') which:
 *  1. Extracts the Bearer token from the Authorization header
 *  2. Runs it through JwtStrategy.validate()
 *  3. Attaches the validated user to req.user
 *  4. Returns 401 Unauthorized if the token is missing, expired, or invalid
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
