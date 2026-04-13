/**
 * members.module.ts — Members Feature Module
 *
 * Registers all schemas needed by the members feature:
 *  ProjectMember, ProjectInvite, User, Project.
 *
 * IMPORTANT: imports ConfigModule explicitly. This ensures ConfigService
 * resolves correctly in production AOT builds — a missing ConfigModule
 * import here was the cause of 500 errors on login/register in production.
 *
 * Provides: MembersService, EmailService.
 * Exports: MembersService and MongooseModule (for AuthService invite flow).
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { InvitesController } from './invites.controller';
import { ProjectInvitationsController } from './project-invitations.controller';
import { ProjectMember, ProjectMemberSchema } from './schemas/member.schema';
import { ProjectInvite, ProjectInviteSchema } from './schemas/member-invite.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { EmailService } from '../common/email.service';

@Module({
  imports: [
    ConfigModule, // ← Ensures ConfigService is available to MembersService and EmailService
    MongooseModule.forFeature([
      { name: ProjectMember.name, schema: ProjectMemberSchema },
      { name: ProjectInvite.name, schema: ProjectInviteSchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [MembersController, InvitesController, ProjectInvitationsController],
  providers: [MembersService, EmailService],
  exports: [MembersService, MongooseModule],
})
export class MembersModule {}
