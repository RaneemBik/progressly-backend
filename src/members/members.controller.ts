/**
 * members.controller.ts — Project Members HTTP Controller
 *
 * Nested under /api/projects/:projectId/members. JWT required.
 *
 * Routes:
 *  GET    /                    → list all members with user details
 *  POST   /invite              → send invite email, create pending invite record
 *  PUT    /:memberId/role      → change member's role (owner only)
 *  DELETE /:memberId           → remove member from project (owner only)
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { InviteMemberDto, UpdateMemberRoleDto } from './dto/member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects/:projectId/members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  async getAll(@Request() req, @Param('projectId') projectId: string) {
    return this.membersService.getByProject(projectId, req.user.id);
  }

  @Post('invite')
  async invite(
    @Request() req,
    @Param('projectId') projectId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.membersService.invite(projectId, req.user.id, dto);
  }

  @Put(':memberId/role')
  async updateRole(
    @Request() req,
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.membersService.updateRole(projectId, memberId, req.user.id, dto);
  }

  @Delete(':memberId')
  async remove(
    @Request() req,
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.remove(projectId, memberId, req.user.id);
  }
}
