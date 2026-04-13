/**
 * app.module.ts — Root Application Module
 *
 * The top-level NestJS module that wires everything together:
 *  - ConfigModule: loads .env / .env.production, makes ConfigService globally available
 *  - MongooseModule: connects to MongoDB using MONGODB_URI env var
 *  - AuthModule, UsersModule, ProjectsModule, TasksModule, MembersModule
 *
 * All feature modules are registered here. Adding a new feature module means
 * importing it in this file.
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { MembersModule } from './members/members.module';

@Module({
  imports: [
    // ConfigModule must be first and global so all modules can inject ConfigService
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.production', '.env'],
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri =
          configService.get<string>('MONGODB_URI') ||
          configService.get<string>('MONGO_URI') ||
          configService.get<string>('DATABASE_URL') ||
          'mongodb://localhost:27017/progressly';

        return {
          uri,
          // Timeouts suitable for Atlas free tier cold starts
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          socketTimeoutMS: 45000,
        };
      },
      inject: [ConfigService],
    }),

    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    MembersModule,
  ],
})
export class AppModule {}
