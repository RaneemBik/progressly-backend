/**
 * member.schema.ts — MongoDB ProjectMember Document Schema
 *
 * Represents a user's membership in a project:
 *  - projectId: ref to Project
 *  - userId: ref to User
 *  - role: 'owner' | 'admin' | 'member'
 *
 * Compound unique index on { projectId, userId } ensures one membership
 * record per user per project — no duplicates possible at the DB level.
 *
 * Roles determine what actions a user can perform (see Permissions Matrix
 * in DOCUMENTATION.md).
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectMemberDocument = ProjectMember & Document;
export type Role = 'owner' | 'admin' | 'member';

@Schema({ timestamps: true })
export class ProjectMember {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ['owner', 'admin', 'member'], default: 'member' })
  role: Role;
}

export const ProjectMemberSchema = SchemaFactory.createForClass(ProjectMember);

ProjectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

ProjectMemberSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id?.toString();
    ret.projectId = ret.projectId?.toString();
    ret.userId = ret.userId?.toString();
    delete ret._id;
    return ret;
  },
});
