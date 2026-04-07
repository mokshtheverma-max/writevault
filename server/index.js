require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { initialize } = require('./db/database');
const { generalLimiter } = require('./middleware/rateLimiter');
const sessionRoutes = require('./routes/sessions');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const analyticsRoutes = require('./routes/analytics');
const coachRoutes = require('./routes/coach');
const referralRoutes = require('./routes/referrals');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = [
  'http://localhost:5173',
  'https://writevault.vercel.app',
  'https://writevault.app',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Stripe webhook needs raw body — mount BEFORE json parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Body parsing — sessions can be large
app.use(express.json({ limit: '10mb' }));

// General rate limiter
app.use(generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Math.floor(Date.now() / 1000) });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes);  // for /api/waitlist
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/sessions', sessionRoutes);

// /api/verify is mounted on the sessions router but accessible at /api/verify
app.use('/api', sessionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`WriteVault Backend ready on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
