import { Link } from 'react-router-dom';
import GlareHover from './GlareHover';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <a href="/" className="navbar__logo">
        <img src="/logo.svg" alt="" className="navbar__logo-icon" />
        <img src="/logo%20text.png" alt="BugVault" className="navbar__logo-text" />
      </a>
      <div className="navbar__links">
        <GlareHover
          width="auto"
          height="auto"
          background="rgba(255, 255, 255, 0.08)"
          borderRadius="20px"
          borderColor="rgba(255, 255, 255, 0.1)"
          glareColor="#ffffff"
          glareOpacity={0.2}
          glareAngle={-30}
          glareSize={200}
          transitionDuration={600}
          playOnce={false}
          className="navbar__cta-glare"
        >
          <Link to="/login" className="navbar__cta navbar__cta--login">Log in</Link>
        </GlareHover>
        <GlareHover
          width="auto"
          height="auto"
          background="rgba(124, 58, 237, 0.2)"
          borderRadius="20px"
          borderColor="rgba(124, 58, 237, 0.3)"
          glareColor="#ffffff"
          glareOpacity={0.2}
          glareAngle={-30}
          glareSize={200}
          transitionDuration={600}
          playOnce={false}
          className="navbar__cta-glare"
        >
          <Link to="/signup" className="navbar__cta navbar__cta--signup">Sign up</Link>
        </GlareHover>
      </div>
    </nav>
  );
}
