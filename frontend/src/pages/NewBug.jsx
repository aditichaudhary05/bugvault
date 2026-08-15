import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DarkVeil from '../components/DarkVeil';
import SpotlightCard from '../components/SpotlightCard';
import './NewBug.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function NewBug() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    project: '',
    severity: 'Medium',
    whatHappened: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    rootCause: '',
    tags: [],
    solution: '',
    codeSnippet: '',
    language: 'JavaScript'
  });

  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const res = await fetch(`${API_URL}/api/bugs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          project: formData.project,
          severity: formData.severity,
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

  return (
    <div className="app">
      <div className="bg">
        <DarkVeil />
      </div>
      <div className="newbug-overlay">
        <SpotlightCard className="newbug-modal" spotlightColor="rgba(124, 58, 237, 0.25)">
          <button onClick={() => navigate(-1)} className="newbug-modal__close">&times;</button>

          <div className="newbug-modal__header">
            <div className="newbug-modal__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <div>
              <h2 className="newbug-modal__title">New Bug</h2>
              <p className="newbug-modal__subtitle">Log the details of the bug you encountered.</p>
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
                <label className="newbug-modal__label"><span className="newbug-modal__dot"></span>Where did it happen?</label>
                <select className="newbug-modal__select" name="project" value={formData.project} onChange={handleChange}>
                  <option value="">Select project or context</option>
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="mobile">Mobile</option>
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

            <div className="newbug-modal__attach">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              <div className="newbug-modal__attach-text">
                <span>Attach files</span>
                <span className="newbug-modal__attach-desc">Screenshots, logs, or any helpful file</span>
              </div>
            </div>

            <div className="newbug-modal__actions">
              <button type="button" onClick={() => navigate(-1)} className="newbug-modal__cancel">Cancel</button>
              <button type="submit" className="newbug-modal__submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Bug'}
              </button>
            </div>
          </form>
        </SpotlightCard>
      </div>
    </div>
  );
}
