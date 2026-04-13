/**
 * tasks.service.ts — Task Business Logic
 *
 * Core enforcement of dependency mode rules:
 *
 * update() — when project.dependencyMode is true:
 *   Moving to 'in_progress': all parent tasks must be in_progress or done.
 *   Moving to 'done': all parent tasks must be done.
 *   Violation → throws BadRequestException with the blocking task names.
 *
 * recalcBlockedStatus(projectId) — private, called after every mutation:
 *   Bulk-updates isBlocked for all tasks in the project using a single
 *   MongoDB bulk write operation for efficiency.
 *   isBlocked = true if the task has dependsOn[] AND any parent has status !== 'done'.
 *
 * getDependencyGraph(projectId, requesterId)
 *   Returns { nodes[], edges[] } consumed by the frontend DependencyGraph component.
 *   nodes: all tasks as graph nodes (id, label, status, priority, isBlocked, dependsOn)
 *   edges: one edge per dependency relationship { from, to, label }
 */
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { ProjectMember, ProjectMemberDocument } from '../members/schemas/member.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateTaskDto, UpdateTaskDto, AddDependencyDto } from './dto/task.dto';
import { DependencyValidatorService } from './services/dependency-validator.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectMember.name) private memberModel: Model<ProjectMemberDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private dependencyValidator: DependencyValidatorService,
  ) {}

  async getByProject(projectId: string, requesterId: string) {
    await this.checkMembership(projectId, requesterId);
    const tasks = await this.taskModel.find({ projectId: new Types.ObjectId(projectId) }).sort({ createdAt: 1 });
    return Promise.all(tasks.map(t => this.formatTask(t)));
  }

  async create(projectId: string, requesterId: string, dto: CreateTaskDto) {
    await this.checkMembership(projectId, requesterId);

    // Explicit dependsOn array from the form
    const dependsOn = dto.dependsOn?.map(id => new Types.ObjectId(id)) || [];

    const taskData: any = {
      projectId: new Types.ObjectId(projectId),
      title: dto.title,
      description: dto.description || '',
      status: 'todo', // new tasks always start as todo
      priority: dto.priority || 'medium',
      assigneeId: dto.assigneeId ? new Types.ObjectId(dto.assigneeId) : null,
      dependsOn,
    };

    const task = await this.taskModel.create(taskData);

    // Recalculate blocked status across the project
    await this.recalcBlockedStatus(projectId);

    // Return the freshly saved task (with updated isBlocked)
    const fresh = await this.taskModel.findById(task._id);
    return this.formatTask(fresh);
  }

  async update(projectId: string, taskId: string, requesterId: string, dto: UpdateTaskDto) {
    await this.checkMembership(projectId, requesterId);

    const task = await this.taskModel.findOne({
      _id: new Types.ObjectId(taskId),
      projectId: new Types.ObjectId(projectId),
    });
    if (!task) throw new NotFoundException('Task not found');

    // ── Dependency mode enforcement ───────────────────────────────────────────
    if (dto.status && dto.status !== task.status) {
      const project = await this.projectModel.findById(projectId);

      if (project?.dependencyMode && task.dependsOn?.length > 0) {
        const parentStatuses = await this.taskModel.find({
          _id: { $in: task.dependsOn },
        }).select('status title');

        if (dto.status === 'in_progress') {
          // To move to In Progress: ALL parents must be at least in_progress
          const notStarted = parentStatuses.filter(p => p.status === 'todo');
          if (notStarted.length > 0) {
            const names = notStarted.map(p => `"${p.title}"`).join(', ');
            throw new BadRequestException(
              `Cannot start this task. The following prerequisite task${notStarted.length > 1 ? 's are' : ' is'} not yet started: ${names}`,
            );
          }
        }

        if (dto.status === 'done') {
          // To move to Done: ALL parents must be done
          const notDone = parentStatuses.filter(p => p.status !== 'done');
          if (notDone.length > 0) {
            const names = notDone.map(p => `"${p.title}"`).join(', ');
            throw new BadRequestException(
              `Cannot complete this task. The following prerequisite task${notDone.length > 1 ? 's are' : ' is'} not yet completed: ${names}`,
            );
          }
        }
      }
    }

    // ── Role gate ─────────────────────────────────────────────────────────────
    const membership = await this.memberModel.findOne({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(requesterId),
    });

    let filteredDto = { ...dto };
    if (membership?.role === 'member') {
      // Members can only change status and assignee
      filteredDto = { status: dto.status, assigneeId: dto.assigneeId };
    }

    // ── Build update payload ──────────────────────────────────────────────────
    const updateData: any = {};
    if (filteredDto.title !== undefined) updateData.title = filteredDto.title;
    if (filteredDto.description !== undefined) updateData.description = filteredDto.description;
    if (filteredDto.status !== undefined) updateData.status = filteredDto.status;
    if (filteredDto.priority !== undefined) updateData.priority = filteredDto.priority;
    if (filteredDto.assigneeId !== undefined) {
      updateData.assigneeId = filteredDto.assigneeId ? new Types.ObjectId(filteredDto.assigneeId) : null;
    }
    if (filteredDto.dependsOn !== undefined) {
      // Validate no self-reference or cycles
      if (filteredDto.dependsOn.length > 0) {
        await this.dependencyValidator.validateDependencies(projectId, taskId, filteredDto.dependsOn);
      }
      updateData.dependsOn = filteredDto.dependsOn.map(id => new Types.ObjectId(id));
    }

    await this.taskModel.findByIdAndUpdate(taskId, { $set: updateData }, { new: true });

    // Recalc blocked status for entire project after any change
    await this.recalcBlockedStatus(projectId);

    const fresh = await this.taskModel.findById(taskId);
    return this.formatTask(fresh);
  }

  async delete(projectId: string, taskId: string, requesterId: string) {
    const membership = await this.memberModel.findOne({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(requesterId),
      role: { $in: ['owner', 'admin'] },
    });
    if (!membership) throw new ForbiddenException('Only owners and admins can delete tasks');

    const task = await this.taskModel.findOneAndDelete({
      _id: new Types.ObjectId(taskId),
      projectId: new Types.ObjectId(projectId),
    });
    if (!task) throw new NotFoundException('Task not found');

    // Remove this task from anyone else's dependsOn list
    await this.taskModel.updateMany(
      { projectId: new Types.ObjectId(projectId), dependsOn: new Types.ObjectId(taskId) },
      { $pull: { dependsOn: new Types.ObjectId(taskId) } },
    );

    await this.recalcBlockedStatus(projectId);
    return { message: 'Task deleted successfully' };
  }

  async addDependency(projectId: string, taskId: string, requesterId: string, dto: AddDependencyDto) {
    await this.checkMembership(projectId, requesterId);
    const task = await this.taskModel.findOne({ _id: new Types.ObjectId(taskId), projectId: new Types.ObjectId(projectId) });
    if (!task) throw new NotFoundException('Task not found');

    if (task.dependsOn?.some(id => id.toString() === dto.dependsOnTaskId)) {
      throw new BadRequestException('This dependency already exists');
    }

    await this.dependencyValidator.validateDependencies(projectId, taskId, [dto.dependsOnTaskId]);

    await this.taskModel.findByIdAndUpdate(taskId, { $push: { dependsOn: new Types.ObjectId(dto.dependsOnTaskId) } });
    await this.recalcBlockedStatus(projectId);

    const fresh = await this.taskModel.findById(taskId);
    return this.formatTask(fresh);
  }

  async removeDependency(projectId: string, taskId: string, requesterId: string, depId: string) {
    await this.checkMembership(projectId, requesterId);
    await this.taskModel.findOneAndUpdate(
      { _id: new Types.ObjectId(taskId), projectId: new Types.ObjectId(projectId) },
      { $pull: { dependsOn: new Types.ObjectId(depId) } },
    );
    await this.recalcBlockedStatus(projectId);
    const fresh = await this.taskModel.findById(taskId);
    return this.formatTask(fresh);
  }

  async getDependencyGraph(projectId: string, requesterId: string) {
    await this.checkMembership(projectId, requesterId);
    const tasks = await this.taskModel.find({ projectId: new Types.ObjectId(projectId) }).sort({ createdAt: 1 }).lean();

    const nodes = tasks.map(t => ({
      id: t._id.toString(),
      label: t.title,
      status: t.status,
      priority: t.priority,
      isBlocked: t.isBlocked || false,
      assigneeId: t.assigneeId?.toString() || null,
      dependsOn: (t.dependsOn || []).map(id => id.toString()),
    }));

    const edges = [];
    for (const t of tasks) {
      for (const depId of t.dependsOn || []) {
        edges.push({ from: depId.toString(), to: t._id.toString(), label: 'blocks' });
      }
    }

    return { nodes, edges };
  }

  // ── Recalculate isBlocked for every task in the project ───────────────────
  // isBlocked = task has dependencies AND at least one parent is NOT done
  private async recalcBlockedStatus(projectId: string): Promise<void> {
    const tasks = await this.taskModel.find({ projectId: new Types.ObjectId(projectId) });

    const bulk = this.taskModel.collection.initializeUnorderedBulkOp();
    for (const task of tasks) {
      let isBlocked = false;
      if (task.dependsOn && task.dependsOn.length > 0) {
        const pendingParents = await this.taskModel.countDocuments({
          _id: { $in: task.dependsOn },
          status: { $ne: 'done' },
        });
        isBlocked = pendingParents > 0;
      }
      bulk.find({ _id: task._id }).updateOne({ $set: { isBlocked } });
    }

    if (tasks.length > 0) await bulk.execute();
  }

  private async checkMembership(projectId: string, userId: string) {
    const member = await this.memberModel.findOne({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(userId),
    });
    if (!member) throw new ForbiddenException('You are not a member of this project');
    return member;
  }

  private async formatTask(task: TaskDocument) {
    const obj = task.toJSON() as any;
    let assigneeName: string | undefined;
    if (obj.assigneeId) {
      const user = await this.userModel.findById(obj.assigneeId);
      assigneeName = user?.name;
    }
    return { ...obj, assigneeName: assigneeName || null };
  }
}
