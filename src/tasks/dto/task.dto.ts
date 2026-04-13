/**
 * task.dto.ts — Task Data Transfer Objects
 *
 * CreateTaskDto: title (required), description, status, priority,
 *   assigneeId, dependsOn[] (array of task IDs to depend on).
 *
 * UpdateTaskDto: all fields optional. Members are restricted server-side
 *   to only updating status and assigneeId on their own assigned tasks.
 *
 * AddDependencyDto: dependsOnTaskId — single task ID to add as a new
 *   dependency via POST /:taskId/dependencies.
 */
import { IsString, IsOptional, IsEnum, MinLength, MaxLength, IsArray } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(['todo', 'in_progress', 'done'])
  status?: 'todo' | 'in_progress' | 'done';

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsArray()
  dependsOn?: string[];
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(['todo', 'in_progress', 'done'])
  status?: 'todo' | 'in_progress' | 'done';

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @IsOptional()
  assigneeId?: string | null;

  @IsOptional()
  @IsArray()
  dependsOn?: string[];
}

export class AddDependencyDto {
  @IsString()
  dependsOnTaskId: string;
}
