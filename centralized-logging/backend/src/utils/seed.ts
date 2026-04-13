/**
 * Seed script - creates default admin and developer users
 * Usage: npx ts-node src/utils/seed.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/User';

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/centralized-logging');

  // Create admin
  const adminExists = await User.findOne({ email: 'admin@example.com' });
  if (!adminExists) {
    await User.create({
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
    });
    console.log('✅ Admin user created: admin@example.com / admin123');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // Create developer
  const devExists = await User.findOne({ email: 'dev@example.com' });
  if (!devExists) {
    await User.create({
      email: 'dev@example.com',
      password: 'dev123',
      name: 'Developer User',
      role: 'developer',
    });
    console.log('✅ Dev user created: dev@example.com / dev123');
  } else {
    console.log('ℹ️  Dev user already exists');
  }

  await mongoose.disconnect();
  console.log('Done!');
};

seed().catch(console.error);
