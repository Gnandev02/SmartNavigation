import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.get('/', (req, res) => {
  res.send('SmartNav Backend API');
});

// Basic SOS route
app.post('/api/sos', async (req, res) => {
  const { userId, latitude, longitude } = req.body;
  try {
    const alert = await prisma.sOSAlert.create({
      data: {
        userId,
        latitude,
        longitude
      }
    });
    // Broadcast SOS alert to connected caregivers
    io.emit('sos_triggered', alert);
    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger SOS' });
  }
});

// Location update route
app.post('/api/location', async (req, res) => {
  const { userId, latitude, longitude } = req.body;
  try {
    const location = await prisma.locationHistory.create({
      data: {
        userId,
        latitude,
        longitude
      }
    });
    // Broadcast location to specific user room or globally
    io.emit('location_update', { userId, latitude, longitude });
    res.json({ success: true, location });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save location' });
  }
});

// Auth login route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    let user = await prisma.user.findUnique({ where: { email } });
    
    // For demo purposes, auto-register if user doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: password, // In a real app, hash this with bcrypt!
          role: email.includes('admin') ? 'ADMIN' : 'CAREGIVER'
        }
      });
    }

    // Verify password
    if (user.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ success: true, token: 'mock-jwt-token-123', user });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
