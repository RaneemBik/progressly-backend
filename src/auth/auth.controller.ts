/**
 * auth.controller.ts — Authentication HTTP Controller
 *
 * Exposes two public (no JWT required) endpoints:
 *  POST /api/auth/register  →  create account, returns JWT + user
 *  POST /api/auth/login     →  validate credentials, returns JWT + user
 *
 * Delegates all business logic to AuthService.
 */
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.name, dto.email, dto.password, dto.inviteToken);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
}
