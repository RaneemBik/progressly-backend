/**
 * auth.service.ts — Authentication Business Logic
 *
 * register(name, email, password, inviteToken?)
 *   Creates a new user via UsersService. If an inviteToken is provided,
 *   validates it and accepts the project invitation automatically. Returns JWT.
 *
 * login(email, password)
 *   Finds user by email, verifies bcrypt password hash. Returns JWT.
 *   Throws UnauthorizedException for any invalid credential to avoid
 *   leaking whether the email exists.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MembersService } from '../members/members.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private membersService: MembersService,
  ) {}

  async register(name: string, email: string, password: string, inviteToken?: string) {
    if (inviteToken) {
      await this.membersService.validateInviteForEmail(inviteToken, email);
    }

    const user = await this.usersService.create(name, email, password);

    if (inviteToken) {
      await this.membersService.acceptInvite(inviteToken, (user as any)._id.toString(), user.email);
    }

    const payload = { sub: (user as any)._id.toString(), email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: (user as any)._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: (user as any).createdAt,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await this.usersService.validatePassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: (user as any)._id.toString(), email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: (user as any)._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: (user as any).createdAt,
      },
    };
  }
}
