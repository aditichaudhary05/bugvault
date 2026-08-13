import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import DarkVeil from '../components/DarkVeil';
import SpotlightCard from '../components/SpotlightCard';
import './Bugs.css';

const API_URL = import.meta.env.VITE_API_URL;

function getBugStatus(bug) {
  if (bug.status) return bug.status;
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
  Open: { bg: 'rgba(124, 58, 237, 0.15)', border: 'rgba(124, 58, 237, 0.3)', text: '#c4b5fd', dot: '#7C3AED' },
  'In Progress': { bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)', text: '#fde047', dot: '#eab308' },
  Resolved: { bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)', text: '#86efac', dot: '#22c55e' },
  Closed: { bg: 'rgba(107, 114, 128, 0.12)', border: 'rgba(107, 114, 128, 0.3)', text: '#9ca3af', dot: '#6b7280' },
};

const ITEMS_PER_PAGE = 6;

export default function Bugs({ user, setUser }) {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterSeverity, setFilterSeverity] = useState('All Severity');
  const [filterTag, setFilterTag] = useState('All Tags');
  const [filterDate, setFilterDate] = useState('All Time');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuBtnRefs = useRef({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const filterRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('`${API_URL}/api/bugs`', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setBugs(data.bugs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterPanel(false);
      }
      if (!e.target.closest('.bugs__item-menu-wrap')) {
        setOpenMenuId(null);
      }
    };
    const handleScroll = () => setOpenMenuId(null);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
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

  const filteredBugs = useMemo(() => {
    let result = [...bugsWithStatus];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.title.toLowerCase().includes(query) ||
        (b.description && b.description.toLowerCase().includes(query)) ||
        b.parsedTags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    if (filterStatus !== 'All Status') result = result.filter(b => b.status === filterStatus);
    if (filterSeverity !== 'All Severity') result = result.filter(b => (b.severity || 'Medium') === filterSeverity);
    if (filterTag !== 'All Tags') result = result.filter(b => b.parsedTags.includes(filterTag));
    if (filterDate !== 'All Time') {
      const now = new Date();
      let cutoff;
      if (filterDate === 'Today') cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      else if (filterDate === 'This Week') cutoff = new Date(now - 7 * 86400000);
      else if (filterDate === 'This Month') cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
      else if (filterDate === 'This Year') cutoff = new Date(now.getFullYear(), 0, 1);
      if (cutoff) result = result.filter(b => new Date(b.created_at) >= cutoff);
    }
    if (activeTab !== 'All') result = result.filter(b => b.status === activeTab);
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sortBy === 'oldest') result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else if (sortBy === 'title') result.sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }, [bugsWithStatus, searchQuery, filterStatus, filterSeverity, filterTag, filterDate, activeTab, sortBy]);

  const totalPages = Math.ceil(filteredBugs.length / ITEMS_PER_PAGE);
  const paginatedBugs = filteredBugs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, sortBy, filterStatus, filterSeverity, filterTag, filterDate]);

  const handleClearFilters = () => {
    setFilterStatus('All Status');
    setFilterSeverity('All Severity');
    setFilterTag('All Tags');
    setFilterDate('All Time');
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/api/bugs/${id}`, { method: 'DELETE', credentials: 'include' });
      setBugs(prev => prev.filter(b => b.id !== id));
      setOpenMenuId(null);
    } catch { console.error('Delete failed'); }
  };

  const hasActiveFilters = filterStatus !== 'All Status' || filterSeverity !== 'All Severity' || filterTag !== 'All Tags' || filterDate !== 'All Time';

  const tabs = [
    { key: 'All', label: 'All Bugs', count: stats.total },
    { key: 'Open', label: 'Open', count: stats.open },
    { key: 'In Progress', label: 'In Progress', count: stats.inProgress },
    { key: 'Resolved', label: 'Resolved', count: stats.resolved },
    { key: 'Closed', label: 'Closed', count: stats.closed },
  ];

  const BugIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/>
      <path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/>
      <path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/>
      <path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>
    </svg>
  );

  const PlusIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14"/><path d="M5 12h14"/>
    </svg>
  );

  const ChevronLeft = (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  );

  const ChevronRight = (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );

  const FilterIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );

  const DotsIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
    </svg>
  );

  const EyeIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );

  const TrashIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
  );

  const EditIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
    </svg>
  );

  return (
    <div className="app">
      <div className="bg"><DarkVeil /></div>
      <section className="bugs">
        <div className="bugs__content">
          <div className="bugs__header">
            <div className="bugs__header-left">
              <h1 className="bugs__title">Bugs</h1>
              <p className="bugs__subtitle">Track, organize, and revisit bugs you've encountered.</p>
            </div>
            <div className="bugs__search">
              <svg className="bugs__search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                type="text"
                className="bugs__search-input"
                placeholder="Search bugs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="bugs__stats">
            <SpotlightCard className="bugs__stat-card" spotlightColor="rgba(124, 58, 237, 0.2)">
              <div className="bugs__stat-icon bugs__stat-icon--total">{BugIcon}</div>
              <div className="bugs__stat-info">
                <span className="bugs__stat-label">Total Bugs</span>
                <span className="bugs__stat-number">{stats.total}</span>
                {stats.total > 0 && <span className="bugs__stat-trend bugs__stat-trend--up">+ {Math.min(stats.total, 5)} this month</span>}
              </div>
            </SpotlightCard>
            <SpotlightCard className="bugs__stat-card" spotlightColor="rgba(124, 58, 237, 0.2)">
              <div className="bugs__stat-icon bugs__stat-icon--open">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              </div>
              <div className="bugs__stat-info">
                <span className="bugs__stat-label">Open</span>
                <span className="bugs__stat-number">{stats.open}</span>
                <span className="bugs__stat-pct">{stats.total ? Math.round((stats.open / stats.total) * 100) : 0}%</span>
              </div>
            </SpotlightCard>
            <SpotlightCard className="bugs__stat-card" spotlightColor="rgba(124, 58, 237, 0.2)">
              <div className="bugs__stat-icon bugs__stat-icon--progress">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <div className="bugs__stat-info">
                <span className="bugs__stat-label">In Progress</span>
                <span className="bugs__stat-number">{stats.inProgress}</span>
                <span className="bugs__stat-pct">{stats.total ? Math.round((stats.inProgress / stats.total) * 100) : 0}%</span>
              </div>
            </SpotlightCard>
            <SpotlightCard className="bugs__stat-card" spotlightColor="rgba(124, 58, 237, 0.2)">
              <div className="bugs__stat-icon bugs__stat-icon--resolved">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              </div>
              <div className="bugs__stat-info">
                <span className="bugs__stat-label">Resolved</span>
                <span className="bugs__stat-number">{stats.resolved}</span>
                <span className="bugs__stat-pct">{stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0}%</span>
              </div>
            </SpotlightCard>
            <SpotlightCard className="bugs__stat-card" spotlightColor="rgba(124, 58, 237, 0.2)">
              <div className="bugs__stat-icon bugs__stat-icon--closed">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 12l2 2 4-4"/></svg>
              </div>
              <div className="bugs__stat-info">
                <span className="bugs__stat-label">Closed</span>
                <span className="bugs__stat-number">{stats.closed}</span>
                <span className="bugs__stat-pct">{stats.total ? Math.round((stats.closed / stats.total) * 100) : 0}%</span>
              </div>
            </SpotlightCard>
          </div>

          <div className="bugs__toolbar">
            <div className="bugs__tabs">
              {tabs.map(tab => (
                <button key={tab.key} className={`bugs__tab ${activeTab === tab.key ? 'bugs__tab--active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                  {tab.label}
                  <span className="bugs__tab-count">{tab.count}</span>
                </button>
              ))}
            </div>
            <div className="bugs__toolbar-right">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bugs__sort-select">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
              </select>
              <div className="bugs__filter-wrap" ref={filterRef}>
                <button className={`bugs__filter-btn ${hasActiveFilters ? 'bugs__filter-btn--active' : ''}`} onClick={() => setShowFilterPanel(!showFilterPanel)} title="Filters">
                  {FilterIcon}
                </button>
                {showFilterPanel && (
                  <div className="bugs__filter-panel">
                    <div className="bugs__filter-panel-header">
                      <span className="bugs__filter-panel-title">Filters</span>
                      <button className="bugs__filter-clear" onClick={handleClearFilters}>Clear all</button>
                    </div>
                    <div className="bugs__filter-group">
                      <label className="bugs__filter-label">Status</label>
                      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bugs__filter-select">
                        <option>All Status</option><option>Open</option><option>In Progress</option><option>Resolved</option><option>Closed</option>
                      </select>
                    </div>
                    <div className="bugs__filter-group">
                      <label className="bugs__filter-label">Severity</label>
                      <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="bugs__filter-select">
                        <option>All Severity</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option><option>Info</option>
                      </select>
                    </div>
                    <div className="bugs__filter-group">
                      <label className="bugs__filter-label">Tag</label>
                      <select value={filterTag} onChange={e => setFilterTag(e.target.value)} className="bugs__filter-select">
                        <option>All Tags</option>
                        {allTags.map(([tag]) => <option key={tag} value={tag}>{tag}</option>)}
                      </select>
                    </div>
                    <div className="bugs__filter-group">
                      <label className="bugs__filter-label">Date</label>
                      <select value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bugs__filter-select">
                        <option>All Time</option><option>Today</option><option>This Week</option><option>This Month</option><option>This Year</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bugs__empty">
              <div className="bugs__loading-spinner" />
              <p>Loading bugs...</p>
            </div>
          ) : filteredBugs.length === 0 ? (
            <div className="bugs__empty-card">
              <div className="bugs__empty-icon-wrap">{BugIcon}</div>
              <p className="bugs__empty-title">No bugs found</p>
              <p className="bugs__empty-desc">{bugs.length === 0 ? "Looks like you're all caught up. Great job!" : 'Try adjusting your filters.'}</p>
              {bugs.length === 0 && (
                <Link to="/bugs/new" className="bugs__empty-btn">{PlusIcon} New Bug</Link>
              )}
            </div>
          ) : (
            <>
              <div className="bugs__list">
                {paginatedBugs.map(bug => (
                  <SpotlightCard key={bug.id} className="bugs__item" spotlightColor="rgba(124, 58, 237, 0.2)">
                    <div className="bugs__item-content">
                      <div className="bugs__item-top">
                        <div className="bugs__item-title-row">
                          <span className="bugs__item-dot" style={{ background: statusColors[bug.status]?.dot || '#6b7280' }} />
                          <Link to={`/bugs/${bug.id}`} className="bugs__item-title">{bug.title}</Link>
                        </div>
                        <div className="bugs__item-meta">
                          <span className="bugs__badge" style={{ background: statusColors[bug.status]?.bg, borderColor: statusColors[bug.status]?.border, color: statusColors[bug.status]?.text }}>
                            <span className="bugs__badge-dot" style={{ background: statusColors[bug.status]?.dot }} />
                            {bug.status}
                          </span>
                          <span className="bugs__item-time">{timeAgo(bug.created_at)}</span>
                          <div className="bugs__item-menu-wrap">
                            <button className="bugs__item-menu" ref={el => menuBtnRefs.current[bug.id] = el} onClick={(e) => {
                              if (openMenuId === bug.id) { setOpenMenuId(null); return; }
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPos({ top: rect.bottom + 4, left: rect.right - 150 });
                              setOpenMenuId(bug.id);
                            }}>{DotsIcon}</button>
                            {openMenuId === bug.id && (
                              <div className="bugs__item-dropdown" style={{ top: menuPos.top, left: menuPos.left }}>
                                <Link to={`/bugs/${bug.id}`} className="bugs__dropdown-item" onClick={() => setOpenMenuId(null)}>{EyeIcon} View</Link>
                                <Link to={`/bugs/${bug.id}/edit`} className="bugs__dropdown-item" onClick={() => setOpenMenuId(null)}>{EditIcon} Edit</Link>
                                <button className="bugs__dropdown-item bugs__dropdown-item--danger" onClick={() => handleDelete(bug.id)}>{TrashIcon} Delete</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="bugs__item-tags">
                        {bug.parsedTags.map(tag => <span key={tag} className="bugs__tag">{tag}</span>)}
                      </div>
                    </div>
                  </SpotlightCard>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="bugs__pagination">
                  <button className="bugs__page-btn bugs__page-arrow" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>{ChevronLeft}</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} className={`bugs__page-btn ${currentPage === n ? 'bugs__page-btn--active' : ''}`} onClick={() => setCurrentPage(n)}>{n}</button>
                  ))}
                  <button className="bugs__page-btn bugs__page-arrow" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>{ChevronRight}</button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
