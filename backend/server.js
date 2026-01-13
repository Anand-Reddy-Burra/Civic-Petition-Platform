import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import pollRoutes from './routes/polls.js';
import petitionRoutes from './routes/petitions.js';
import reportRoutes from './routes/reports.js';

const app = express();

// CORS configuration - More permissive for development (must be before any routes/limiters)
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:3000',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:3000',
      config.FRONTEND_URL
    ];
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));
// Ensure preflight requests are handled
app.options('*', cors(corsOptions));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Stricter rate limiting for auth routes (relaxed in development)
const isDev = (config.NODE_ENV || 'development') !== 'production';
const authLimiter = rateLimit({
  windowMs: isDev ? 60 * 1000 : 15 * 60 * 1000, // 1 min (dev) vs 15 min (prod)
  max: isDev ? 100 : 5, // allow more attempts in dev
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/', authLimiter);

// Debug middleware to log CORS requests
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser middleware
app.use(cookieParser());

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');

    // Run one-time migration for embedded poll feedback -> pollfeedbacks collection
    migrateEmbeddedPollFeedback().catch((err) =>
      console.error('❌ Error during poll feedback migration:', err.message)
    );

    // Start scheduled jobs after DB connection
    startScheduledJobs();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// One-time helper to migrate any embedded poll.feedback into pollfeedbacks collection
const migrateEmbeddedPollFeedback = async () => {
  try {
    const Poll = (await import('./models/Poll.js')).default;
    const PollFeedback = (await import('./models/PollFeedback.js')).default;

    const pollsWithFeedback = await Poll.find({
      feedback: { $exists: true, $ne: [] },
    }).select('_id feedback');

    if (!pollsWithFeedback.length) {
      return;
    }

    let migratedCount = 0;

    for (const poll of pollsWithFeedback) {
      for (const fb of poll.feedback) {
        if (!fb.user || !fb.reason) continue;

        const existing = await PollFeedback.findOne({
          poll: poll._id,
          user: fb.user,
        });
        if (existing) continue;

        await PollFeedback.create({
          poll: poll._id,
          user: fb.user,
          reason: fb.reason,
          improvements: fb.improvements,
          concerns: fb.concerns,
          rating: fb.rating || 4,
          selectedOptionText: fb.selectedOptionText,
          createdAt: fb.createdAt || new Date(),
        });
        migratedCount += 1;
      }
    }

    if (migratedCount > 0) {
      console.log(`✅ Migrated ${migratedCount} embedded poll feedback entrie(s)`);
    }
  } catch (error) {
    console.error('❌ Migration error (poll feedback):', error.message);
  }
};

// Scheduled job to clean up expired petitions and polls
const cleanupExpiredContent = async () => {
  try {
    const Petition = (await import('./models/Petition.js')).default;
    const Poll = (await import('./models/Poll.js')).default;
    const now = new Date();

    // Delete petitions whose closing date has passed
    const deletePetitionsResult = await Petition.deleteMany({
      closesOn: { $lte: now }
    });

    if (deletePetitionsResult.deletedCount > 0) {
      console.log(
        `✅ Auto-deleted ${deletePetitionsResult.deletedCount} expired petition(s)`
      );
    }

    // Delete polls whose closing date has passed
    const deletePollsResult = await Poll.deleteMany({
      closesOn: { $lte: now }
    });

    if (deletePollsResult.deletedCount > 0) {
      console.log(
        `✅ Auto-deleted ${deletePollsResult.deletedCount} expired poll(s)`
      );
    }
  } catch (error) {
    console.error('❌ Error cleaning up expired content:', error.message);
  }
};

// Start scheduled jobs
const startScheduledJobs = () => {
  // Run immediately on startup, then every hour
  cleanupExpiredContent();
  setInterval(cleanupExpiredContent, 60 * 60 * 1000); // Every hour
  console.log('✅ Scheduled jobs started (auto-delete expired petitions and polls)');
};

// Connect to database
connectDB();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/petitions', petitionRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

const PORT = config.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
  console.log(`📡 API URL: http://localhost:${PORT}/api`);
});

export default app;
