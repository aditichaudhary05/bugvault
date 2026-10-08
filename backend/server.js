import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import passport from './passport.js';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import bugRoutes from './routes/bugs.js';
import statsRoutes from './routes/stats.js';
import tagsRoutes from './routes/tags.js';
import profileRoutes from './routes/profile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7000;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(helmet());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '100kb' }));

const PgSession = connectPgSimple(session);

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

if (isProduction) {
  sessionConfig.store = new PgSession({
    pool,
    tableName: 'user_sessions',
  });
}

app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/bugs', apiLimiter, bugRoutes);
app.use('/api/stats', apiLimiter, statsRoutes);
app.use('/api/tags', apiLimiter, tagsRoutes);
app.use('/api/profile', apiLimiter, profileRoutes);

import { requireAuth } from './middleware/auth.js';
app.use('/uploads', requireAuth, express.static(join(__dirname, 'uploads')));

async function initDB() {
  try {
    if (isProduction) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          sid VARCHAR NOT NULL COLLATE "default",
          sess JSON NOT NULL,
          expire TIMESTAMP(6) NOT NULL,
          PRIMARY KEY (sid)
        )
      `);
      await pool.query('CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON user_sessions (expire)');
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bugs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        context VARCHAR(255),
        severity VARCHAR(50) DEFAULT 'Medium',
        description TEXT,
        reproduction_steps TEXT,
        expected_behavior TEXT,
        actual_behavior TEXT,
        root_cause TEXT,
        tags JSONB DEFAULT '[]',
        solution TEXT,
        code_snippet TEXT,
        language VARCHAR(50) DEFAULT 'JavaScript',
        status VARCHAR(50) DEFAULT 'Open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database tables initialized');

    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE bugs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Open';
      EXCEPTION WHEN duplicate_column THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
      EXCEPTION WHEN duplicate_column THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT DEFAULT '';
      EXCEPTION WHEN duplicate_column THEN null;
      END $$;
    `);
  } catch (err) {
    console.error('Database initialization error:', err.message);
    process.exit(1);
  }
}

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`BugVault API running on http://localhost:${PORT}`);
  });
});
