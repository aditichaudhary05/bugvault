import { useState, useEffect, useRef } from 'react';
import DarkVeil from '../components/DarkVeil';
import SpecularButton from '../components/SpecularButton';
import SpotlightCard from '../components/SpotlightCard';
import './Tags.css';

const API_URL = import.meta.env.VITE_API_URL;

function timeAgo(dateStr) {
  if (!dateStr) return '—';
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
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function Tags({ user, setUser }) {
  const [tags, setTags] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTagName, setEditTagName] = useState('');
  const [editNewName, setEditNewName] = useState('');
  const [editNewDesc, setEditNewDesc] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagDesc, setNewTagDesc] = useState('');
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const menuBtnRefs = useRef({});

  useEffect(() => {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    const root = document.getElementById('root');
    if (root) {
      root.style.overflow = 'auto';
      root.style.height = 'auto';
    }

    fetchTags();

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      if (root) {
        root.style.overflow = '';
        root.style.height = '';
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.tags__more-wrap')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTags = () => {
    fetch(`${API_URL}/api/tags`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTags(data.tags);
          setStats(data.stats);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!newTagName.trim()) {
      setCreateError('Tag name is required');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/bugs`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success && data.bugs.length > 0) {
        const bug = data.bugs[0];
        const existingTags = bug.tags || [];
        if (!existingTags.includes(newTagName.trim())) {
          await fetch(`${API_URL}/api/bugs/${bug.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ tags: [...existingTags, newTagName.trim()] }),
          });
        }
      }

      setShowCreateModal(false);
      setNewTagName('');
      setNewTagDesc('');
      fetchTags();
    } catch {
      setCreateError('Failed to create tag');
    }
  };

  const handleEditTag = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editNewName.trim()) {
      setEditError('Tag name is required');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/tags/${encodeURIComponent(editTagName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newName: editNewName.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setEditError(data.message);
        return;
      }
      setShowEditModal(false);
      setEditTagName('');
      setEditNewName('');
      setEditNewDesc('');
      fetchTags();
    } catch {
      setEditError('Failed to rename tag');
    }
  };

  const handleDeleteTag = async (tagName) => {
    if (!confirm(`Delete tag "${tagName}" from all bugs?`)) return;
    try {
      await fetch(`${API_URL}/api/tags/${encodeURIComponent(tagName)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchTags();
    } catch {
      console.error('Failed to delete tag');
    }
  };

  const openEditModal = (tag) => {
    setEditTagName(tag.name);
    setEditNewName(tag.name);
    setEditNewDesc(tag.description || '');
    setShowEditModal(true);
    setOpenMenuId(null);
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

  const getTagColor = (name) => tagColors[name.toLowerCase()] || '#7C3AED';

  if (loading) {
    return (
      <div className="app tags-page">
        <div className="bg"><DarkVeil /></div>
        <section className="tags">
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '120px' }}>Loading tags...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="app tags-page">
      <div className="bg"><DarkVeil /></div>
      <section className="tags">
        <div className="tags__header">
          <div className="tags__header-left">
            <h1 className="tags__title">All Tags</h1>
            <p className="tags__subtitle">Organize bugs with meaningful tags.</p>
          </div>
          <div className="tags__header-right">
            <div className="tags__search">
              <svg className="tags__search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                type="text"
                className="tags__search-input"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
            onClick={() => setShowCreateModal(true)}
          >
            + Create Tag
          </SpecularButton>
          </div>
        </div>

        <div className="tags__stats">
          <SpotlightCard className="tags__stat-card" spotlightColor="rgba(124, 58, 237, 0.2)">
            <div className="tags__stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
                <path d="M7 7h.01"/>
              </svg>
            </div>
            <div>
              <span className="tags__stat-number">{stats?.totalTags || 0}</span>
              <span className="tags__stat-label">Total Tags</span>
            </div>
          </SpotlightCard>

          <SpotlightCard className="tags__stat-card" spotlightColor="rgba(124, 58, 237, 0.2)">
            <div className="tags__stat-icon tags__stat-icon--blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <span className="tags__stat-number">{stats?.taggedBugs || 0}</span>
              <span className="tags__stat-label">Tagged Bugs</span>
            </div>
          </SpotlightCard>

          <SpotlightCard className="tags__stat-card" spotlightColor="rgba(124, 58, 237, 0.2)">
            <div className="tags__stat-icon tags__stat-icon--green">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
              </svg>
            </div>
            <div>
              <span className="tags__stat-number">{stats?.avgTags || '0.0'}</span>
              <span className="tags__stat-label">Avg. Tags per Bug</span>
            </div>
          </SpotlightCard>

          <SpotlightCard className="tags__stat-card" spotlightColor="rgba(124, 58, 237, 0.2)">
            <div className="tags__stat-icon tags__stat-icon--orange">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
              </svg>
            </div>
            <div>
              <span className="tags__stat-number">{stats?.changePercent > 0 ? `+${stats.changePercent}%` : '0%'}</span>
              <span className="tags__stat-label">vs last month</span>
            </div>
          </SpotlightCard>
        </div>

        <SpotlightCard className="tags__table-card" spotlightColor="rgba(124, 58, 237, 0.15)">
          <div className="tags__table-header">
            <span className="tags__th tags__th--tag">Tag</span>
            <span className="tags__th tags__th--bugs">Bugs</span>
            <span className="tags__th tags__th--desc">Description</span>
            <span className="tags__th tags__th--created">Created</span>
            <span className="tags__th tags__th--actions"></span>
          </div>

          <div className="tags__table-body">
            {tags.length === 0 && (
              <div className="tags__empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
                  <path d="M7 7h.01"/>
                </svg>
                Create tags to categorize and find bugs faster.
              </div>
            )}
            {tags.filter(tag => {
              if (!searchQuery.trim()) return true;
              const query = searchQuery.toLowerCase();
              return tag.name.toLowerCase().includes(query) || 
                     (tag.description && tag.description.toLowerCase().includes(query));
            }).map(tag => (
              <div key={tag.name} className="tags__row">
                <span className="tags__td tags__td--tag">
                  <span className="tags__tag-badge" style={{ '--tag-color': getTagColor(tag.name) }}>
                    <span className="tags__tag-dot" style={{ background: getTagColor(tag.name) }} />
                    {tag.name}
                  </span>
                </span>
                <span className="tags__td tags__td--bugs">{tag.bugCount}</span>
                <span className="tags__td tags__td--desc">{tag.description}</span>
                <span className="tags__td tags__td--created">{timeAgo(tag.createdAt)}</span>
                <span className="tags__td tags__td--actions">
                  <div className="tags__more-wrap">
                    <button className="tags__more-btn" onClick={() => setOpenMenuId(openMenuId === tag.name ? null : tag.name)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                      </svg>
                    </button>
                    {openMenuId === tag.name && (
                      <div className="tags__dropdown">
                        <button className="tags__dropdown-item" onClick={() => openEditModal(tag)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
                          </svg>
                          Edit
                        </button>
                        <button className="tags__dropdown-item tags__dropdown-item--danger" onClick={() => { setOpenMenuId(null); handleDeleteTag(tag.name); }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </span>
              </div>
            ))}
          </div>
        </SpotlightCard>

        {showCreateModal && (
          <div className="tags__modal-overlay" onClick={() => setShowCreateModal(false)}>
            <SpotlightCard className="tags__modal" spotlightColor="rgba(124, 58, 237, 0.2)" onClick={e => e.stopPropagation()}>
              <h3 className="tags__modal-title">Create Tag</h3>
              {createError && <p className="tags__modal-error">{createError}</p>}
              <form onSubmit={handleCreateTag}>
                <div className="tags__modal-field">
                  <label>Tag Name</label>
                  <input type="text" value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="e.g. authentication" />
                </div>
                <div className="tags__modal-field">
                  <label>Description (optional)</label>
                  <input type="text" value={newTagDesc} onChange={e => setNewTagDesc(e.target.value)} placeholder="What is this tag about?" />
                </div>
                <div className="tags__modal-actions">
                  <button type="button" className="tags__modal-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="tags__modal-submit">Create</button>
                </div>
              </form>
            </SpotlightCard>
          </div>
        )}

        {showEditModal && (
          <div className="tags__modal-overlay" onClick={() => setShowEditModal(false)}>
            <SpotlightCard className="tags__modal" spotlightColor="rgba(124, 58, 237, 0.2)" onClick={e => e.stopPropagation()}>
              <h3 className="tags__modal-title">Edit Tag</h3>
              {editError && <p className="tags__modal-error">{editError}</p>}
              <form onSubmit={handleEditTag}>
                <div className="tags__modal-field">
                  <label>Tag Name</label>
                  <input type="text" value={editNewName} onChange={e => setEditNewName(e.target.value)} placeholder="Tag name" />
                </div>
                <div className="tags__modal-field">
                  <label>Description</label>
                  <input type="text" value={editNewDesc} onChange={e => setEditNewDesc(e.target.value)} placeholder="Tag description" />
                </div>
                <div className="tags__modal-actions">
                  <button type="button" className="tags__modal-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="tags__modal-submit">Save</button>
                </div>
              </form>
            </SpotlightCard>
          </div>
        )}
      </section>
    </div>
  );
}
