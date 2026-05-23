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

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
