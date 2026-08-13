import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import GooeyNav from './GooeyNav';
import SpecularButton from './SpecularButton';
import './HomeNavbar.css';

const API = import.meta.env.VITE_API_URL;

function resolveImg(src) {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  return API + src;
}

export default function HomeNavbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profilePicture, setProfilePicture] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const isProfileActive = location.pathname.startsWith('/profile');

  useEffect(() => {
    fetch(`${API}/api/profile`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profile?.user?.profilePicture) {
          setProfilePicture(data.profile.user.profilePicture);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Home', href: '#', onNavigate: () => navigate('/home') },
    { label: 'Bugs', href: '#', onNavigate: () => navigate('/bugs') },
    { label: 'Tags', href: '#', onNavigate: () => navigate('/tags') },
    { label: 'Stats', href: '#', onNavigate: () => navigate('/stats') },
  ];

  const getActiveIndex = () => {
    if (isProfileActive) return -1;
    const path = location.pathname;
    if (path.startsWith('/bugs')) return 1;
    if (path.startsWith('/tags')) return 2;
    if (path.startsWith('/stats')) return 3;
    return 0;
  };

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <nav className="home-navbar">
      <Link to="/home" className="home-navbar__logo">
        <img src="/logo.svg" alt="" className="home-navbar__logo-icon" />
        <img src="/logo%20text.png" alt="BugVault" className="home-navbar__logo-text" />
      </Link>
      <div className="home-navbar__navlinks">
        <GooeyNav
          items={navItems}
          initialActiveIndex={getActiveIndex()}
          animationTime={600}
          particleCount={12}
          particleDistances={[80, 10]}
          particleR={100}
          timeVariance={200}
          colors={[1, 2, 3, 1, 2, 3, 1, 4]}
        />
      </div>
      <div className="home-navbar__right">
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
          onClick={() => navigate('/bugs/new')}
        >
          + New Bug
        </SpecularButton>
        <button className={`home-navbar__hamburger ${menuOpen ? 'home-navbar__hamburger--open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span />
          <span />
          <span />
        </button>
        <Link to="/profile" className={`home-navbar__avatar ${isProfileActive ? 'home-navbar__avatar--active' : ''}`} title={user?.name || 'Profile'}>
          {profilePicture ? (
            <img src={resolveImg(profilePicture)} alt="" className="home-navbar__avatar-img" />
          ) : (
            <span className="home-navbar__avatar-initials">{initials}</span>
          )}
        </Link>
      </div>
      {menuOpen && (
        <div className="home-navbar__mobile-menu">
          {navItems.map((item, i) => (
            <button key={i} className={`home-navbar__mobile-item ${getActiveIndex() === i ? 'home-navbar__mobile-item--active' : ''}`} onClick={() => { item.onNavigate(); setMenuOpen(false); }}>
              {item.label}
            </button>
          ))}
          <button className="home-navbar__mobile-item" onClick={() => { navigate('/bugs/new'); setMenuOpen(false); }}>+ New Bug</button>
        </div>
      )}
    </nav>
  );
}
