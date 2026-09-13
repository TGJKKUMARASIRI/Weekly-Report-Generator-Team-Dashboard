import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Role } from './models/User.js';
import { Project } from './models/Project.js';

dotenv.config();

async function seed() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/weekly_report_db';
  await mongoose.connect(mongoUri);

  await User.deleteMany({});
  await Project.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const manager = await User.create({
    name: 'Manager Sarah',
    email: 'manager@example.com',
    passwordHash,
    role: Role.MANAGER,
  });

  const member1 = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    passwordHash,
    role: Role.TEAM_MEMBER,
  });

  const member2 = await User.create({
    name: 'Alice Smith',
    email: 'alice@example.com',
    passwordHash,
    role: Role.TEAM_MEMBER,
  });

  await Project.create([
    { name: 'Client Portal Redesign', description: 'Main enterprise client project' },
    { name: 'Internal Tooling', description: 'Developer productivity tools' },
    { name: 'Mobile App R&D', description: 'Next-gen iOS/Android framework evaluation' }
  ]);

  console.log('Database successfully seeded with Manager, 2 Team Members, and 3 Projects!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});