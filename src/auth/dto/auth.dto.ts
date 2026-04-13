/**
 * auth.dto.ts — Authentication Data Transfer Objects
 *
 * RegisterDto: validates incoming registration payload
 *   - name: 2–50 chars
 *   - email: valid email format
 *   - password: min 8 chars, must include uppercase, number, special char
 *   - inviteToken: optional, used to auto-accept a project invite on signup
 *
 * LoginDto: validates login payload
 *   - email + password (no strength rules — existing accounts may predate requirements)
 */
import { IsEmail, IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/, {
    message: 'Password must contain at least one uppercase letter, one number, and one special character',
  })
  password: string;

  @IsOptional()
  @IsString()
  inviteToken?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
