import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http';
import { initSocket } from './socket.js';
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import studentsRoutes from './routes/students.js';
import schoolsRoutes from './routes/schools.js';
import messagesRoutes from './routes/messages.js';
import complaintsRoutes from './routes/complaints.js';
import leaderboardRoutes from './routes/leaderboard.js';
import detectionRoutes from './routes/detection.js';
import feesRoutes from './routes/fees.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.use('/api/students', authMiddleware, studentsRoutes);
app.use('/api/schools', authMiddleware, schoolsRoutes);
app.use('/api/messages', authMiddleware, messagesRoutes);
app.use('/api/complaints', authMiddleware, complaintsRoutes);
app.use('/api/leaderboard', authMiddleware, leaderboardRoutes);
app.use('/api/detection', authMiddleware, detectionRoutes);
app.use('/api/fees', authMiddleware, feesRoutes);

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

import { MongoMemoryServer } from 'mongodb-memory-server';

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Primary MongoDB');
  } catch (err) {
    console.log('Primary MongoDB failed. Falling back to In-Memory DB...');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('Connected to In-Memory MongoDB');
    
    // Automatically seed the in-memory database
    const { exec } = await import('child_process');
    console.log('Seeding In-Memory DB...');
    
    // Need to temporarily set MONGO_URI so seed.js uses it
    process.env.MONGO_URI = uri;
    
    return new Promise((resolve) => {
      exec('node seed.js', (error, stdout, stderr) => {
        if (error) console.error('Seed error:', error);
        console.log('Seed completed automatically for memory DB.');
        resolve();
      });
    });
  }
}

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Fatal Database connection error:', err);
    process.exit(1);
  });
