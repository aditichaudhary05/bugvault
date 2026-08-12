import passport from 'passport';
import { Strategy } from 'passport-local';
import bcrypt from 'bcrypt';
import pool from './db.js';

passport.use(
  new Strategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const result = await pool.query('SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return done(null, false);
    }
    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});

export default passport;
