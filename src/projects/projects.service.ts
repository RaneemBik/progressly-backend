/**
 * projects.service.ts — Project Business Logic
 *
 * Key methods:
 *
 * findAllForUser(userId)
 *   Returns ACTIVE projects (deletedAt is null or missing) where the user is a member.
 *   Uses $or query to handle old documents that predate the deletedAt field.
 *
 * findTrashForUser(userId)
 *   Returns TRASHED projects (deletedAt exists and is not null) owned by this user.
 *
 * softDelete(projectId, userId)
 *   Sets deletedAt = now(). Owner only. Project vanishes from dashboard but all
 *   tasks, members, and data are fully preserved.
 *
 * restore(projectId, userId)
 *   Sets deletedAt = null. Owner only.
 *
 * hardDelete(projectId, userId)
 *   Permanently removes project + all its tasks + all its members.
 *   Requires the project to already be in trash (deletedAt must be set).
 *
 * All read methods attach taskCount and memberCount (computed via countDocuments).
 */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { ProjectMember, ProjectMemberDocument } from '../members/schemas/member.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectMember.name) private memberModel: Model<ProjectMemberDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
  ) {}

  async create(userId: string, dto: CreateProjectDto) {
    const project = await this.projectModel.create({
      name: dto.name,
      description: dto.description || '',
      ownerId: new Types.ObjectId(userId),
      dependencyMode: dto.dependencyMode || false,
      deletedAt: null,
    });
    await this.memberModel.create({
      projectId: project._id,
      userId: new Types.ObjectId(userId),
      role: 'owner',
    });
    return this.formatProject(project, 0, 1);
  }

  /** Active projects only — deletedAt must be null OR not exist */
  async findAllForUser(userId: string) {
    const memberships = await this.memberModel.find({ userId: new Types.ObjectId(userId) });
    const projectIds  = memberships.map(m => m.projectId);
    // Match projects where deletedAt is null OR the field doesn't exist
    const projects = await this.projectModel.find({
      _id: { $in: projectIds },
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    });
    return Promise.all(projects.map(p => this.withCounts(p)));
  }

  /** Trash: soft-deleted projects owned by this user */
  async findTrashForUser(userId: string) {
    const projects = await this.projectModel.find({
      ownerId: new Types.ObjectId(userId),
      deletedAt: { $ne: null, $exists: true },
    });
    return Promise.all(projects.map(p => this.withCounts(p)));
  }

  /** Get project by id — works for both active and trashed (for viewing in trash) */
  async findById(projectId: string, userId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    await this.checkMembership(projectId, userId);
    return this.withCounts(project);
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto) {
    await this.checkOwnerOrAdmin(projectId, userId);
    const project = await this.projectModel.findByIdAndUpdate(
      projectId, { $set: dto }, { new: true },
    );
    if (!project) throw new NotFoundException('Project not found');
    return this.withCounts(project);
  }

  /** Soft-delete: move to trash — owner only */
  async softDelete(projectId: string, userId: string) {
    await this.checkOwner(projectId, userId);
    await this.projectModel.findByIdAndUpdate(projectId, { $set: { deletedAt: new Date() } });
    return { message: 'Project moved to trash' };
  }

  /** Restore from trash — owner only */
  async restore(projectId: string, userId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    const member = await this.memberModel.findOne({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(userId),
      role: 'owner',
    });
    if (!member) throw new ForbiddenException('Only the owner can restore a project');
    await this.projectModel.findByIdAndUpdate(projectId, { $set: { deletedAt: null } });
    const restored = await this.projectModel.findById(projectId);
    const result = this.withCounts(restored);
    console.log('[RESTORE] Backend returning:', result);
    return result;
  }

  /** Permanently delete — owner only, must already be in trash */
  async hardDelete(projectId: string, userId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    if (!project.deletedAt) {
      throw new ForbiddenException('Move the project to trash before permanently deleting it');
    }
    await this.checkOwner(projectId, userId);
    await Promise.all([
      this.projectModel.findByIdAndDelete(projectId),
      this.memberModel.deleteMany({ projectId: new Types.ObjectId(projectId) }),
      this.taskModel.deleteMany({ projectId: new Types.ObjectId(projectId) }),
    ]);
    return { message: 'Project permanently deleted' };
  }

  async checkMembership(projectId: string, userId: string) {
    const member = await this.memberModel.findOne({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(userId),
    });
    if (!member) throw new ForbiddenException('You are not a member of this project');
    return member;
  }

  async checkOwnerOrAdmin(projectId: string, userId: string) {
    const member = await this.memberModel.findOne({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(userId),
      role: { $in: ['owner', 'admin'] },
    });
    if (!member) throw new ForbiddenException('Insufficient permissions');
    return member;
  }

  async checkOwner(projectId: string, userId: string) {
    const member = await this.memberModel.findOne({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(userId),
      role: 'owner',
    });
    if (!member) throw new ForbiddenException('Only the project owner can perform this action');
    return member;
  }

  private async withCounts(project: ProjectDocument) {
    const [taskCount, memberCount] = await Promise.all([
      this.taskModel.countDocuments({ projectId: project._id }),
      this.memberModel.countDocuments({ projectId: project._id }),
    ]);
    return this.formatProject(project, taskCount, memberCount);
  }

  private formatProject(project: ProjectDocument, taskCount: number, memberCount: number) {
    const obj = project.toJSON() as any;
    return { ...obj, taskCount, memberCount };
  }
}
