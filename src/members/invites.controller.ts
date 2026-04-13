/**
 * invites.controller.ts — Invite Token HTTP Controller
 *
 * Handles invite token operations at /api/invites.
 *
 * Routes:
 *  GET    /pending                          → invites for current user's email (JWT)
 *  GET    /:token                           → get invite details by token (PUBLIC)
 *  POST   /:token/accept                    → accept invite by token (JWT)
 *  POST   /:inviteId/accept-from-dashboard  → accept from dashboard notification (JWT)
 *  DELETE /:inviteId/reject                 → reject/decline invite (JWT)
 */
import { Controller, Get, Delete, Param, Post, Request, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('invites')
export class InvitesController {
  constructor(private membersService: MembersService) {}

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  async getPendingInvitations(@Request() req) {
    return this.membersService.getUserPendingInvitations(req.user.id, req.user.email);
  }

  @Get(':token')
  async getInvite(@Param('token') token: string) {
    return this.membersService.getInviteByToken(token);
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  async acceptInvite(@Param('token') token: string, @Request() req) {
    return this.membersService.acceptInvite(token, req.user.id, req.user.email);
  }

  @Post(':inviteId/accept-from-dashboard')
  @UseGuards(JwtAuthGuard)
  async acceptFromDashboard(@Param('inviteId') inviteId: string, @Request() req) {
    return this.membersService.acceptInvitationFromDashboard(inviteId, req.user.id, req.user.email);
  }

  @Delete(':inviteId/reject')
  @UseGuards(JwtAuthGuard)
  async rejectInvitation(@Param('inviteId') inviteId: string, @Request() req) {
    return this.membersService.rejectInvitation(inviteId, req.user.id, req.user.email);
  }
}
