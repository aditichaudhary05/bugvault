import { useState } from 'react';
import SpotlightCard from './SpotlightCard';
import './LoginModal.css';

export default function LoginModal({ isOpen, onClose, onSignupClick }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login data:', formData);
    onClose();
  };

  return (
    <div className={`login-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <SpotlightCard
        className="login-modal"
        spotlightColor="rgba(124, 58, 237, 0.3)"
      >
        <button className="login-modal__close" onClick={onClose}>
          &times;
        </button>
        <h2 className="login-modal__title">Welcome back</h2>
        <form className="login-modal__form" onSubmit={handleSubmit}>
          <div className="login-modal__field">
            <label className="login-modal__label" htmlFor="email">Email</label>
            <input
              className="login-modal__input"
              type="email"
              id="email"
              name="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="login-modal__field">
            <label className="login-modal__label" htmlFor="password">Password</label>
            <input
              className="login-modal__input"
              type="password"
              id="password"
              name="password"
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="login-modal__submit">
            Log in
          </button>
        </form>
        <p className="login-modal__footer">
          Don't have an account? <a href="#signup" onClick={(e) => { e.preventDefault(); onClose(); onSignupClick(); }}>Sign up</a>
        </p>
      </SpotlightCard>
    </div>
  );
}
