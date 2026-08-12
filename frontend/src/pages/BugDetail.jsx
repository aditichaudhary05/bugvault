import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DarkVeil from '../components/DarkVeil';
import './BugDetail.css';

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch { return []; }
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

const statusOptions = ['Open', 'In Progress', 'Resolved', 'Closed'];

const statusColors = {
  Open: { bg: 'rgba(124, 58, 237, 0.15)', border: 'rgba(124, 58, 237, 0.3)', text: '#c4b5fd', dot: '#7C3AED' },
  'In Progress': { bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)', text: '#fde047', dot: '#eab308' },
  Resolved: { bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)', text: '#86efac', dot: '#22c55e' },
  Closed: { bg: 'rgba(107, 114, 128, 0.12)', border: 'rgba(107, 114, 128, 0.3)', text: '#9ca3af', dot: '#6b7280' },
};

const severityIcons = {
  Critical: '🔴', High: '🟠', Medium: '🟡', Low: '🔵', Info: '⚪',
};

export default function BugDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [allBugs, setAllBugs] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`http://localhost:7000/api/bugs/${id}`, { credentials: 'include' }).then(r => r.json()),
      fetch('http://localhost:7000/api/bugs', { credentials: 'include' }).then(r => r.json()),
    ]).then(([bugData, bugsData]) => {
      if (bugData.success) setBug(bugData.bug);
      if (bugsData.success) setAllBugs(bugsData.bugs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="app">
        <div className="bg"><DarkVeil /></div>
        <section className="bugdetail">
          <div className="bugdetail__loading"><div className="bugdetail__spinner" /></div>
        </section>
      </div>
    );
  }

  if (!bug) {
    return (
      <div className="app">
        <div className="bg"><DarkVeil /></div>
        <section className="bugdetail">
          <div className="bugdetail__empty">
            <p>Bug not found.</p>
            <Link to="/bugs" className="bugdetail__back">Back to Bugs</Link>
          </div>
        </section>
      </div>
    );
  }

  const status = bug.solution ? 'Resolved' : bug.root_cause ? 'In Progress' : 'Open';
  const tags = parseTags(bug.tags);
  const colors = statusColors[bug.status] || statusColors[status];

  const currentIndex = allBugs.findIndex(b => b.id === bug.id);
  const prevBug = currentIndex > 0 ? allBugs[currentIndex - 1] : null;
  const nextBug = currentIndex < allBugs.length - 1 ? allBugs[currentIndex + 1] : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(bug.code_snippet || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === (bug.status || status)) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`http://localhost:7000/api/bugs/${bug.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setBug({ ...bug, status: newStatus });
      }
    } catch (e) {
      console.error('Failed to update status');
    }
    setUpdatingStatus(false);
  };

  const Section = ({ icon, title, children, className = '' }) => (
    <div className={`bugdetail__section ${className}`}>
      <div className="bugdetail__section-header">
        <span className="bugdetail__section-icon">{icon}</span>
        <h3 className="bugdetail__section-title">{title}</h3>
      </div>
      <div className="bugdetail__section-body">{children}</div>
    </div>
  );

  return (
    <div className="app">
      <div className="bg"><DarkVeil /></div>
      <section className="bugdetail">
        <div className="bugdetail__content">
          <Link to="/bugs" className="bugdetail__back">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to Bugs
          </Link>

          <div className="bugdetail__header">
            <div className="bugdetail__header-left">
              <div className="bugdetail__title-row">
                <span className="bugdetail__dot" style={{ background: colors.dot }} />
                <h1 className="bugdetail__title">{bug.title}</h1>
              </div>
              {tags.length > 0 && (
                <div className="bugdetail__tags">
                  {tags.map(tag => <span key={tag} className="bugdetail__tag">{tag}</span>)}
                </div>
              )}
            </div>
            <div className="bugdetail__header-right">
              <div className="bugdetail__status-select-wrap" style={{ position: 'relative' }}>
                <select
                  className="bugdetail__status-select"
                  value={bug.status || status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                  style={{
                    background: colors.bg,
                    borderColor: colors.border,
                    color: colors.text,
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    paddingRight: '28px',
                  }}
                >
                  {statusOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bugdetail__timestamps">
            <span>Created {timeAgo(bug.created_at)}</span>
            {bug.updated_at !== bug.created_at && <span>Updated {timeAgo(bug.updated_at)}</span>}
          </div>

          <div className="bugdetail__meta">
            <div className="bugdetail__meta-item">
              <span className="bugdetail__meta-label">Severity</span>
              <span className="bugdetail__meta-value">{severityIcons[bug.severity] || '🟡'} {bug.severity || 'Medium'}</span>
            </div>
            {bug.context && (
              <div className="bugdetail__meta-item">
                <span className="bugdetail__meta-label">Reported in</span>
                <span className="bugdetail__meta-value">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/></svg>
                  {bug.context}
                </span>
              </div>
            )}
            <div className="bugdetail__meta-item">
              <span className="bugdetail__meta-label">Environment</span>
              <span className="bugdetail__meta-value">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                Production
              </span>
            </div>
            <div className="bugdetail__meta-item">
              <span className="bugdetail__meta-label">Browser / Client</span>
              <span className="bugdetail__meta-value">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                N/A
              </span>
            </div>
          </div>

          {bug.description && (
            <Section icon="📝" title="Description">
              <p>{bug.description}</p>
            </Section>
          )}

          {bug.reproduction_steps && (
            <Section icon="🔁" title="Steps to Reproduce">
              <ol className="bugdetail__steps">
                {bug.reproduction_steps.split('\n').filter(Boolean).map((step, i) => (
                  <li key={i}>{step.replace(/^\d+[\.\)]\s*/, '')}</li>
                ))}
              </ol>
            </Section>
          )}

          {(bug.expected_behavior || bug.actual_behavior) && (
            <div className="bugdetail__two-col">
              {bug.expected_behavior && (
                <Section icon="✅" title="Expected Behavior">
                  <p>{bug.expected_behavior}</p>
                </Section>
              )}
              {bug.actual_behavior && (
                <Section icon="❌" title="Actual Behavior">
                  <p>{bug.actual_behavior}</p>
                </Section>
              )}
            </div>
          )}

          {bug.root_cause && (
            <Section icon="🔍" title="Root Cause">
              <p>{bug.root_cause}</p>
            </Section>
          )}

          {bug.solution && (
            <Section icon="💡" title="Solution / Fix">
              <p>{bug.solution}</p>
            </Section>
          )}

          {bug.code_snippet && (
            <Section icon="💻" title="Code / Snippet" className="bugdetail__section--code">
              <div className="bugdetail__code-header">
                <span className="bugdetail__code-lang">{bug.language || 'JavaScript'}</span>
                <button className="bugdetail__copy-btn" onClick={handleCopy}>
                  {copied ? (
                    <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Copied</>
                  ) : (
                    <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> Copy</>
                  )}
                </button>
              </div>
              <pre className="bugdetail__code">
                <code>{bug.code_snippet}</code>
              </pre>
            </Section>
          )}

          <Section icon="🏷️" title="Tags" className="bugdetail__section--tags">
            <div className="bugdetail__tag-list">
              {tags.map(tag => <span key={tag} className="bugdetail__tag">{tag}</span>)}
              <button className="bugdetail__tag-add">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
              </button>
            </div>
          </Section>

          <div className="bugdetail__nav">
            {prevBug ? (
              <Link to={`/bugs/${prevBug.id}`} className="bugdetail__nav-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Prev
              </Link>
            ) : <div />}
            <span className="bugdetail__nav-count">{currentIndex + 1} of {allBugs.length}</span>
            {nextBug ? (
              <Link to={`/bugs/${nextBug.id}`} className="bugdetail__nav-btn">
                Next
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            ) : <div />}
          </div>
        </div>
      </section>
    </div>
  );
}
