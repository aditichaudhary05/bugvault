import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HomeNavbar from '../components/HomeNavbar';
import DarkVeil from '../components/DarkVeil';
import SpotlightCard from '../components/SpotlightCard';
import './Bugs.css';

function getBugStatus(bug) {
  if (bug.solution) return 'Resolved';
  if (bug.root_cause) return 'In Progress';
  return 'Open';
}

function timeAgo(dateStr) {
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
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const statusColors = {
  Open: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', text: '#fca5a5', dot: '#ef4444' },
  'In Progress': { bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)', text: '#fde047', dot: '#eab308' },
  Resolved: { bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)', text: '#86efac', dot: '#22c55e' },
  Closed: { bg: 'rgba(107, 114, 128, 0.12)', border: 'rgba(107, 114, 128, 0.3)', text: '#9ca3af', dot: '#6b7280' },
};

const severityColors = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#3b82f6',
  Info: '#6b7280',
};

export default function Bugs({ user, setUser }) {
  const navigate = useNavigate();
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterSeverity, setFilterSeverity] = useState('All Severity');
  const [filterTag, setFilterTag] = useState('All Tags');
  const [filterDate, setFilterDate] = useState('All Time');
  const [openMenuId, setOpenMenuId] = useState(null);

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

  useEffect(() => {
    fetch('http://localhost:7000/api/bugs', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setBugs(data.bugs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const bugsWithStatus = useMemo(() => {
    return bugs.map(bug => ({
      ...bug,
      status: getBugStatus(bug),
      parsedTags: parseTags(bug.tags),
    }));
  }, [bugs]);

  const allTags = useMemo(() => {
    const tagMap = {};
    bugsWithStatus.forEach(bug => {
      bug.parsedTags.forEach(tag => {
        tagMap[tag] = (tagMap[tag] || 0) + 1;
      });
    });
    return Object.entries(tagMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [bugsWithStatus]);

  const stats = useMemo(() => {
    const total = bugsWithStatus.length;
    const open = bugsWithStatus.filter(b => b.status === 'Open').length;
    const inProgress = bugsWithStatus.filter(b => b.status === 'In Progress').length;
    const resolved = bugsWithStatus.filter(b => b.status === 'Resolved').length;
    const closed = bugsWithStatus.filter(b => b.status === 'Closed').length;
    return { total, open, inProgress, resolved, closed };
  }, [bugsWithStatus]);

  const severityStats = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 };
    bugsWithStatus.forEach(bug => {
      const sev = bug.severity || 'Medium';
      if (counts[sev] !== undefined) counts[sev]++;
      else counts.Medium++;
    });
    return counts;
  }, [bugsWithStatus]);

  const filteredBugs = useMemo(() => {
    let result = [...bugsWithStatus];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.parsedTags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (filterStatus !== 'All Status') {
      result = result.filter(b => b.status === filterStatus);
    }

    if (filterSeverity !== 'All Severity') {
      result = result.filter(b => (b.severity || 'Medium') === filterSeverity);
    }

    if (filterTag !== 'All Tags') {
      result = result.filter(b => b.parsedTags.includes(filterTag));
    }

    if (filterDate !== 'All Time') {
      const now = new Date();
      let cutoff;
      switch (filterDate) {
        case 'Today': cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
        case 'This Week': cutoff = new Date(now - 7 * 86400000); break;
        case 'This Month': cutoff = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case 'This Year': cutoff = new Date(now.getFullYear(), 0, 1); break;
        default: cutoff = null;
      }
      if (cutoff) result = result.filter(b => new Date(b.created_at) >= cutoff);
    }

    if (activeTab !== 'All') {
      result = result.filter(b => b.status === activeTab);
    }

    switch (sortBy) {
      case 'newest': result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      case 'oldest': result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break;
      case 'title': result.sort((a, b) => a.title.localeCompare(b.title)); break;
      default: break;
    }

    return result;
  }, [bugsWithStatus, searchQuery, filterStatus, filterSeverity, filterTag, filterDate, activeTab, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterStatus('All Status');
    setFilterSeverity('All Severity');
    setFilterTag('All Tags');
    setFilterDate('All Time');
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:7000/api/bugs/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setBugs(prev => prev.filter(b => b.id !== id));
      setOpenMenuId(null);
    } catch {
      console.error('Delete failed');
    }
  };

  return (
    <div className="app">
      <div className="bg">
        <DarkVeil />
      </div>
      <HomeNavbar user={user} onLogout={handleLogout} />
      <section className="bugs">
        <div className="bugs__container">
          <div className="bugs__main">
            <div className="bugs__header">
              <div>
                <h1 className="bugs__title">Bugs</h1>
                <p className="bugs__subtitle">Track, organize, and revisit bugs you've encountered.</p>
              </div>
            </div>

            <div className="bugs__stats">
              <div className="bugs__stat-card">
                <div className="bugs__stat-icon bugs__stat-icon--total">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <div className="bugs__stat-info">
                  <span className="bugs__stat-label">Total Bugs</span>
                  <span className="bugs__stat-number">{stats.total}</span>
                  {stats.total > 0 && (
                    <span className="bugs__stat-trend bugs__stat-trend--up">+ {Math.min(stats.total, 5)} this month</span>
                  )}
                </div>
              </div>

              <div className="bugs__stat-card">
                <div className="bugs__stat-icon bugs__stat-icon--open">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4"/>
                    <path d="M12 16h.01"/>
                  </svg>
                </div>
                <div className="bugs__stat-info">
                  <span className="bugs__stat-label">Open</span>
                  <span className="bugs__stat-number">{stats.open}</span>
                  <span className="bugs__stat-pct">{stats.total ? Math.round((stats.open / stats.total) * 100) : 0}%</span>
                </div>
              </div>

              <div className="bugs__stat-card">
                <div className="bugs__stat-icon bugs__stat-icon--progress">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <div className="bugs__stat-info">
                  <span className="bugs__stat-label">In Progress</span>
                  <span className="bugs__stat-number">{stats.inProgress}</span>
                  <span className="bugs__stat-pct">{stats.total ? Math.round((stats.inProgress / stats.total) * 100) : 0}%</span>
                </div>
              </div>

              <div className="bugs__stat-card">
                <div className="bugs__stat-icon bugs__stat-icon--resolved">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <path d="m9 11 3 3L22 4"/>
                  </svg>
                </div>
                <div className="bugs__stat-info">
                  <span className="bugs__stat-label">Resolved</span>
                  <span className="bugs__stat-number">{stats.resolved}</span>
                  <span className="bugs__stat-pct">{stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0}%</span>
                </div>
              </div>

              <div className="bugs__stat-card">
                <div className="bugs__stat-icon bugs__stat-icon--closed">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                </div>
                <div className="bugs__stat-info">
                  <span className="bugs__stat-label">Closed</span>
                  <span className="bugs__stat-number">{stats.closed}</span>
                  <span className="bugs__stat-pct">{stats.total ? Math.round((stats.closed / stats.total) * 100) : 0}%</span>
                </div>
              </div>
            </div>

            <div className="bugs__toolbar">
              <div className="bugs__tabs">
                {[
                  { key: 'All', label: 'All Bugs', count: stats.total },
                  { key: 'Open', label: 'Open', count: stats.open },
                  { key: 'In Progress', label: 'In Progress', count: stats.inProgress },
                  { key: 'Resolved', label: 'Resolved', count: stats.resolved },
                  { key: 'Closed', label: 'Closed', count: stats.closed },
                ].map(tab => (
                  <button
                    key={tab.key}
                    className={`bugs__tab ${activeTab === tab.key ? 'bugs__tab--active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                    <span className="bugs__tab-count">{tab.count}</span>
                  </button>
                ))}
              </div>
              <div className="bugs__toolbar-right">
                <div className="bugs__sort">
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bugs__sort-select">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Title A-Z</option>
                  </select>
                </div>
                <div className="bugs__view-toggle">
                  <button
                    className={`bugs__view-btn ${viewMode === 'list' ? 'bugs__view-btn--active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title="List view"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" x2="21" y1="6" y2="6"/>
                      <line x1="8" x2="21" y1="12" y2="12"/>
                      <line x1="8" x2="21" y1="18" y2="18"/>
                      <line x1="3" x2="3.01" y1="6" y2="6"/>
                      <line x1="3" x2="3.01" y1="12" y2="12"/>
                      <line x1="3" x2="3.01" y1="18" y2="18"/>
                    </svg>
                  </button>
                  <button
                    className={`bugs__view-btn ${viewMode === 'grid' ? 'bugs__view-btn--active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Grid view"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="7" height="7" x="3" y="3" rx="1"/>
                      <rect width="7" height="7" x="14" y="3" rx="1"/>
                      <rect width="7" height="7" x="14" y="14" rx="1"/>
                      <rect width="7" height="7" x="3" y="14" rx="1"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="bugs__empty">
                <div className="bugs__loading-spinner" />
                <p>Loading bugs...</p>
              </div>
            ) : filteredBugs.length === 0 ? (
              <div className="bugs__empty">
                <div className="bugs__empty-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
                <p className="bugs__empty-title">No bugs found</p>
                <p className="bugs__empty-desc">
                  {bugs.length === 0
                    ? 'Start by logging your first bug.'
                    : 'Try adjusting your filters.'}
                </p>
                {bugs.length === 0 && (
                  <Link to="/bugs/new" className="bugs__empty-btn">Log a Bug</Link>
                )}
              </div>
            ) : viewMode === 'list' ? (
              <div className="bugs__list">
                {filteredBugs.map(bug => (
                  <div key={bug.id} className="bugs__item">
                    <div className="bugs__item-dot" style={{ background: statusColors[bug.status]?.dot || '#6b7280' }} />
                    <div className="bugs__item-content">
                      <div className="bugs__item-top">
                        <Link to={`/bugs/${bug.id}`} className="bugs__item-title">{bug.title}</Link>
                        <div className="bugs__item-meta">
                          <span
                            className="bugs__badge"
                            style={{
                              background: statusColors[bug.status]?.bg,
                              borderColor: statusColors[bug.status]?.border,
                              color: statusColors[bug.status]?.text,
                            }}
                          >
                            <span className="bugs__badge-dot" style={{ background: statusColors[bug.status]?.dot }} />
                            {bug.status}
                          </span>
                          <span className="bugs__item-time">{timeAgo(bug.created_at)}</span>
                          <div className="bugs__item-menu-wrap">
                            <button
                              className="bugs__item-menu"
                              onClick={() => setOpenMenuId(openMenuId === bug.id ? null : bug.id)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1"/>
                                <circle cx="19" cy="12" r="1"/>
                                <circle cx="5" cy="12" r="1"/>
                              </svg>
                            </button>
                            {openMenuId === bug.id && (
                              <div className="bugs__item-dropdown">
                                <Link to={`/bugs/${bug.id}`} className="bugs__dropdown-item" onClick={() => setOpenMenuId(null)}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                  </svg>
                                  View
                                </Link>
                                <button className="bugs__dropdown-item bugs__dropdown-item--danger" onClick={() => handleDelete(bug.id)}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18"/>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="bugs__item-tags">
                        {bug.parsedTags.map(tag => (
                          <span key={tag} className="bugs__tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bugs__grid">
                {filteredBugs.map(bug => (
                  <Link to={`/bugs/${bug.id}`} key={bug.id} className="bugs__grid-card">
                    <div className="bugs__grid-top">
                      <span className="bugs__grid-dot" style={{ background: statusColors[bug.status]?.dot || '#6b7280' }} />
                      <span
                        className="bugs__badge"
                        style={{
                          background: statusColors[bug.status]?.bg,
                          borderColor: statusColors[bug.status]?.border,
                          color: statusColors[bug.status]?.text,
                        }}
                      >
                        <span className="bugs__badge-dot" style={{ background: statusColors[bug.status]?.dot }} />
                        {bug.status}
                      </span>
                    </div>
                    <h3 className="bugs__grid-title">{bug.title}</h3>
                    <div className="bugs__item-tags">
                      {bug.parsedTags.slice(0, 3).map(tag => (
                        <span key={tag} className="bugs__tag">{tag}</span>
                      ))}
                      {bug.parsedTags.length > 3 && (
                        <span className="bugs__tag bugs__tag--more">+{bug.parsedTags.length - 3}</span>
                      )}
                    </div>
                    <div className="bugs__grid-footer">
                      <span className="bugs__item-time">{timeAgo(bug.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="bugs__sidebar">
            <SpotlightCard className="bugs__filter-card" spotlightColor="rgba(124, 58, 237, 0.2)">
              <div className="bugs__filter-header">
                <h3 className="bugs__filter-title">Filters</h3>
                <button className="bugs__filter-clear" onClick={handleClearFilters}>Clear all</button>
              </div>

              <div className="bugs__search">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bugs__search-icon">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.3-4.3"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search by title or keyword..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bugs__search-input"
                />
              </div>

              <div className="bugs__filter-group">
                <label className="bugs__filter-label">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bugs__filter-select">
                  <option>All Status</option>
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                  <option>Closed</option>
                </select>
              </div>

              <div className="bugs__filter-group">
                <label className="bugs__filter-label">Severity</label>
                <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="bugs__filter-select">
                  <option>All Severity</option>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                  <option>Info</option>
                </select>
              </div>

              <div className="bugs__filter-group">
                <label className="bugs__filter-label">Tag</label>
                <select value={filterTag} onChange={e => setFilterTag(e.target.value)} className="bugs__filter-select">
                  <option>All Tags</option>
                  {allTags.map(([tag]) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              <div className="bugs__filter-group">
                <label className="bugs__filter-label">Date</label>
                <select value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bugs__filter-select">
                  <option>All Time</option>
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>This Year</option>
                </select>
              </div>
            </SpotlightCard>

            <SpotlightCard className="bugs__filter-card" spotlightColor="rgba(124, 58, 237, 0.2)">
              <h3 className="bugs__filter-title">Bugs by Severity</h3>
              <div className="bugs__severity-chart">
                <div className="bugs__donut">
                  <svg viewBox="0 0 120 120" className="bugs__donut-svg">
                    {(() => {
                      const total = Object.values(severityStats).reduce((a, b) => a + b, 0) || 1;
                      const entries = Object.entries(severityStats).filter(([, v]) => v > 0);
                      let cumulative = 0;
                      const radius = 40;
                      const circumference = 2 * Math.PI * radius;
                      return entries.map(([key, val]) => {
                        const pct = val / total;
                        const dash = pct * circumference;
                        const offset = -cumulative * circumference;
                        cumulative += pct;
                        return (
                          <circle
                            key={key}
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke={severityColors[key]}
                            strokeWidth="18"
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={offset}
                            style={{ transition: 'all 0.3s' }}
                          />
                        );
                      });
                    })()}
                  </svg>
                </div>
                <div className="bugs__severity-legend">
                  {Object.entries(severityStats).map(([key, val]) => {
                    const total = Object.values(severityStats).reduce((a, b) => a + b, 0) || 1;
                    return (
                      <div key={key} className="bugs__legend-item">
                        <span className="bugs__legend-dot" style={{ background: severityColors[key] }} />
                        <span className="bugs__legend-label">{key}</span>
                        <span className="bugs__legend-val">{val}</span>
                        <span className="bugs__legend-pct">({Math.round((val / total) * 100)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SpotlightCard>

            <SpotlightCard className="bugs__filter-card" spotlightColor="rgba(124, 58, 237, 0.2)">
              <div className="bugs__filter-header">
                <h3 className="bugs__filter-title">Top Tags</h3>
              </div>
              <div className="bugs__top-tags">
                {allTags.map(([tag, count]) => (
                  <button
                    key={tag}
                    className={`bugs__top-tag ${filterTag === tag ? 'bugs__top-tag--active' : ''}`}
                    onClick={() => setFilterTag(filterTag === tag ? 'All Tags' : tag)}
                  >
                    {tag}
                    <span className="bugs__top-tag-count">{count}</span>
                  </button>
                ))}
              </div>
            </SpotlightCard>
          </aside>
        </div>
      </section>
    </div>
  );
}
