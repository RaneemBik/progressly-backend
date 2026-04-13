/**
 * users.service.ts — User Database Operations
 *
 * create(name, email, password)
 *   Checks for duplicate email, hashes password (bcrypt, 12 rounds), saves user.
 *   Throws ConflictException if email is already registered.
 *
 * findByEmail(email) / findById(id)
 *   Used by the auth flow. findById is called by JwtStrategy on every request.
 *
 * findByEmailPublic(email)
 *   Returns safe public data (no password) for invite flows.
 *
 * validatePassword(plain, hash)
 *   bcrypt.compare wrapper — used by login to check credentials.
 */
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(name: string, email: string, password: string): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new this.userModel({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async findByEmailPublic(email: string): Promise<{ id: string; name: string; email: string } | null> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) return null;
    return {
      id: (user as any)._id.toString(),
      name: user.name,
      email: user.email,
    };
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
