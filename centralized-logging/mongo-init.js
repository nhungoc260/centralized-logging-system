// mongo-init.js - runs once when MongoDB container is first created
db = db.getSiblingDB('centralized-logging');

// Create indexes explicitly (also done via Mongoose, but good to have here)
db.logs.createIndex({ service: 1, level: 1 });
db.logs.createIndex({ timestamp: -1 });
db.logs.createIndex({ level: 1, timestamp: -1 });
db.logs.createIndex({ message: 'text' });
db.logs.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 604800 } // 7 days
);

print('MongoDB initialized: indexes created on centralized-logging.logs');
