/**
 * user.schema.ts — MongoDB User Document Schema
 *
 * Defines the shape of a user document in the 'users' collection:
 *  - name: display name
 *  - email: unique, stored lowercase
 *  - password: bcrypt hash (NEVER returned to the client — stripped in toJSON)
 *  - avatar: optional profile image URL
 *
 * The toJSON transform:
 *  - Maps _id → id (string)
 *  - Removes _id and password from all serialised responses
 *  - Removes the __v version key
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: null })
  avatar: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.password;
    return ret;
  },
});
