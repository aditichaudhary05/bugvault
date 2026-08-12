import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DarkVeil from '../components/DarkVeil';
import SpotlightCard from '../components/SpotlightCard';
import './Profile.css';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatJoinDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `Joined ${d.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
}

const statusColors = {
  Open: { bg: 'rgba(124, 58, 237, 0.15)', border: 'rgba(124, 58, 237, 0.3)', text: '#c4b5fd', dot: '#7C3AED' },
  'In Progress': { bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)', text: '#fde047', dot: '#eab308' },
  Resolved: { bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)', text: '#86efac', dot: '#22c55e' },
  Closed: { bg: 'rgba(107, 114, 128, 0.12)', border: 'rgba(107, 114, 128, 0.3)', text: '#9ca3af', dot: '#6b7280' },
};

const tagColors = {
  frontend: '#7C3AED',
  backend: '#3b82f6',
  database: '#22c55e',
  ui: '#f59e0b',
  api: '#ef4444',
  authentication: '#10b981',
  performance: '#8b5cf6',
  security: '#f97316',
};

const contextIcons = {
  frontend: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/>
    </svg>
  ),
  backend: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>
    </svg>
  ),
  mobile: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>
    </svg>
  ),
};

function getTagColor(name) {
  return tagColors[name.toLowerCase()] || '#7C3AED';
}

const API = 'http://localhost:7000';

function resolveImg(src) {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  return API + src;
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editPreview, setEditPreview] = useState('');
  const [editFile, setEditFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    const root = document.getElementById('root');
    if (root) {
      root.style.overflow = 'auto';
      root.style.height = 'auto';
    }

    fetchProfile();

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      if (root) {
        root.style.overflow = '';
        root.style.height = '';
      }
    };
  }, []);

  const fetchProfile = () => {
    fetch('http://localhost:7000/api/profile', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setProfile(data.profile);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:7000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}
    window.location.href = '/';
  };

  const openEditModal = () => {
    if (profile) {
      setEditName(profile.user.name);
      setEditDescription(profile.user.description || '');
      setEditPreview('');
      setEditFile(null);
    }
    setEditError('');
    setShowEditModal(true);
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      setEditError('Only image files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEditError('Image must be under 5MB');
      return;
    }

    setEditFile(file);
    setEditError('');

    const reader = new FileReader();
    reader.onload = (ev) => setEditPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeProfilePic = () => {
    setEditFile(null);
    setEditPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditError('');
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', editName);
      formData.append('description', editDescription);
      if (editFile) {
        formData.append('profilePicture', editFile);
      }

      const res = await fetch('http://localhost:7000/api/profile', {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) {
        setEditError(data.message);
        setSaving(false);
        return;
      }
      setProfile({
        ...profile,
        user: { ...profile.user, ...data.user },
      });
      setShowEditModal(false);
    } catch {
      setEditError('Failed to update profile');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="app profile-page">
        <div className="bg"><DarkVeil /></div>
        <section className="profile">
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '120px' }}>Loading profile...</p>
        </section>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="app profile-page">
        <div className="bg"><DarkVeil /></div>
        <section className="profile">
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '120px' }}>Failed to load profile.</p>
        </section>
      </div>
    );
  }

  const { user, stats, recentBugs, topTags, streak } = profile;
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const currentAvatar = editPreview || resolveImg(user.profilePicture) || null;

  return (
    <div className="app profile-page">
      <div className="bg"><DarkVeil /></div>
      <section className="profile">
        <div className="profile__content">
          <SpotlightCard className="profile__card profile__hero" spotlightColor="rgba(124, 58, 237, 0.25)">
            <div className="profile__hero-left">
              <div className="profile__avatar">
                {user.profilePicture ? (
                  <img src={resolveImg(user.profilePicture)} alt={user.name} className="profile__avatar-img" />
                ) : (
                  <span className="profile__avatar-text">{initials}</span>
                )}
              </div>
              <div className="profile__user-info">
                <h1 className="profile__name">{user.name}</h1>
                <p className="profile__bio">{user.description || <span className="profile__bio-placeholder">Write bio...</span>}</p>
                <div className="profile__meta">
                  <span className="profile__meta-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    {user.email}
                  </span>
                  <span className="profile__meta-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                    </svg>
                    {formatJoinDate(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="profile__hero-right">
              <div className="profile__hero-actions">
                <button className="profile__edit-btn" onClick={openEditModal}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
                  </svg>
                  Edit
                </button>
                <button className="profile__logout-btn" onClick={handleLogout}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
                  </svg>
                  Logout
                </button>
              </div>
              <div className="profile__hero-stats">
                <div className="profile__hero-stat">
                  <div className="profile__hero-stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>
                      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/>
                    </svg>
                  </div>
                  <span className="profile__hero-stat-number">{stats.totalBugs}</span>
                  <span className="profile__hero-stat-label">Bugs Logged</span>
                </div>
                <div className="profile__hero-stat">
                  <div className="profile__hero-stat-icon profile__hero-stat-icon--green">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
                    </svg>
                  </div>
                  <span className="profile__hero-stat-number">{stats.resolvedBugs}</span>
                  <span className="profile__hero-stat-label">Resolved</span>
                </div>
                <div className="profile__hero-stat">
                  <div className="profile__hero-stat-icon profile__hero-stat-icon--purple">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>
                    </svg>
                  </div>
                  <span className="profile__hero-stat-number">{stats.totalTags}</span>
                  <span className="profile__hero-stat-label">Tags</span>
                </div>
              </div>
            </div>
          </SpotlightCard>

          <div className="profile__grid">
            <SpotlightCard className="profile__card profile__recent" spotlightColor="rgba(124, 58, 237, 0.15)">
              <div className="profile__section-header">
                <div>
                  <h2 className="profile__section-title">Recent discoveries</h2>
                  <p className="profile__section-subtitle">Your latest bugs</p>
                </div>
                <Link to="/bugs" className="profile__view-all">View all <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></Link>
              </div>
              <div className="profile__bug-list">
                {recentBugs.length === 0 && <p className="profile__empty">No bugs yet</p>}
                {recentBugs.map(bug => {
                  const status = bug.status || 'Open';
                  const colors = statusColors[status] || statusColors.Open;
                  const icon = contextIcons[bug.context] || contextIcons.frontend;
                  return (
                    <Link to={`/bugs/${bug.id}`} key={bug.id} className="profile__bug-item">
                      <div className="profile__bug-icon">{icon}</div>
                      <div className="profile__bug-info">
                        <span className="profile__bug-title">{bug.title}</span>
                        <span className="profile__bug-desc">{bug.description || 'No description'}</span>
                      </div>
                      <div className="profile__bug-right">
                        <span className="profile__bug-status" style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}>
                          <span className="profile__bug-status-dot" style={{ background: colors.dot }} />
                          {status}
                        </span>
                        <span className="profile__bug-time">{timeAgo(bug.created_at)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </SpotlightCard>

            <div className="profile__right-col">
              <SpotlightCard className="profile__card profile__tags-card" spotlightColor="rgba(124, 58, 237, 0.15)">
                <div className="profile__section-header">
                  <h2 className="profile__section-title">Most used tags</h2>
                  <Link to="/tags" className="profile__view-all">View all <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></Link>
                </div>
                <div className="profile__tags-grid">
                  {topTags.length === 0 && <p className="profile__empty">No tags yet</p>}
                  {topTags.map(tag => (
                    <div key={tag.name} className="profile__tag-chip">
                      <span className="profile__tag-dot" style={{ background: getTagColor(tag.name) }} />
                      <span className="profile__tag-name">{tag.name}</span>
                      <span className="profile__tag-count">{tag.count}</span>
                    </div>
                  ))}
                </div>
              </SpotlightCard>

              <SpotlightCard className="profile__card profile__streak-card" spotlightColor="rgba(124, 58, 237, 0.15)">
                <h2 className="profile__section-title">Debugging streak</h2>
                <p className="profile__section-subtitle">Keep going, you're doing great!</p>
                <div className="profile__streak-display">
                  <div className="profile__streak-circle">
                    <span className="profile__streak-number">{streak.days}</span>
                    <span className="profile__streak-label">days</span>
                  </div>
                </div>
                <div className="profile__streak-week">
                  {streak.week.map((day, i) => (
                    <div key={i} className="profile__streak-day">
                      <span className="profile__streak-day-label">{day.day}</span>
                      <div className={`profile__streak-day-dot ${day.active ? 'profile__streak-day-dot--active' : ''}`}>
                        {day.active && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </SpotlightCard>
            </div>
          </div>
        </div>

        {showEditModal && (
          <div className="profile__modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="profile__modal" onClick={e => e.stopPropagation()}>
              <h3 className="profile__modal-title">Edit Profile</h3>
              {editError && <p className="profile__modal-error">{editError}</p>}
              <form onSubmit={handleSaveProfile}>
                <div className="profile__modal-pic-section">
                  <div className="profile__modal-pic-preview">
                    {currentAvatar ? (
                      <img src={currentAvatar} alt="Preview" className="profile__modal-pic-img" />
                    ) : (
                      <span className="profile__modal-pic-initials">{editName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}</span>
                    )}
                  </div>
                  <div className="profile__modal-pic-actions">
                    <button type="button" className="profile__modal-pic-btn" onClick={() => fileInputRef.current?.click()}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                      </svg>
                      Upload image
                    </button>
                    {currentAvatar && (
                      <button type="button" className="profile__modal-pic-remove" onClick={removeProfilePic}>Remove</button>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleProfilePicChange} style={{ display: 'none' }} />
                  </div>
                </div>

                <div className="profile__modal-field">
                  <label>Name</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="profile__modal-field">
                  <label>Bio</label>
                  <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Write something about yourself..." rows={3} />
                </div>
                <div className="profile__modal-actions">
                  <button type="button" className="profile__modal-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="profile__modal-submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
