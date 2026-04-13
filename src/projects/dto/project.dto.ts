/**
 * project.dto.ts — Project Data Transfer Objects
 *
 * CreateProjectDto: name (required, 1–100 chars), description (optional),
 *   dependencyMode (optional boolean, defaults to false on the service).
 *
 * UpdateProjectDto: all fields optional — used for renaming, changing description,
 *   or toggling dependency mode via PUT /api/projects/:id.
 */
import { IsString, IsOptional, MinLength, MaxLength, IsBoolean } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  dependencyMode?: boolean;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  dependencyMode?: boolean;
}
