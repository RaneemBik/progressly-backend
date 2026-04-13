/**
 * tasks.module.ts — Tasks Feature Module
 *
 * Registers: Task, ProjectMember, User, and Project schemas.
 * The Project schema is needed so TasksService can check project.dependencyMode.
 * Provides: TasksService and DependencyValidatorService.
 * Exports: MongooseModule (so other modules can access Task schema if needed).
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task, TaskSchema } from './schemas/task.schema';
import { ProjectMember, ProjectMemberSchema } from '../members/schemas/member.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { DependencyValidatorService } from './services/dependency-validator.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: ProjectMember.name, schema: ProjectMemberSchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService, DependencyValidatorService],
  exports: [MongooseModule],
})
export class TasksModule {}
