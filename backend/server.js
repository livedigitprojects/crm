const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const User = require('./models/User');

const app = express();

const allowedOrigins = [
  'https://crm-frontend-2869.onrender.com',
  'https://crm.livedigit.in',
  'http://localhost:5173',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : []),
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:'))) return cb(null, true);
      return cb(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '1mb' }));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Native Gzip HTTP response compression for bandwidth reduction
const zlib = require('zlib');
app.use((req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding.includes('gzip')) {
    return next();
  }

  const originalSend = res.send;
  res.send = function (body) {
    if ((typeof body === 'string' || Buffer.isBuffer(body)) && body.length > 1024) {
      const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
      return zlib.gzip(buf, (err, compressed) => {
        if (err || !compressed) {
          return originalSend.call(this, body);
        }
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Length', compressed.length);
        return originalSend.call(this, compressed);
      });
    }
    return originalSend.call(this, body);
  };
  next();
});

// Lightweight in-memory rate limiter for authentication routes
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 30;

const loginRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record) {
    if (now - record.startTime < LOGIN_WINDOW_MS) {
      if (record.count >= MAX_LOGIN_ATTEMPTS) {
        return res.status(429).json({ message: 'Too many login attempts. Please try again after 15 minutes.' });
      }
      record.count++;
    } else {
      loginAttempts.set(ip, { count: 1, startTime: now });
    }
  } else {
    loginAttempts.set(ip, { count: 1, startTime: now });
  }

  if (loginAttempts.size > 1000) {
    for (const [k, v] of loginAttempts.entries()) {
      if (now - v.startTime >= LOGIN_WINDOW_MS) loginAttempts.delete(k);
    }
  }
  next();
};

app.get('/', (req, res) => {
  res.send('Aetheria CRM API is running...');
});

let seeded = false;
const seedDatabase = async () => {
  if (seeded) return;
  seeded = true;
  try {
    const userCount = await User.estimatedDocumentCount();
    if (userCount === 0) {
      console.log('No users found in database. Initializing default roster...');

      await User.create({
        name: 'CRM Administrator',
        username: 'admin@livedigit.in',
        password: 'Livedigit.admin@2026',
        role: 'admin'
      });

      const defaultSalespeople = [
        { name: 'Tharun', username: 'tharun' },
        { name: 'Sarah', username: 'sarah' },
        { name: 'John', username: 'john' },
        { name: 'Emily', username: 'emily' }
      ];

      for (const rep of defaultSalespeople) {
        await User.create({
          name: rep.name,
          username: rep.username,
          password: 'sales123',
          role: 'salesperson'
        });
      }
      console.log('Seeded default admin and salesperson accounts');
    }
  } catch (error) {
    seeded = false;
    console.error('Seeding error:', error.message);
  }
};

app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    seedDatabase();
    next();
  } catch (error) {
    console.error('Database connection error:', error.message);
    res.status(503).json({ message: 'Database unavailable' });
  }
});

app.use('/api/auth/login', loginRateLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/daily-reports', require('./routes/dailyReports'));
app.use('/api/config', require('./routes/config'));
app.use('/api/notifications', require('./routes/notifications'));

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

if (!process.env.VERCEL && require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;