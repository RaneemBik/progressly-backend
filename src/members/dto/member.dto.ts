/**
 * member.dto.ts — Member Data Transfer Objects
 *
 * InviteMemberDto: email (valid email), role ('admin' | 'member').
 *   Used by POST /api/projects/:id/members/invite.
 *
 * UpdateMemberRoleDto: role ('admin' | 'member').
 *   Used by PUT /api/projects/:id/members/:memberId/role.
 *   Note: 'owner' role cannot be changed via this endpoint.
 */
import { IsEmail, IsEnum } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(['admin', 'member'])
  role: 'admin' | 'member';
}

export class UpdateMemberRoleDto {
  @IsEnum(['admin', 'member'])
  role: 'admin' | 'member';
}
