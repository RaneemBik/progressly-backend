/**
 * task.schema.ts — MongoDB Task Document Schema
 *
 * Fields:
 *  - projectId: ref to Project
 *  - title, description, status, priority: core task data
 *  - assigneeId: optional ref to User
 *  - dependsOn: array of Task ObjectIds — tasks this task depends on
 *  - isBlocked: computed flag — true if any parent task (in dependsOn) has
 *               status !== 'done'. Recalculated after every task mutation.
 *
 * Tasks are sorted by createdAt ascending so the order is deterministic.
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

@Schema({ timestamps: true })
export class Task {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '', trim: true })
  description: string;

  @Prop({ type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' })
  status: TaskStatus;

  @Prop({ type: String, enum: ['low', 'medium', 'high'], default: 'medium' })
  priority: TaskPriority;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  assigneeId: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], ref: 'Task', default: [] })
  dependsOn: Types.ObjectId[];

  @Prop({ default: false })
  isBlocked: boolean;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id?.toString();
    ret.projectId = ret.projectId?.toString();
    ret.assigneeId = ret.assigneeId?.toString() || null;
    delete ret._id;
    return ret;
  },
});
