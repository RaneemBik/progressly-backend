/**
 * projects.controller.ts — Project HTTP Controller
 *
 * All routes require JWT authentication (@UseGuards(JwtAuthGuard)).
 *
 * Route order matters: GET 'trash' must be declared BEFORE GET ':id'
 * otherwise NestJS would try to find a project with id="trash".
 *
 * Routes:
 *  GET    /api/projects              → active projects for current user
 *  GET    /api/projects/trash        → trashed projects (owned by user)
 *  POST   /api/projects              → create project
 *  GET    /api/projects/:id          → get one project
 *  PUT    /api/projects/:id          → update (owner/admin)
 *  DELETE /api/projects/:id          → soft-delete / move to trash (owner)
 *  PATCH  /api/projects/:id/restore  → restore from trash (owner)
 *  DELETE /api/projects/:id/permanent → permanently delete (owner, must be in trash)
 */
import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  getAll(@Request() req) { return this.projectsService.findAllForUser(req.user.id); }

  @Get('trash')
  getTrash(@Request() req) { return this.projectsService.findTrashForUser(req.user.id); }

  @Post()
  create(@Request() req, @Body() dto: CreateProjectDto) { return this.projectsService.create(req.user.id, dto); }

  @Get(':id')
  getById(@Request() req, @Param('id') id: string) { return this.projectsService.findById(id, req.user.id); }

  @Put(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateProjectDto) { return this.projectsService.update(id, req.user.id, dto); }

  @Delete(':id')
  softDelete(@Request() req, @Param('id') id: string) { return this.projectsService.softDelete(id, req.user.id); }

  @Patch(':id/restore')
  restore(@Request() req, @Param('id') id: string) { return this.projectsService.restore(id, req.user.id); }

  @Delete(':id/permanent')
  hardDelete(@Request() req, @Param('id') id: string) { return this.projectsService.hardDelete(id, req.user.id); }
}
