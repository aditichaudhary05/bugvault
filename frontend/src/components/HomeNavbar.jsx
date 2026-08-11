import { Link, useNavigate } from 'react-router-dom';
import GooeyNav from './GooeyNav';
import SpecularButton from './SpecularButton';
import './HomeNavbar.css';

export default function HomeNavbar({ user, onLogout }) {
  const navigate = useNavigate();

  const navItems = [
    { label: 'Home', href: '#', onNavigate: () => navigate('/home') },
    { label: 'Bugs', href: '#', onNavigate: () => navigate('/bugs') },
    { label: 'Tags', href: '#', onNavigate: () => navigate('/tags') },
    { label: 'Stats', href: '#', onNavigate: () => navigate('/stats') },
  ];

  return (
    <nav className="home-navbar">
      <a href="/home" className="home-navbar__logo">
        <img src="/logo.svg" alt="" className="home-navbar__logo-icon" />
        <span className="home-navbar__logo-text">BugVault</span>
      </a>
      <div className="home-navbar__navlinks">
        <GooeyNav
          items={navItems}
          initialActiveIndex={0}
          animationTime={600}
          particleCount={12}
          particleDistances={[80, 10]}
          particleR={100}
          timeVariance={200}
          colors={[1, 2, 3, 1, 2, 3, 1, 4]}
        />
      </div>
      <div className="home-navbar__right">
        <Link to="/bugs/new">
          <SpecularButton
            size="sm"
            radius={20}
            tint="#7C3AED"
            tintOpacity={0.3}
            textColor="#ffffff"
            lineColor="#ffffff"
            baseColor="#5227FF"
            intensity={1}
            shineSize={10}
            shineFade={40}
            thickness={1}
            followMouse={true}
            proximity={250}
            className="home-navbar__new-bug"
          >
            + New Bug
          </SpecularButton>
        </Link>
        <div className="home-navbar__avatar" onClick={onLogout} title={user?.name || 'Logout'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      </div>
    </nav>
  );
}
