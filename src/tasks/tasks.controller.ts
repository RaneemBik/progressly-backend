/**
 * tasks.controller.ts — Task HTTP Controller
 *
 * All routes nested under /api/projects/:projectId/tasks.
 * All routes require JWT authentication.
 *
 * IMPORTANT: GET 'graph' must be declared BEFORE GET ':taskId'
 * to prevent NestJS from routing /graph as a task ID.
 *
 * Routes:
 *  GET    /                              → all tasks in project
 *  POST   /                              → create task
 *  PUT    /:taskId                        → update task (dep-mode enforced)
 *  DELETE /:taskId                        → delete task (owner/admin only)
 *  GET    /graph                          → dependency graph { nodes, edges }
 *  POST   /:taskId/dependencies           → add dependency link
 *  DELETE /:taskId/dependencies/:depId    → remove dependency link
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
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, AddDependencyDto } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  async getAll(@Request() req, @Param('projectId') projectId: string) {
    return this.tasksService.getByProject(projectId, req.user.id);
  }

  @Post()
  async create(
    @Request() req,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(projectId, req.user.id, dto);
  }

  @Put(':taskId')
  async update(
    @Request() req,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(projectId, taskId, req.user.id, dto);
  }

  @Delete(':taskId')
  async delete(
    @Request() req,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.delete(projectId, taskId, req.user.id);
  }

  @Get('graph')
  async getDependencyGraph(
    @Request() req,
    @Param('projectId') projectId: string,
  ) {
    return this.tasksService.getDependencyGraph(projectId, req.user.id);
  }

  @Post(':taskId/dependencies')
  async addDependency(
    @Request() req,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: AddDependencyDto,
  ) {
    return this.tasksService.addDependency(projectId, taskId, req.user.id, dto);
  }

  @Delete(':taskId/dependencies/:dependencyId')
  async removeDependency(
    @Request() req,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('dependencyId') dependencyId: string,
  ) {
    return this.tasksService.removeDependency(projectId, taskId, req.user.id, dependencyId);
  }
}
