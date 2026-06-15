import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function AnnouncementModal({ open, onClose }) {
  const { addAnnouncement } = useApp();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');

  if (!open) return null;

  const handleSubmit = () => {
    if (!title.trim()) return;
    addAnnouncement(title.trim(), body.trim(), target);
    setTitle('');
    setBody('');
    onClose();
  };

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div className="modal-title" style={{ marginBottom: 14 }}>Send Announcement</div>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Field trip reminder" />
        </div>
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea className="form-input" style={{ minHeight: 80, resize: 'vertical' }} value={body} onChange={e => setBody(e.target.value)} placeholder="Details..." />
        </div>
        <div className="form-group">
          <label className="form-label">Send to</label>
          <select className="form-select-m" value={target} onChange={e => setTarget(e.target.value)}>
            <option value="all">All (Teachers + Parents)</option>
            <option value="teacher">Teachers only</option>
            <option value="parent">Parents only</option>
          </select>
        </div>
        <div className="modal-footer" style={{ marginTop: 14 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Send Announcement</button>
        </div>
      </div>
    </div>
  );
}
