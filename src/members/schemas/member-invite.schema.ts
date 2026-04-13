/**
 * member-invite.schema.ts — MongoDB ProjectInvite Document Schema
 *
 * Represents a pending/accepted/cancelled project invitation:
 *  - projectId, email, role: core invite data
 *  - invitedBy: ref to User who sent the invite
 *  - token: unique hex string (48 chars) used in the invite link URL
 *  - status: 'pending' → 'accepted' or 'cancelled'
 *  - expiresAt: 7 days from creation
 *  - acceptedBy / acceptedAt: populated when accepted
 *
 * Indexes: token (unique), { projectId, email, status } (query performance).
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectInviteDocument = ProjectInvite & Document;
export type InviteRole = 'admin' | 'member';
export type InviteStatus = 'pending' | 'accepted' | 'cancelled';

@Schema({ timestamps: true })
export class ProjectInvite {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ type: String, enum: ['admin', 'member'], required: true })
  role: InviteRole;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invitedBy: Types.ObjectId;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ type: String, enum: ['pending', 'accepted', 'cancelled'], default: 'pending' })
  status: InviteStatus;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  acceptedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  acceptedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProjectInviteSchema = SchemaFactory.createForClass(ProjectInvite);

ProjectInviteSchema.index({ token: 1 }, { unique: true });
ProjectInviteSchema.index({ projectId: 1, email: 1, status: 1 });
