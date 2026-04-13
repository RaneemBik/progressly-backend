/**
 * dependency-validator.service.ts — Task Dependency Validation
 *
 * Validates dependency relationships before they are persisted:
 *
 * validateDependencies(projectId, taskId, dependsOn[])
 *   1. Rejects self-references (task depending on itself)
 *   2. Confirms all dependency IDs exist in the same project
 *   3. Detects circular dependencies via BFS traversal
 *
 * wouldCreateCycle(taskId, depId) — private BFS
 *   Starting from depId, traverses the dependency graph. If it reaches
 *   taskId, a cycle would be created → reject the dependency.
 *
 * Used by TasksService.create(), TasksService.update(), and
 * TasksService.addDependency() before persisting any changes.
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from '../schemas/task.schema';

@Injectable()
export class DependencyValidatorService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async validateDependencies(projectId: string, taskId: string, dependsOn: string[]): Promise<void> {
    if (!dependsOn || dependsOn.length === 0) return;

    const projectIdObj = new Types.ObjectId(projectId);

    // Self-reference check
    if (dependsOn.includes(taskId)) {
      throw new BadRequestException('A task cannot depend on itself');
    }

    // All deps must exist in the same project
    const found = await this.taskModel.find({
      _id: { $in: dependsOn.map(id => new Types.ObjectId(id)) },
      projectId: projectIdObj,
    });

    if (found.length !== dependsOn.length) {
      throw new BadRequestException('One or more dependency tasks do not exist in this project');
    }

    // Circular dependency check (only when taskId is a real saved task)
    let isNewTask = false;
    try { new Types.ObjectId(taskId); } catch { isNewTask = true; }

    if (!isNewTask) {
      for (const depId of dependsOn) {
        const cycle = await this.wouldCreateCycle(taskId, depId);
        if (cycle) throw new BadRequestException('Adding this dependency would create a circular dependency');
      }
    }
  }

  // Check if making `taskId` depend on `depId` would create a cycle
  // i.e., is `taskId` already reachable FROM `depId`?
  private async wouldCreateCycle(taskId: string, depId: string): Promise<boolean> {
    const visited = new Set<string>();
    const queue = [depId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === taskId) return true; // cycle found
      if (visited.has(current)) continue;
      visited.add(current);

      const task = await this.taskModel.findById(new Types.ObjectId(current)).select('dependsOn');
      for (const d of task?.dependsOn || []) {
        queue.push(d.toString());
      }
    }
    return false;
  }
}
