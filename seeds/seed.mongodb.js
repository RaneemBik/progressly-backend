/**
 * Progressly Database Seed File
 * 
 * Run this file to populate the database with sample data for development and testing.
 * Usage: mongosh progressly < seeds/seed.mongodb.js
 * 
 * Created: April 6, 2026
 */

// Switch to progressly database
db = db.getSiblingDB('progressly');

// Clear existing data (optional - comment out if you want to preserve data)
console.log('🗑️ Clearing existing collections...');
db.users.deleteMany({});
db.projects.deleteMany({});
db.tasks.deleteMany({});
db.members.deleteMany({});
db.memberinvites.deleteMany({});

console.log('✅ Collections cleared');

// ============================================
// CREATE USERS
// ============================================
console.log('👥 Creating users...');

const users = [
  {
    _id: ObjectId('507f191e810c19729de860ea'),
    email: 'user1@example.com',
    name: 'Raneem Bikkai',
    password: '$2b$10$YIjDVDNL9Q.9E8.J9r/5leSq2p9qWfVdZXzFQHQmrO7h0Z.0bLFJ2', // password123
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01')
  },
  {
    _id: ObjectId('507f191e810c19729de860eb'),
    email: 'user2@example.com',
    name: 'Ahmed Hassan',
    password: '$2b$10$YIjDVDNL9Q.9E8.J9r/5leSq2p9qWfVdZXzFQHQmrO7h0Z.0bLFJ2', // password123
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-02')
  },
  {
    _id: ObjectId('507f191e810c19729de860ec'),
    email: 'user3@example.com',
    name: 'Mona Ali',
    password: '$2b$10$YIjDVDNL9Q.9E8.J9r/5leSq2p9qWfVdZXzFQHQmrO7h0Z.0bLFJ2', // password123
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-03')
  }
];

const usersResult = db.users.insertMany(users);
console.log(`✅ Created ${usersResult.insertedIds.length} users`);

// ============================================
// CREATE PROJECTS
// ============================================
console.log('📁 Creating projects...');

const projects = [
  {
    _id: ObjectId('607f191e810c19729de860ea'),
    name: 'Website Re-design',
    description: 'Landing page and invitation layout design changes',
    ownerId: users[0]._id,
    status: 'Active',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-04-06'),
    deletedAt: null
  },
  {
    _id: ObjectId('607f191e810c19729de860eb'),
    name: 'Mobile App Development',
    description: 'React Native mobile application for iOS and Android',
    ownerId: users[0]._id,
    status: 'Active',
    createdAt: new Date('2026-02-15'),
    updatedAt: new Date('2026-04-06'),
    deletedAt: null
  },
  {
    _id: ObjectId('607f191e810c19729de860ec'),
    name: 'Archived Dashboard Project',
    description: 'Old dashboard redesign project',
    ownerId: users[0]._id,
    status: 'Inactive',
    createdAt: new Date('2025-12-01'),
    updatedAt: new Date('2026-01-15'),
    deletedAt: new Date('2026-03-01')
  }
];

const projectsResult = db.projects.insertMany(projects);
console.log(`✅ Created ${projectsResult.insertedIds.length} projects`);

// ============================================
// CREATE TASKS
// ============================================
console.log('📝 Creating tasks...');

const tasks = [
  // Tasks for Website Re-design Project
  {
    _id: ObjectId('707f191e810c19729de860ea'),
    projectId: projects[0]._id,
    title: 'Landing page',
    description: 'Design and implement new landing page',
    status: 'To Do',
    priority: 'Medium',
    createdAt: new Date('2026-02-05'),
    updatedAt: new Date('2026-04-06')
  },
  {
    _id: ObjectId('707f191e810c19729de860eb'),
    projectId: projects[0]._id,
    title: 'hero section',
    description: 'Create hero section with animations',
    status: 'In Progress',
    priority: 'High',
    createdAt: new Date('2026-02-10'),
    updatedAt: new Date('2026-04-05'),
    dependencies: []
  },
  {
    _id: ObjectId('707f191e810c19729de860ec'),
    projectId: projects[0]._id,
    title: 'About Us Page',
    description: 'Create about us page with team members',
    status: 'Done',
    priority: 'Low',
    createdAt: new Date('2026-02-15'),
    updatedAt: new Date('2026-03-20')
  },
  {
    _id: ObjectId('707f191e810c19729de860ed'),
    projectId: projects[0]._id,
    title: 'Responsive design',
    description: 'Ensure all pages are responsive',
    status: 'To Do',
    priority: 'High',
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-04-06')
  },
  {
    _id: ObjectId('707f191e810c19729de860ee'),
    projectId: projects[0]._id,
    title: 'Performance optimization',
    description: 'Optimize images and CSS',
    status: 'In Progress',
    priority: 'Medium',
    createdAt: new Date('2026-03-10'),
    updatedAt: new Date('2026-04-04')
  },

  // Tasks for Mobile App Development Project
  {
    _id: ObjectId('707f191e810c19729de860ef'),
    projectId: projects[1]._id,
    title: 'Setup React Native project',
    description: 'Initialize React Native with necessary dependencies',
    status: 'Done',
    priority: 'High',
    createdAt: new Date('2026-02-20'),
    updatedAt: new Date('2026-03-05')
  },
  {
    _id: ObjectId('707f191e810c19729de860f0'),
    projectId: projects[1]._id,
    title: 'Create authentication screens',
    description: 'Login, signup, and forgot password screens',
    status: 'In Progress',
    priority: 'High',
    createdAt: new Date('2026-03-05'),
    updatedAt: new Date('2026-04-06')
  },
  {
    _id: ObjectId('707f191e810c19729de860f1'),
    projectId: projects[1]._id,
    title: 'Implement API integration',
    description: 'Connect Reactnative app to backend API',
    status: 'To Do',
    priority: 'High',
    createdAt: new Date('2026-03-15'),
    updatedAt: new Date('2026-04-06')
  }
];

const tasksResult = db.tasks.insertMany(tasks);
console.log(`✅ Created ${tasksResult.insertedIds.length} tasks`);

// ============================================
// CREATE PROJECT MEMBERS
// ============================================
console.log('👫 Creating project members...');

const members = [
  // Members for Website Re-design Project
  {
    _id: ObjectId('807f191e810c19729de860ea'),
    projectId: projects[0]._id,
    userId: users[0]._id,
    userName: users[0].name,
    userEmail: users[0].email,
    role: 'owner',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01')
  },
  {
    _id: ObjectId('807f191e810c19729de860eb'),
    projectId: projects[0]._id,
    userId: users[1]._id,
    userName: users[1].name,
    userEmail: users[1].email,
    role: 'admin',
    createdAt: new Date('2026-02-20'),
    updatedAt: new Date('2026-02-20')
  },

  // Members for Mobile App Development Project
  {
    _id: ObjectId('807f191e810c19729de860ec'),
    projectId: projects[1]._id,
    userId: users[0]._id,
    userName: users[0].name,
    userEmail: users[0].email,
    role: 'owner',
    createdAt: new Date('2026-02-15'),
    updatedAt: new Date('2026-02-15')
  },
  {
    _id: ObjectId('807f191e810c19729de860ed'),
    projectId: projects[1]._id,
    userId: users[2]._id,
    userName: users[2].name,
    userEmail: users[2].email,
    role: 'member',
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-03-01')
  }
];

const membersResult = db.members.insertMany(members);
console.log(`✅ Created ${membersResult.insertedIds.length} project members`);

// ============================================
// CREATE MEMBER INVITATIONS
// ============================================
console.log('📧 Creating member invitations...');

const invitations = [
  {
    _id: ObjectId('907f191e810c19729de860ea'),
    projectId: projects[0]._id,
    email: 'user3@example.com',
    role: 'member',
    inviterName: users[0].name,
    projectName: projects[0].name,
    status: 'pending',
    createdAt: new Date('2026-04-04'),
    updatedAt: new Date('2026-04-04'),
    expiresAt: new Date('2026-05-04')
  },
  {
    _id: ObjectId('907f191e810c19729de860eb'),
    projectId: projects[1]._id,
    email: 'user3@example.com',
    role: 'admin',
    inviterName: users[0].name,
    projectName: projects[1].name,
    status: 'accepted',
    createdAt: new Date('2026-03-25'),
    updatedAt: new Date('2026-04-01'),
    expiresAt: new Date('2026-04-24')
  }
];

const invitationsResult = db.memberinvites.insertMany(invitations);
console.log(`✅ Created ${invitationsResult.insertedIds.length} member invitations`);

// ============================================
// CREATE INDEXES
// ============================================
console.log('🏗️ Creating indexes...');

// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

// Project indexes
db.projects.createIndex({ ownerId: 1 });
db.projects.createIndex({ status: 1 });
db.projects.createIndex({ createdAt: -1 });
db.projects.createIndex({ deletedAt: 1 });

// Task indexes
db.tasks.createIndex({ projectId: 1 });
db.tasks.createIndex({ status: 1 });
db.tasks.createIndex({ priority: 1 });
db.tasks.createIndex({ createdAt: -1 });

// Member indexes
db.members.createIndex({ projectId: 1, userId: 1 }, { unique: true });
db.members.createIndex({ projectId: 1 });
db.members.createIndex({ role: 1 });

// Invitation indexes
db.memberinvites.createIndex({ projectId: 1 });
db.memberinvites.createIndex({ email: 1 });
db.memberinvites.createIndex({ status: 1 });
db.memberinvites.createIndex({ expiresAt: 1 });

console.log('✅ Indexes created');

// ============================================
// SEED SUMMARY
// ============================================
console.log('\n' + '='.repeat(50));
console.log('🌱 DATABASE SEED COMPLETED SUCCESSFULLY!');
console.log('='.repeat(50));
console.log('\n📊 Seeded Data Summary:');
console.log(`   • Users: ${users.length}`);
console.log(`   • Projects: ${projects.length}`);
console.log(`   • Tasks: ${tasks.length}`);
console.log(`   • Project Members: ${members.length}`);
console.log(`   • Invitations: ${invitations.length}`);
console.log('\n🔐 Test Credentials:');
console.log('   Email: user1@example.com');
console.log('   Password: password123');
console.log('\n   Email: user2@example.com');
console.log('   Password: password123');
console.log('\n   Email: user3@example.com');
console.log('   Password: password123');
console.log('\n✨ Ready to start development!');
console.log('   Run: npm run start:dev (backend)');
console.log('   Run: npm run dev (frontend)');
console.log('\n' + '='.repeat(50) + '\n');
