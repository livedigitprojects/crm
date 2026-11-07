const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const User = require('./models/User');

const app = express();

const allowedOrigins = [
  'https://crm-frontend-psi-beige.vercel.app',
  'https://crm.livedigit.in',
  'http://localhost:5173',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : []),
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '1mb' }));

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

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;