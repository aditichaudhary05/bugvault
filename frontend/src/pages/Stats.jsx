import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DarkVeil from '../components/DarkVeil';
import SpotlightCard from '../components/SpotlightCard';
import './Stats.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function Stats({ user, setUser }) {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('Daily');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    const root = document.getElementById('root');
    if (root) {
      root.style.overflow = 'auto';
      root.style.height = 'auto';
    }

    fetch('`${API_URL}/api/stats`', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      if (root) {
        root.style.overflow = '';
        root.style.height = '';
      }
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="app stats-page">
        <div className="bg"><DarkVeil /></div>
        <section className="stats">
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '120px' }}>Loading stats...</p>
        </section>
      </div>
    );
  }

  const total = stats.totalBugs || 1;

  const severityData = [
    { name: 'High', value: stats.severity.high, color: '#c026d3' },
    { name: 'Medium', value: stats.severity.medium, color: '#7c3aed' },
    { name: 'Low', value: stats.severity.low, color: '#4f46e5' },
    { name: 'Info', value: stats.severity.info, color: '#475569' },
  ];

  const statusData = [
    { name: 'Open', value: stats.open, color: '#7c3aed' },
    { name: 'In Progress', value: stats.inProgress, color: '#4f46e5' },
    { name: 'Resolved', value: stats.resolved, color: '#0d9488' },
  ];

  const totalSeverity = severityData.reduce((a, b) => a + b.value, 0) || 1;
  const totalStatus = statusData.reduce((a, b) => a + b.value, 0) || 1;
  const resolutionRate = total > 0 ? Math.round((stats.resolved / total) * 100) : 0;
  const activeBugs = stats.open + stats.inProgress;

  const lineData = stats.bugsOverTime && stats.bugsOverTime.length > 0
    ? stats.bugsOverTime
    : [{ name: 'No data', bugs: 0 }];

  const topTags = stats.topTags || [];
  const maxTagCount = Math.max(...topTags.map(t => t.count), 1);

  const recentActivity = (stats.recentBugs || []).map(bug => ({
    type: bug.status === 'Resolved' ? 'resolved' : bug.status === 'In Progress' ? 'updated' : 'added',
    text: bug.status === 'Resolved' ? 'Bug resolved' : bug.status === 'In Progress' ? 'Bug updated' : 'New bug added',
    detail: bug.title,
    time: getTimeAgo(bug.created_at),
  }));

  function getTimeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="stats__tooltip">
          <p>{label}</p>
          <p>{payload[0].value} bugs</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="app stats-page">
      <div className="bg"><DarkVeil /></div>
      <section className="stats">
        <div className="stats__header">
          <h1 className="stats__title">Stats Overview</h1>
          <p className="stats__subtitle">Insights into your bugs and progress.</p>
        </div>

        <div className="stats__content">
          <div className="stats__cards">
          <SpotlightCard className="stats__card" spotlightColor="rgba(124, 58, 237, 0.2)">
            <div className="stats__card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>
                <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/>
              </svg>
            </div>
            <div>
              <span className="stats__card-label">Total Bugs</span>
              <span className="stats__card-number">{stats.totalBugs}</span>
              <span className="stats__card-change stats__card-change--up">+{stats.lastMonth} vs last month ↑</span>
            </div>
          </SpotlightCard>

          <SpotlightCard className="stats__card" spotlightColor="rgba(124, 58, 237, 0.2)">
            <div className="stats__card-icon stats__card-icon--teal">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
              </svg>
            </div>
            <div>
              <span className="stats__card-label">Resolved</span>
              <span className="stats__card-number">{stats.resolved}</span>
              <div className="stats__progress">
                <div className="stats__progress-bar" style={{ width: `${(stats.resolved / total) * 100}%`, background: '#0d9488' }} />
              </div>
              <span className="stats__card-pct">{Math.round((stats.resolved / total) * 100)}% resolution rate</span>
            </div>
          </SpotlightCard>

          <SpotlightCard className="stats__card" spotlightColor="rgba(124, 58, 237, 0.2)">
            <div className="stats__card-icon stats__card-icon--indigo">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <span className="stats__card-label">In Progress</span>
              <span className="stats__card-number">{stats.inProgress}</span>
              <div className="stats__progress">
                <div className="stats__progress-bar" style={{ width: `${(stats.inProgress / total) * 100}%`, background: '#4f46e5' }} />
              </div>
              <span className="stats__card-pct">{Math.round((stats.inProgress / total) * 100)}% of total</span>
            </div>
          </SpotlightCard>

          <SpotlightCard className="stats__card" spotlightColor="rgba(124, 58, 237, 0.2)">
            <div className="stats__card-icon stats__card-icon--pink">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>
              </svg>
            </div>
            <div>
              <span className="stats__card-label">Open</span>
              <span className="stats__card-number">{stats.open}</span>
              <div className="stats__progress">
                <div className="stats__progress-bar" style={{ width: `${(stats.open / total) * 100}%`, background: '#c026d3' }} />
              </div>
              <span className="stats__card-pct">{Math.round((stats.open / total) * 100)}% of total</span>
            </div>
          </SpotlightCard>
        </div>

        <div className="stats__middle">
          <SpotlightCard className="stats__chart-card" spotlightColor="rgba(124, 58, 237, 0.15)">
            <div className="stats__chart-header">
              <h3>Bugs Over Time</h3>
              <select className="stats__select" value={timeRange} onChange={e => setTimeRange(e.target.value)}>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div className="stats__line-chart">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={lineData}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="bugs" stroke="#4f46e5" strokeWidth={2} dot={{ fill: '#4f46e5', r: 3, strokeWidth: 2, stroke: '#0f0a1a' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SpotlightCard>

          <SpotlightCard className="stats__chart-card" spotlightColor="rgba(124, 58, 237, 0.15)">
            <h3>Bugs by Severity</h3>
            <div className="stats__donut-section">
              <div className="stats__donut-wrapper">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={severityData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} dataKey="value">
                      {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="stats__donut-center">
                  <span className="stats__donut-number">{stats.totalBugs}</span>
                  <span className="stats__donut-label">Total</span>
                </div>
              </div>
              <div className="stats__legend">
                {severityData.map(item => (
                  <div key={item.name} className="stats__legend-item">
                    <span className="stats__legend-dot" style={{ background: item.color }} />
                    <span className="stats__legend-label">{item.name}</span>
                    <span className="stats__legend-count">{item.value}</span>
                    <span className="stats__legend-pct">({Math.round((item.value / totalSeverity) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </SpotlightCard>
        </div>

        <div className="stats__bottom">
          <SpotlightCard className="stats__chart-card" spotlightColor="rgba(124, 58, 237, 0.15)">
            <h3>Bugs by Status</h3>
            <div className="stats__donut-section">
              <div className="stats__donut-wrapper">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={48} outerRadius={76} dataKey="value">
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="stats__legend">
                {statusData.map(item => (
                  <div key={item.name} className="stats__legend-item">
                    <span className="stats__legend-dot" style={{ background: item.color }} />
                    <span className="stats__legend-label">{item.name}</span>
                    <span className="stats__legend-count">{item.value}</span>
                    <span className="stats__legend-pct">({Math.round((item.value / totalStatus) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="stats__status-summary">
              <div className="stats__status-stat">
                <span className="stats__status-stat-value" style={{ color: '#0d9488' }}>{resolutionRate}%</span>
                <span className="stats__status-stat-label">Resolution Rate</span>
              </div>
              <div className="stats__status-divider" />
              <div className="stats__status-stat">
                <span className="stats__status-stat-value" style={{ color: '#7c3aed' }}>{activeBugs}</span>
                <span className="stats__status-stat-label">Active Bugs</span>
              </div>
              <div className="stats__status-divider" />
              <div className="stats__status-stat">
                <span className="stats__status-stat-value" style={{ color: '#4f46e5' }}>{stats.totalBugs}</span>
                <span className="stats__status-stat-label">Total Logged</span>
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="stats__chart-card" spotlightColor="rgba(124, 58, 237, 0.15)">
            <h3>Top Tags</h3>
            <div className="stats__tags">
              {topTags.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>No tags yet</p>}
              {topTags.slice(0, 8).map(tag => (
                <div key={tag.name} className="stats__tag-row">
                  <span className="stats__tag-name">{tag.name}</span>
                  <div className="stats__tag-bar-track">
                    <div className="stats__tag-bar" style={{ width: `${(tag.count / total) * 100}%` }} />
                  </div>
                  <span className="stats__tag-count">{tag.count}</span>
                </div>
              ))}
            </div>
            {topTags.length > 0 && (
              <button className="stats__view-all" onClick={() => navigate('/tags')}>
                View All
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            )}
          </SpotlightCard>

          <SpotlightCard className="stats__chart-card" spotlightColor="rgba(124, 58, 237, 0.15)">
            <h3>Recent Activity</h3>
            <div className="stats__activity">
              {recentActivity.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>No recent activity</p>}
              {recentActivity.map((item, i) => (
                <div key={i} className="stats__activity-item">
                  <div className={`stats__activity-icon stats__activity-icon--${item.type}`}>
                    {item.type === 'resolved' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>}
                    {item.type === 'added' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>}
                    {item.type === 'updated' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>}
                  </div>
                  <div className="stats__activity-info">
                    <span className="stats__activity-text">{item.text}</span>
                    <span className="stats__activity-detail">{item.detail}</span>
                  </div>
                  <span className="stats__activity-time">{item.time}</span>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </div>
        </div>
      </section>
    </div>
  );
}
