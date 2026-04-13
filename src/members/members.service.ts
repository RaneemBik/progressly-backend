/**
 * members.service.ts — Team Membership and Invitation Business Logic
 *
 * Membership operations (getByProject, updateRole, remove):
 *   Role-gated operations: only owner/admin can invite; only owner can
 *   change roles or remove members.
 *
 * Invite flow:
 *   invite() → creates ProjectInvite record → sends email (non-fatal if SMTP missing)
 *   getInviteByToken() → public lookup used by the invite landing page
 *   validateInviteForEmail() → checks token belongs to the registering email
 *   acceptInvite() → creates ProjectMember record, marks invite as accepted
 *   acceptInvitationFromDashboard() → same but by invite ID (dashboard notification)
 *   rejectInvitation() → marks invite as cancelled
 *   getUserPendingInvitations() → returns all pending invites for a user's email
 *   getProjectInvitations() → all invites for a project (owner/admin only)
 */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { ProjectMember, ProjectMemberDocument } from './schemas/member.schema';
import { ProjectInvite, ProjectInviteDocument } from './schemas/member-invite.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { InviteMemberDto, UpdateMemberRoleDto } from './dto/member.dto';
import { EmailService } from '../common/email.service';

@Injectable()
export class MembersService {
  constructor(
    @InjectModel(ProjectMember.name) private memberModel: Model<ProjectMemberDocument>,
    @InjectModel(ProjectInvite.name) private inviteModel: Model<ProjectInviteDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async getByProject(projectId: string, requesterId: string) {
    // Verify requester is a member
    const requester = await this.memberModel.findOne({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(requesterId),
    });
    if (!requester) throw new ForbiddenException('Not a member of this project');

    const members = await this.memberModel.find({
      projectId: new Types.ObjectId(projectId),
    });

    // Populate user info
    return Promise.all(
      members.map(async (member) => {
        const user = await this.userModel.findById(member.userId);
        return {
          id: (member as any)._id.toString(),
          projectId: member.projectId.toString(),
          userId: member.userId.toString(),
          userName: user?.name || 'Unknown',
          userEmail: user?.email || '',
          role: member.role,
        };
      }),
    );
  }

  async invite(projectId: string, requesterId: string, dto: InviteMemberDto) {
    // Only owner or admin can invite
    const requester = await this.memberModel.findOne({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(requesterId),
      role: { $in: ['owner', 'admin'] },
    });
    if (!requester) throw new ForbiddenException('Only owners and admins can invite members');

    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    const normalizedEmail = dto.email.toLowerCase();

    // If target user already exists and already a member, stop.
    const userToInvite = await this.userModel.findOne({
      email: normalizedEmail,
    });

    if (userToInvite) {
      const existing = await this.memberModel.findOne({
        projectId: new Types.ObjectId(projectId),
        userId: userToInvite._id,
      });
      if (existing) {
        throw new ConflictException('User is already a member of this project');
      }
    }

    // Prevent duplicate active invites.
    const existingPendingInvite = await this.inviteModel.findOne({
      projectId: new Types.ObjectId(projectId),
      email: normalizedEmail,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });
    if (existingPendingInvite) {
      throw new ConflictException('A pending invitation for this email already exists');
    }

    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await this.inviteModel.create({
      projectId: new Types.ObjectId(projectId),
      email: normalizedEmail,
      role: dto.role,
      invitedBy: new Types.ObjectId(requesterId),
      token,
      expiresAt,
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const inviteLink = `${frontendUrl}/invite?token=${token}`;

    // Email is best-effort — if SMTP is not configured or fails, the invite is still saved
    await this.emailService.sendProjectInvite({
      to: normalizedEmail,
      projectName: project.name,
      role: dto.role,
      inviteLink,
    });

    return {
      message: 'Invitation sent successfully',
      invite: {
        id: (invite as any)._id.toString(),
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
      },
    };
  }

  async getInviteByToken(token: string) {
    const invite = await this.getPendingInvite(token);
    const project = await this.projectModel.findById(invite.projectId);

    return {
      token,
      projectId: invite.projectId.toString(),
      projectName: project?.name || 'Project',
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      status: invite.status,
    };
  }

  async validateInviteForEmail(token: string, email: string) {
    const invite = await this.getPendingInvite(token);
    if (invite.email !== email.toLowerCase()) {
      throw new BadRequestException('This invite token is for a different email address');
    }
    return invite;
  }

  async acceptInvite(token: string, userId: string, userEmail: string) {
    const invite = await this.getPendingInvite(token);

    if (invite.email !== userEmail.toLowerCase()) {
      throw new ForbiddenException('You can only accept invites sent to your email address');
    }

    const existingMember = await this.memberModel.findOne({
      projectId: invite.projectId,
      userId: new Types.ObjectId(userId),
    });

    if (!existingMember) {
      await this.memberModel.create({
        projectId: invite.projectId,
        userId: new Types.ObjectId(userId),
        role: invite.role,
      });
    }

    await this.inviteModel.findByIdAndUpdate(invite._id, {
      status: 'accepted',
      acceptedBy: new Types.ObjectId(userId),
      acceptedAt: new Date(),
    });

    return {
      message: 'Invitation accepted successfully',
      projectId: invite.projectId.toString(),
      role: invite.role,
    };
  }

  async updateRole(projectId: string, memberId: string, requesterId: string, dto: UpdateMemberRoleDto) {
    // Owner and admin can update roles (owner role itself is immutable)
    const requester = await this.memberModel.findOne({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(requesterId),
      role: { $in: ['owner', 'admin'] },
    });
    if (!requester) throw new ForbiddenException('Only owners and admins can change roles');

    const member = await this.memberModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(memberId),
        projectId: new Types.ObjectId(projectId),
        role: { $ne: 'owner' }, // Cannot change owner's role
      },
      { role: dto.role },
      { new: true },
    );

    if (!member) throw new NotFoundException('Member not found or cannot modify owner role');

    const user = await this.userModel.findById(member.userId);

    return {
      id: (member as any)._id.toString(),
      projectId: member.projectId.toString(),
      userId: member.userId.toString(),
      userName: user?.name || 'Unknown',
      userEmail: user?.email || '',
      role: member.role,
    };
  }

  async remove(projectId: string, memberId: string, requesterId: string) {
    // Owner and admin can remove members (cannot remove owner)
    const requester = await this.memberModel.findOne({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(requesterId),
      role: { $in: ['owner', 'admin'] },
    });
    if (!requester) throw new ForbiddenException('Only owners and admins can remove members');

    const member = await this.memberModel.findOne({
      _id: new Types.ObjectId(memberId),
      projectId: new Types.ObjectId(projectId),
      role: { $ne: 'owner' },
    });
    if (!member) throw new NotFoundException('Member not found or cannot remove owner');

    await this.memberModel.findByIdAndDelete(memberId);
    return { message: 'Member removed successfully' };
  }

  private async getPendingInvite(token: string) {
    const invite = await this.inviteModel.findOne({ token });
    if (!invite) throw new NotFoundException('Invitation not found');

    if (invite.status !== 'pending') {
      throw new BadRequestException('Invitation is no longer pending');
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invitation has expired');
    }

    return invite;
  }

  async getProjectInvitations(projectId: string, requesterId: string) {
    // Only owner or admin can view invitations
    const requester = await this.memberModel.findOne({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(requesterId),
      role: { $in: ['owner', 'admin'] },
    });
    if (!requester) throw new ForbiddenException('Only owners and admins can view invitations');

    const invites = await this.inviteModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ createdAt: -1 });

    return Promise.all(
      invites.map(async (invite) => {
        const invitedByUser = await this.userModel.findById(invite.invitedBy);
        const acceptedByUser = invite.acceptedBy ? await this.userModel.findById(invite.acceptedBy) : null;

        return {
          id: (invite as any)._id.toString(),
          email: invite.email,
          role: invite.role,
          status: invite.status,
          invitedBy: {
            id: invite.invitedBy.toString(),
            name: invitedByUser?.name || 'Unknown',
            email: invitedByUser?.email || '',
          },
          acceptedBy: acceptedByUser ? {
            id: invite.acceptedBy?.toString(),
            name: acceptedByUser.name,
            email: acceptedByUser.email,
          } : null,
          createdAt: invite.createdAt,
          acceptedAt: invite.acceptedAt,
          expiresAt: invite.expiresAt,
        };
      }),
    );
  }

  async cancelInvitation(projectId: string, inviteId: string, requesterId: string) {
    // Only owner or admin can cancel invitations
    const requester = await this.memberModel.findOne({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(requesterId),
      role: { $in: ['owner', 'admin'] },
    });
    if (!requester) throw new ForbiddenException('Only owners and admins can cancel invitations');

    const invite = await this.inviteModel.findOne({
      _id: new Types.ObjectId(inviteId),
      projectId: new Types.ObjectId(projectId),
    });
    if (!invite) throw new NotFoundException('Invitation not found');

    if (invite.status !== 'pending') {
      throw new BadRequestException('Can only cancel pending invitations');
    }

    await this.inviteModel.findByIdAndUpdate(inviteId, { status: 'cancelled' });

    return { message: 'Invitation cancelled successfully' };
  }

  /** Get all pending invitations for the logged-in user */
  async getUserPendingInvitations(userId: string, userEmail: string) {
    const invites = await this.inviteModel
      .find({
        email: userEmail.toLowerCase(),
        status: 'pending',
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 });

    return Promise.all(
      invites.map(async (invite) => {
        const project = await this.projectModel.findById(invite.projectId);
        const invitedByUser = await this.userModel.findById(invite.invitedBy);

        return {
          id: (invite as any)._id.toString(),
          projectId: invite.projectId.toString(),
          projectName: project?.name || 'Project',
          projectDescription: project?.description || '',
          email: invite.email,
          role: invite.role,
          invitedBy: {
            id: invite.invitedBy.toString(),
            name: invitedByUser?.name || 'Unknown',
          },
          createdAt: invite.createdAt,
          expiresAt: invite.expiresAt,
        };
      }),
    );
  }

  /** Accept invitation from dashboard (id-based) */
  async acceptInvitationFromDashboard(inviteId: string, userId: string, userEmail: string) {
    const invite = await this.inviteModel.findById(inviteId);
    if (!invite) throw new NotFoundException('Invitation not found');

    if (invite.status !== 'pending') {
      throw new BadRequestException('Invitation is no longer pending');
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invitation has expired');
    }

    if (invite.email !== userEmail.toLowerCase()) {
      throw new ForbiddenException('You can only accept invites sent to your email address');
    }

    const existingMember = await this.memberModel.findOne({
      projectId: invite.projectId,
      userId: new Types.ObjectId(userId),
    });

    if (!existingMember) {
      await this.memberModel.create({
        projectId: invite.projectId,
        userId: new Types.ObjectId(userId),
        role: invite.role,
      });
    }

    await this.inviteModel.findByIdAndUpdate(inviteId, {
      status: 'accepted',
      acceptedBy: new Types.ObjectId(userId),
      acceptedAt: new Date(),
    });

    const project = await this.projectModel.findById(invite.projectId);
    return {
      message: 'Invitation accepted successfully',
      projectId: invite.projectId.toString(),
      projectName: project?.name || 'Project',
      role: invite.role,
    };
  }

  /** Reject/cancel invitation for the user */
  async rejectInvitation(inviteId: string, userId: string, userEmail: string) {
    const invite = await this.inviteModel.findById(inviteId);
    if (!invite) throw new NotFoundException('Invitation not found');

    if (invite.email !== userEmail.toLowerCase()) {
      throw new ForbiddenException('You can only reject invites sent to your email address');
    }

    if (invite.status !== 'pending') {
      throw new BadRequestException('Can only reject pending invitations');
    }

    await this.inviteModel.findByIdAndUpdate(inviteId, { status: 'cancelled' });

    return { message: 'Invitation rejected successfully' };
  }
}
