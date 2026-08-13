import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DarkVeil from '../components/DarkVeil';
import SpotlightCard from '../components/SpotlightCard';
import './NewBug.css';

const API_URL = import.meta.env.VITE_API_URL;

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch { return []; }
}

export default function EditBug() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', project: '', severity: 'Medium', status: 'Open',
    whatHappened: '', stepsToReproduce: '', expectedBehavior: '',
    actualBehavior: '', rootCause: '', tags: [],
    solution: '', codeSnippet: '', language: 'JavaScript',
  });
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/bugs/${id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.bug) {
          const b = data.bug;
          setFormData({
            title: b.title || '',
            project: b.context || '',
            severity: b.severity || 'Medium',
            status: b.status || 'Open',
            whatHappened: b.description || '',
            stepsToReproduce: b.reproduction_steps || '',
            expectedBehavior: b.expected_behavior || '',
            actualBehavior: b.actual_behavior || '',
            rootCause: b.root_cause || '',
            tags: parseTags(b.tags),
            solution: b.solution || '',
            codeSnippet: b.code_snippet || '',
            language: b.language || 'JavaScript',
          });
        } else {
          setError('Bug not found');
        }
        setFetching(false);
      })
      .catch(() => { setError('Failed to load bug'); setFetching(false); });
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/bugs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          project: formData.project,
          severity: formData.severity,
          status: formData.status,
          whatHappened: formData.whatHappened,
          stepsToReproduce: formData.stepsToReproduce,
          expectedBehavior: formData.expectedBehavior,
          actualBehavior: formData.actualBehavior,
          rootCause: formData.rootCause,
          tags: formData.tags,
          solution: formData.solution,
          codeSnippet: formData.codeSnippet,
          language: formData.language,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message);
        setLoading(false);
        return;
      }
      navigate(-1);
    } catch {
      setError('Server error. Please try again.');
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="app">
        <div className="bg"><DarkVeil /></div>
        <div className="newbug-overlay">
          <div className="newbug-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div className="bugdetail__spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="bg"><DarkVeil /></div>
      <div className="newbug-overlay">
        <SpotlightCard className="newbug-modal" spotlightColor="rgba(124, 58, 237, 0.25)">
          <button onClick={() => navigate(-1)} className="newbug-modal__close">&times;</button>

          <div className="newbug-modal__header">
            <div className="newbug-modal__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
              </svg>
            </div>
            <div>
              <h2 className="newbug-modal__title">Edit Bug</h2>
              <p className="newbug-modal__subtitle">Update the details of this bug.</p>
            </div>
          </div>

          {error && <p className="newbug-modal__error">{error}</p>}

          <form className="newbug-modal__form" onSubmit={handleSubmit}>
            <div className="newbug-modal__field">
              <label className="newbug-modal__label"><span className="newbug-modal__dot"></span>Title</label>
              <input className="newbug-modal__input" type="text" name="title" placeholder="Short, descriptive title of the bug" maxLength={120} value={formData.title} onChange={handleChange} required />
              <span className="newbug-modal__count">{formData.title.length}/120</span>
            </div>

            <div className="newbug-modal__row">
              <div className="newbug-modal__field">
                <label className="newbug-modal__label"><span className="newbug-modal__dot"></span>Status</label>
                <select className="newbug-modal__select" name="status" value={formData.status} onChange={handleChange}>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="newbug-modal__field">
                <label className="newbug-modal__label"><span className="newbug-modal__dot"></span>Severity</label>
                <select className="newbug-modal__select" name="severity" value={formData.severity} onChange={handleChange}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="newbug-modal__field">
              <label className="newbug-modal__label"><span className="newbug-modal__dot"></span>Where did it happen?</label>
              <select className="newbug-modal__select" name="project" value={formData.project} onChange={handleChange}>
                <option value="">Select project or context</option>
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="mobile">Mobile</option>
              </select>
            </div>

            <div className="newbug-modal__field">
              <label className="newbug-modal__label"><span className="newbug-modal__dot"></span>What happened?</label>
              <textarea className="newbug-modal__textarea" name="whatHappened" placeholder="Describe what went wrong..." maxLength={1000} rows={3} value={formData.whatHappened} onChange={handleChange} />
              <span className="newbug-modal__count">{formData.whatHappened.length}/1000</span>
            </div>

            <div className="newbug-modal__field">
              <label className="newbug-modal__label"><span className="newbug-modal__dot"></span>Steps to Reproduce</label>
              <textarea className="newbug-modal__textarea" name="stepsToReproduce" placeholder={"1. First step\n2. Second step\n3. Third step"} maxLength={1000} rows={4} value={formData.stepsToReproduce} onChange={handleChange} />
              <span className="newbug-modal__count">{formData.stepsToReproduce.length}/1000</span>
            </div>

            <div className="newbug-modal__row">
              <div className="newbug-modal__field">
                <label className="newbug-modal__label"><span className="newbug-modal__dot"></span>Expected Behavior</label>
                <textarea className="newbug-modal__textarea" name="expectedBehavior" placeholder="What did you expect to happen?" maxLength={500} rows={3} value={formData.expectedBehavior} onChange={handleChange} />
                <span className="newbug-modal__count">{formData.expectedBehavior.length}/500</span>
              </div>
              <div className="newbug-modal__field">
                <label className="newbug-modal__label"><span className="newbug-modal__dot"></span>Actual Behavior</label>
                <textarea className="newbug-modal__textarea" name="actualBehavior" placeholder="What actually happened?" maxLength={500} rows={3} value={formData.actualBehavior} onChange={handleChange} />
                <span className="newbug-modal__count">{formData.actualBehavior.length}/500</span>
              </div>
            </div>

            <div className="newbug-modal__row">
              <div className="newbug-modal__field">
                <label className="newbug-modal__label"><span className="newbug-modal__dot"></span>Root Cause</label>
                <textarea className="newbug-modal__textarea" name="rootCause" placeholder="What was the real cause of this bug?" maxLength={500} rows={3} value={formData.rootCause} onChange={handleChange} />
                <span className="newbug-modal__count">{formData.rootCause.length}/500</span>
              </div>
              <div className="newbug-modal__field">
                <label className="newbug-modal__label"><span className="newbug-modal__dot"></span>Tags</label>
                <input className="newbug-modal__input" type="text" placeholder="Add tags (e.g., auth, api, ui)" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} />
                <div className="newbug-modal__tags">
                  {formData.tags.map(tag => (
                    <span key={tag} className="newbug-modal__tag">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}>&times;</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="newbug-modal__row">
              <div className="newbug-modal__field">
                <label className="newbug-modal__label"><span className="newbug-modal__dot"></span>Solution / Fix</label>
                <textarea className="newbug-modal__textarea" name="solution" placeholder="How did you fix this issue?" maxLength={1000} rows={3} value={formData.solution} onChange={handleChange} />
                <span className="newbug-modal__count">{formData.solution.length}/1000</span>
              </div>
              <div className="newbug-modal__field">
                <label className="newbug-modal__label"><span className="newbug-modal__dot"></span>Code / Snippet (optional)</label>
                <textarea className="newbug-modal__textarea newbug-modal__textarea--code" name="codeSnippet" placeholder="Paste code or relevant snippet here..." rows={3} value={formData.codeSnippet} onChange={handleChange} />
                <select className="newbug-modal__language" name="language" value={formData.language} onChange={handleChange}>
                  <option value="JavaScript">JavaScript</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                  <option value="Go">Go</option>
                  <option value="Rust">Rust</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="newbug-modal__actions">
              <button type="button" onClick={() => navigate(-1)} className="newbug-modal__cancel">Cancel</button>
              <button type="submit" className="newbug-modal__submit" disabled={loading}>
                {loading ? 'Saving...' : 'Update Bug'}
              </button>
            </div>
          </form>
        </SpotlightCard>
      </div>
    </div>
  );
}
