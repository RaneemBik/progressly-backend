/**
 * project-invitations.controller.ts — Project Invitations Management Controller
 *
 * Handles invite management at /api/projects/:projectId/invitations.
 * JWT required. Owner/admin only.
 *
 * Routes:
 *  GET    /              → list all invitations for a project
 *  DELETE /:inviteId     → cancel a pending invitation
 */
import { Controller, Get, Delete, Param, Request, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects/:projectId/invitations')
@UseGuards(JwtAuthGuard)
export class ProjectInvitationsController {
  constructor(private membersService: MembersService) {}

  @Get()
  async getInvitations(
    @Request() req,
    @Param('projectId') projectId: string,
  ) {
    return this.membersService.getProjectInvitations(projectId, req.user.id);
  }

  @Delete(':inviteId')
  async cancelInvitation(
    @Request() req,
    @Param('projectId') projectId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.membersService.cancelInvitation(projectId, inviteId, req.user.id);
  }
}
