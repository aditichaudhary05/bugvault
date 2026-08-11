import { useState } from 'react';
import SpotlightCard from './SpotlightCard';
import './SignupModal.css';

export default function SignupModal({ isOpen, onClose, onLoginClick }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Signup data:', formData);
    onClose();
  };

  return (
    <div className={`signup-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <SpotlightCard
        className="signup-modal"
        spotlightColor="rgba(124, 58, 237, 0.3)"
      >
        <button className="signup-modal__close" onClick={onClose}>
          &times;
        </button>
        <h2 className="signup-modal__title">Create account</h2>
        <form className="signup-modal__form" onSubmit={handleSubmit}>
          <div className="signup-modal__field">
            <label className="signup-modal__label" htmlFor="name">Name</label>
            <input
              className="signup-modal__input"
              type="text"
              id="name"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="signup-modal__field">
            <label className="signup-modal__label" htmlFor="email">Email</label>
            <input
              className="signup-modal__input"
              type="email"
              id="email"
              name="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="signup-modal__field">
            <label className="signup-modal__label" htmlFor="password">Password</label>
            <input
              className="signup-modal__input"
              type="password"
              id="password"
              name="password"
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="signup-modal__submit">
            Sign up
          </button>
        </form>
        <p className="signup-modal__footer">
          Already have an account? <a href="#login" onClick={(e) => { e.preventDefault(); onLoginClick(); }}>Log in</a>
        </p>
      </SpotlightCard>
    </div>
  );
}
