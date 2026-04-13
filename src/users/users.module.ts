/**
 * users.module.ts — Users Feature Module
 *
 * Minimal module that:
 *  - Registers the User Mongoose schema
 *  - Provides UsersService
 *  - Exports UsersService so AuthModule and MembersModule can inject it
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
