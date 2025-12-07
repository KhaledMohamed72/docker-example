const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');

const app = express();

// Middleware
app.use(express.json());

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://root:example@mongo:27017/admin';

const connectMongo = (retries = 15, delay = 3000) => {
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('✓ Connected to MongoDB successfully');
    })
    .catch((err) => {
      if (retries > 0) {
        console.warn(`⚠ MongoDB unavailable. Retrying in ${delay}ms... (${retries} attempts left)`);
        setTimeout(() => connectMongo(retries - 1, Math.min(delay * 1.5, 10000)), delay);
      } else {
        console.error('✗ MongoDB connection failed:', err.message);
      }
    });
};

connectMongo();

// Redis Connection
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
  },
});

redisClient.on('connect', () => {
  console.log('✓ Connected to Redis successfully');
});

redisClient.on('error', (err) => {
  console.error('✗ Redis connection error:', err.message);
});

redisClient.connect().catch((err) => {
  console.error('✗ Failed to connect to Redis:', err.message);
});

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to Dockerhub, new change 111111111111!');
});

app.get('/api/status', (req, res) => {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const redisStatus = redisClient.isOpen ? 'connected' : 'disconnected';
    res.json({
        app: 'Express Server',
        mongodb: mongoStatus,
        redis: redisStatus,
        port: PORT
    });
});

app.get('/health', (req, res) => {
    const mongoStatus = mongoose.connection.readyState === 1;
    const redisStatus = redisClient.isOpen;
    const isHealthy = mongoStatus && redisStatus;
    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'degraded',
        mongodb: mongoStatus ? 'connected' : 'disconnected',
        redis: redisStatus ? 'connected' : 'disconnected'
    });
});

// Start server
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
