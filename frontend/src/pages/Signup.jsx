import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DarkVeil from '../components/DarkVeil';
import SpotlightCard from '../components/SpotlightCard';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function Signup({ setUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        setLoading(false);
        return;
      }

      setUser(data.user);
      navigate('/home');
    } catch {
      setError('Server error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="bg">
        <DarkVeil />
      </div>
      <div className="auth-overlay">
        <SpotlightCard className="auth-modal" spotlightColor="rgba(124, 58, 237, 0.3)">
          <Link to="/" className="auth-modal__close">&times;</Link>
          <h2 className="auth-modal__title">Create account</h2>
          {error && <p className="auth-modal__error">{error}</p>}
          <form className="auth-modal__form" onSubmit={handleSubmit}>
            <div className="auth-modal__field">
              <label className="auth-modal__label" htmlFor="name">Name</label>
              <input className="auth-modal__input" type="text" id="name" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="auth-modal__field">
              <label className="auth-modal__label" htmlFor="email">Email</label>
              <input className="auth-modal__input" type="email" id="email" name="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="auth-modal__field">
              <label className="auth-modal__label" htmlFor="password">Password</label>
              <input className="auth-modal__input" type="password" id="password" name="password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" value={formData.password} onChange={handleChange} required minLength={6} />
            </div>
            <button type="submit" className="auth-modal__submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>
          <p className="auth-modal__footer">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </SpotlightCard>
      </div>
    </div>
  );
}
