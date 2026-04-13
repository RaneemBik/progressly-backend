/**
 * seed.ts — Database Seeder (Development Only)
 *
 * Populates the database with demo data for development and testing.
 * Run with: npm run seed
 *
 * Creates:
 *  - A demo user account
 *  - A sample project with the demo user as owner
 *  - A set of sample tasks across all statuses
 *
 * WARNING: Do not run in production. This script does not check for
 * existing data and may create duplicate records.
 */
import * as mongoose from 'mongoose';
import * as bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/progressly';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.getClient().db();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('projects').deleteMany({});
    await db.collection('projectmembers').deleteMany({});
    await db.collection('tasks').deleteMany({});
    await db.collection('projectinvites').deleteMany({});

    // Create users
    console.log('👥 Creating seed users...');
    const hashedPassword = await bcryptjs.hash('Password123!', 10);

    const usersToInsert = [
      {
        name: 'Raneem Bikai',
        email: 'raneem@example.com',
        password: hashedPassword,
      },
      {
        name: 'Ahmed Hassan',
        email: 'ahmed@example.com',
        password: hashedPassword,
      },
      {
        name: 'Fatima Mohamed',
        email: 'fatima@example.com',
        password: hashedPassword,
      },
      {
        name: 'John Smith',
        email: 'john@example.com',
        password: hashedPassword,
      },
    ];

    const insertedUsers = await db.collection('users').insertMany(usersToInsert);
    const userIds = Object.values(insertedUsers.insertedIds).map((id: any) =>
      new ObjectId(id),
    );

    console.log(`✅ Created ${userIds.length} users`);

    // Create projects
    console.log('📋 Creating seed projects...');
    const projectsToInsert = [
      {
        name: 'Website Redesign',
        description: 'Landing page and invitation layout design changes',
        ownerId: userIds[0],
        dependencyMode: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Mobile App Development',
        description: 'React Native mobile app for iOS and Android',
        ownerId: userIds[0],
        dependencyMode: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Backend API Refactor',
        description: 'Refactor authentication and database queries for better performance',
        ownerId: userIds[1],
        dependencyMode: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Database Migration',
        description: 'Migrate from PostgreSQL to MongoDB',
        ownerId: userIds[1],
        dependencyMode: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const insertedProjects = await db.collection('projects').insertMany(projectsToInsert);
    const projectIds = Object.values(insertedProjects.insertedIds).map((id: any) =>
      new ObjectId(id),
    );

    console.log(`✅ Created ${projectIds.length} projects`);

    // Create project members
    console.log('👤 Creating project members...');
    const membersToInsert = [
      // Website Redesign - Raneem (owner) + Ahmed (admin) + Fatima (member)
      { projectId: projectIds[0], userId: userIds[0], role: 'owner' },
      { projectId: projectIds[0], userId: userIds[1], role: 'admin' },
      { projectId: projectIds[0], userId: userIds[2], role: 'member' },

      // Mobile App - Raneem (owner) + John (admin)
      { projectId: projectIds[1], userId: userIds[0], role: 'owner' },
      { projectId: projectIds[1], userId: userIds[3], role: 'admin' },

      // Backend API - Ahmed (owner) + Raneem (admin)
      { projectId: projectIds[2], userId: userIds[1], role: 'owner' },
      { projectId: projectIds[2], userId: userIds[0], role: 'admin' },

      // Database Migration - Ahmed (owner) + Fatima (member)
      { projectId: projectIds[3], userId: userIds[1], role: 'owner' },
      { projectId: projectIds[3], userId: userIds[2], role: 'member' },
    ];

    await db.collection('projectmembers').insertMany(membersToInsert);
    console.log(`✅ Created ${membersToInsert.length} project members`);

    // Create tasks
    console.log('📝 Creating sample tasks...');
    const tasksToInsert = [
      // Website Redesign tasks
      {
        projectId: projectIds[0],
        title: 'Landing page redesign',
        description: 'Update the landing page with new design mockups',
        status: 'in_progress',
        priority: 'high',
        assigneeId: userIds[0],
      },
      {
        projectId: projectIds[0],
        title: 'Invitation layout',
        description: 'Design the invitation modal and acceptance flow',
        status: 'todo',
        priority: 'high',
        assigneeId: userIds[1],
      },
      {
        projectId: projectIds[0],
        title: 'CSS styling improvements',
        description: 'Improve responsive design for mobile devices',
        status: 'todo',
        priority: 'medium',
        assigneeId: null,
      },
      {
        projectId: projectIds[0],
        title: 'Testing and QA',
        description: 'Test all pages across different browsers',
        status: 'done',
        priority: 'medium',
        assigneeId: userIds[2],
      },

      // Mobile App tasks
      {
        projectId: projectIds[1],
        title: 'Setup React Native project',
        description: 'Initialize React Native project with necessary dependencies',
        status: 'done',
        priority: 'high',
        assigneeId: userIds[3],
      },
      {
        projectId: projectIds[1],
        title: 'Implement authentication',
        description: 'Add login and signup functionality',
        status: 'in_progress',
        priority: 'high',
        assigneeId: userIds[0],
      },
      {
        projectId: projectIds[1],
        title: 'Create task list UI',
        description: 'Build the main task list screen',
        status: 'todo',
        priority: 'high',
        assigneeId: null,
      },

      // Backend API tasks
      {
        projectId: projectIds[2],
        title: 'Refactor auth service',
        description: 'Optimize JWT token generation and validation',
        status: 'in_progress',
        priority: 'high',
        assigneeId: userIds[1],
      },
      {
        projectId: projectIds[2],
        title: 'Optimize database queries',
        description: 'Add indexes and optimize slow queries',
        status: 'todo',
        priority: 'high',
        assigneeId: userIds[0],
      },
      {
        projectId: projectIds[2],
        title: 'Add error handling middleware',
        description: 'Implement comprehensive error handling',
        status: 'todo',
        priority: 'medium',
        assigneeId: null,
      },

      // Database Migration tasks
      {
        projectId: projectIds[3],
        title: 'Design new MongoDB schema',
        description: 'Design collection structure for MongoDB',
        status: 'done',
        priority: 'high',
        assigneeId: userIds[1],
      },
      {
        projectId: projectIds[3],
        title: 'Write migration scripts',
        description: 'Create scripts to migrate data from PostgreSQL',
        status: 'in_progress',
        priority: 'high',
        assigneeId: userIds[2],
      },
      {
        projectId: projectIds[3],
        title: 'Test data integrity',
        description: 'Verify all data was migrated correctly',
        status: 'todo',
        priority: 'high',
        assigneeId: null,
      },
    ];

    await db.collection('tasks').insertMany(tasksToInsert);
    console.log(`✅ Created ${tasksToInsert.length} tasks`);

    // Create invitations
    console.log('💌 Creating sample invitations...');
    const invitationsToInsert = [
      {
        projectId: projectIds[0],
        email: 'new-designer@example.com',
        role: 'admin',
        invitedBy: userIds[0],
        token: uuidv4(),
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      {
        projectId: projectIds[1],
        email: 'contractor@example.com',
        role: 'member',
        invitedBy: userIds[0],
        token: uuidv4(),
        status: 'pending',
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      },
      {
        projectId: projectIds[2],
        email: 'intern@example.com',
        role: 'member',
        invitedBy: userIds[1],
        token: uuidv4(),
        status: 'pending',
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      },
    ];

    await db.collection('projectinvites').insertMany(invitationsToInsert);
    console.log(`✅ Created ${invitationsToInsert.length} invitations`);

    console.log('\n✨ Seed data created successfully!');
    console.log('\n📌 Test Credentials:');
    console.log('   Email: raneem@example.com');
    console.log('   Email: ahmed@example.com');
    console.log('   Email: fatima@example.com');
    console.log('   Email: john@example.com');
    console.log('   Password: Password123! (for all accounts)');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

seed();
