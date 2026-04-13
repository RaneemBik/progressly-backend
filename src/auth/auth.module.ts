/**
 * auth.module.ts — Authentication Feature Module
 *
 * Wires together all authentication dependencies:
 *  - ConfigModule: ensures ConfigService resolves in production AOT builds
 *  - UsersModule: needed to look up users during login/register
 *  - MembersModule: needed to process invite tokens on registration
 *  - PassportModule: registers 'jwt' as the default strategy
 *  - JwtModule: configured async from env (JWT_SECRET, 7-day expiry)
 *  - JwtStrategy: validates incoming Bearer tokens
 *  - AuthService: register/login business logic
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [
    ConfigModule, // Explicit import ensures ConfigService resolves even in production AOT
    UsersModule,
    MembersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'progressly-secret-key-change-in-production',
        ),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
