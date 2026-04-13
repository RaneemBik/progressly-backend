/**
 * project.schema.ts — MongoDB Project Document Schema
 *
 * Fields:
 *  - name, description: basic project info
 *  - ownerId: ref to the User who created the project
 *  - dependencyMode: when true, task status changes enforce dependency order
 *  - deletedAt: null = active project; Date = soft-deleted (in trash)
 *
 * Soft-delete pattern:
 *  - Moving to trash sets deletedAt = new Date()
 *  - Restoring sets deletedAt = null
 *  - Permanent delete removes the document entirely
 *
 * The toJSON transform: _id → id, ownerId ObjectId → string, preserves deletedAt.
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '', trim: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ default: false })
  dependencyMode: boolean;

  /** Soft-delete: set when trashed, null when active */
  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id?.toString();
    ret.ownerId = ret.ownerId?.toString();
    ret.deletedAt = ret.deletedAt ?? null;
    // Ensure createdAt exists (added by timestamps option)
    if (ret.createdAt && typeof ret.createdAt === 'object') {
      ret.createdAt = ret.createdAt.toISOString();
    }
    delete ret._id;
    return ret;
  },
});
