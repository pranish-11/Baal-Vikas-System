import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from '../api/axios.js';
import ComplaintCard from '../components/ComplaintCard.jsx';

export default function Complaints() {
  const { openComplaintModal, complaintsRefreshKey } =
    useOutletContext() || {};
  const [list, setList] = useState([]);
  const [tab, setTab] = useState('all');

  const load = () => axios.get('/api/complaints').then((r) => setList(r.data));

  useEffect(() => {
    load();
  }, [complaintsRefreshKey]);

  const filtered = useMemo(() => {
    if (tab === 'all') return list;
    return list.filter((c) => c.status === tab);
  }, [list, tab]);

  const resolve = async (id) => {
    const { data } = await axios.put(`/api/complaints/${id}/resolve`);
    setList((prev) => prev.map((c) => (c._id === id ? data : c)));
  };

  return (
    <div className="page-padding">
      <div className="tabs">
        {['all', 'open', 'pending', 'resolved'].map((t) => (
          <button
            key={t}
            type="button"
            className={`tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <button type="button" className="btn-primary dashboard-stack-margin" onClick={() => openComplaintModal?.()}>
        File Complaint
      </button>
      <div className="dashboard-stack-margin">
        {filtered.map((c) => (
          <ComplaintCard key={c._id} complaint={c} onResolve={resolve} />
        ))}
        {filtered.length === 0 ? (
          <div className="empty-hint">No complaints in this view.</div>
        ) : null}
      </div>
    </div>
  );
}
