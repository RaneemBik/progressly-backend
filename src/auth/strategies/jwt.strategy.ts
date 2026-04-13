/**
 * jwt.strategy.ts — Passport JWT Strategy
 *
 * Validates incoming JWT tokens on every protected request:
 *  1. Extracts token from 'Authorization: Bearer <token>' header
 *  2. Verifies signature using JWT_SECRET from env
 *  3. Decodes payload { sub: userId, email }
 *  4. Looks up the user in MongoDB by sub
 *  5. Returns { id, email, name } which NestJS attaches to req.user
 *
 * If the user is not found (deleted account), throws UnauthorizedException.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_SECRET',
        'progressly-secret-key-change-in-production',
      ),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: (user as any)._id.toString(),
      email: user.email,
      name: user.name,
    };
  }
}
