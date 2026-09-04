const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');
const User = require('../models/User');

let mongod = null;

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);

    // If running in Vercel serverless environment without a remote MongoDB URI configured
    if (process.env.VERCEL && (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost'))) {
      logger.warn('Running on Vercel without remote MONGODB_URI configured. Set MONGODB_URI in Vercel settings to enable database operations.');
      return;
    }

    // Try connecting to configured MongoDB URI first with a short timeout
    await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500
    });
    logger.info(`Connected to MongoDB at ${config.MONGODB_URI}`);
  } catch (err) {
    logger.warn(`Could not connect to external MongoDB at ${config.MONGODB_URI}: ${err.message}`);
    
    if (process.env.VERCEL) {
      logger.warn('Skipping embedded MongoDB on Vercel serverless runtime.');
      return;
    }

    logger.info('Starting embedded in-memory MongoDB engine for zero-config development...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      logger.info(`Connected to embedded MongoDB at ${uri}`);
    } catch (memErr) {
      logger.error('Failed to initialize embedded MongoDB:', memErr.message);
      throw memErr;
    }
  }

  // Seed default admin and test user if database is empty
  await seedInitialUsers();
};

const seedInitialUsers = async () => {
  try {
    const adminEmail = 'admin@securefile.local';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: 'Admin@12345',
        role: 'admin',
        storageLimit: 10737418240 // 10 GB
      });
      logger.info(`Seeded default admin user: ${adminEmail} / Admin@12345`);
    }

    const testUserEmail = 'user@securefile.local';
    const existingUser = await User.findOne({ email: testUserEmail });

    if (!existingUser) {
      await User.create({
        name: 'Demo User',
        email: testUserEmail,
        password: 'User@12345',
        role: 'user',
        storageLimit: 5368709120 // 5 GB
      });
      logger.info(`Seeded default demo user: ${testUserEmail} / User@12345`);
    }
  } catch (seedErr) {
    logger.warn(`User seeding note: ${seedErr.message}`);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
