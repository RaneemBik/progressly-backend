/**
 * projects.module.ts — Projects Feature Module
 *
 * Registers: Project schema, ProjectMember schema (for membership checks),
 *   Task schema (for counts and cascade delete).
 * Provides and exports ProjectsService.
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project, ProjectSchema } from './schemas/project.schema';
import { ProjectMember, ProjectMemberSchema } from '../members/schemas/member.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: ProjectMember.name, schema: ProjectMemberSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
