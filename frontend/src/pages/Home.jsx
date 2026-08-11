import { Link, useNavigate } from 'react-router-dom';
import HomeNavbar from '../components/HomeNavbar';
import DarkVeil from '../components/DarkVeil';
import GlareHover from '../components/GlareHover';
import SpotlightCard from '../components/SpotlightCard';
import './Home.css';

export default function Home({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:7000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      navigate('/');
    } catch {
      console.error('Logout failed');
    }
  };

  return (
    <div className="app">
      <div className="bg">
        <DarkVeil />
      </div>
      <HomeNavbar user={user} onLogout={handleLogout} />
      <section className="home">
        <div className="home__layout">
          <div className="home__left">
            <div className="home__pill">Welcome to BugVault</div>
            <h1 className="home__title">
              <span>Your bugs.</span>
              <span className="home__title--accent">Organized.</span>
            </h1>
            <p className="home__subtitle">
              A personal space to track, store, and never forget how you solved it.
            </p>
            <div className="home__actions">
              <GlareHover
                width="auto"
                height="auto"
                background="rgba(255, 255, 255, 0.06)"
                borderRadius="14px"
                borderColor="rgba(255, 255, 255, 0.12)"
                glareColor="#ffffff"
                glareOpacity={0.2}
                glareAngle={-30}
                glareSize={200}
                transitionDuration={600}
                playOnce={false}
              >
                <Link to="/bugs" className="home__btn home__btn--secondary">
                  View Bugs
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}>
                    <path d="M5 12h14"/>
                    <path d="m12 5 7 7-7 7"/>
                  </svg>
                </Link>
              </GlareHover>
            </div>
          </div>
          <div className="home__right">
            <SpotlightCard className="home__quick-actions" spotlightColor="rgba(124, 58, 237, 0.3)">
              <h3 className="home__quick-title">Quick Actions</h3>
              <Link to="/bugs/new" className="home__quick-item">
                <div className="home__quick-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 2v6h6"/>
                    <path d="M12 18v-6"/>
                    <path d="M9 15h6"/>
                  </svg>
                </div>
                <div className="home__quick-info">
                  <span className="home__quick-name">Log a New Bug</span>
                  <span className="home__quick-desc">Document a bug and its fix</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="home__quick-arrow">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </Link>
              <Link to="/bugs" className="home__quick-item">
                <div className="home__quick-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.3-4.3"/>
                  </svg>
                </div>
                <div className="home__quick-info">
                  <span className="home__quick-name">Search Bugs</span>
                  <span className="home__quick-desc">Find bugs by keyword or tag</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="home__quick-arrow">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </Link>
              <Link to="/tags" className="home__quick-item">
                <div className="home__quick-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
                    <path d="M7 7h.01"/>
                  </svg>
                </div>
                <div className="home__quick-info">
                  <span className="home__quick-name">Browse Tags</span>
                  <span className="home__quick-desc">Explore your bug categories</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="home__quick-arrow">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </Link>
            </SpotlightCard>
          </div>
        </div>
        <div className="home__stats">
          <div className="home__stat">
            <div className="home__stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m8 2 1.88 1.88"/>
                <path d="M14.12 3.88 16 2"/>
                <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>
                <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/>
                <path d="M12 20v-9"/>
                <path d="M6.53 9C4.6 8.8 3 7.1 3 5"/>
                <path d="M6 13H2"/>
                <path d="M3 21c0-2.1 1.7-3.9 3.8-4"/>
                <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/>
                <path d="M22 13h-4"/>
                <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>
              </svg>
            </div>
            <div className="home__stat-info">
              <span className="home__stat-number">24</span>
              <span className="home__stat-label">Bugs Logged</span>
            </div>
          </div>
          <div className="home__stat">
            <div className="home__stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <path d="m9 11 3 3L22 4"/>
              </svg>
            </div>
            <div className="home__stat-info">
              <span className="home__stat-number">17</span>
              <span className="home__stat-label">Resolved</span>
            </div>
          </div>
          <div className="home__stat">
            <div className="home__stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
                <path d="M7 7h.01"/>
              </svg>
            </div>
            <div className="home__stat-info">
              <span className="home__stat-number">8</span>
              <span className="home__stat-label">Tags</span>
            </div>
          </div>
          <div className="home__stat">
            <div className="home__stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"/>
                <path d="m19 9-5 5-4-4-3 3"/>
              </svg>
            </div>
            <div className="home__stat-info">
              <span className="home__stat-number">6</span>
              <span className="home__stat-label">This Month</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
