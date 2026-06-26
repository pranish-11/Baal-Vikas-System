import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { GripVertical, Smartphone, Link, Unlink } from 'lucide-react';
import { queueSyncToDB } from '../utils/dbSync';

export default function DetectionPage() {
  const {
    currentRole, students, attendanceData, user,
    getTeacherClassrooms, hasAssignedClasses,
    cameraOnline, setCameraOnline,
    connectedUrl, setConnectedUrl,
    networkUrl, setNetworkUrl
  } = useApp();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraOrder, setCameraOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('axion_camera_order')) || []; } catch { return []; }
  });
  const [dragIdx, setDragIdx] = useState(null);

  const dateStr = new Date().toISOString().slice(0, 10);
  const rec = attendanceData[dateStr] || {};

  const teacherAssigned = currentRole === 'teacher' ? getTeacherClassrooms(user?.email) : null;
  const parentChild = currentRole === 'parent' ? students.find(s => s.parentEmail && s.parentEmail.toLowerCase() === (user?.email || '').toLowerCase()) : null;

  let visibleStudents = students;
  if (teacherAssigned) visibleStudents = students.filter(s => teacherAssigned.includes(s.class));
  if (parentChild) visibleStudents = students.filter(s => s.class === parentChild.class);

  const classes = {};
  visibleStudents.forEach(s => {
    if (!classes[s.class]) classes[s.class] = [];
    classes[s.class].push(s);
  });
  const classrooms = Object.keys(classes);

  const canViewFeed = (className) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'teacher') {
      if (!teacherAssigned) return true;
      return teacherAssigned.includes(className);
    }
    if (currentRole === 'parent') {
      const child = students.find(s => s.parentEmail && s.parentEmail.toLowerCase() === (user?.email || '').toLowerCase());
      return child ? child.class === className : classrooms.length <= 1;
    }
    return false;
  };

  const visibleClassrooms = classrooms.filter(cn => canViewFeed(cn));

  const allFeedIds = [...visibleClassrooms];
  const orderedFeeds = [...new Set([...cameraOrder.filter(id => allFeedIds.includes(id)), ...allFeedIds.filter(id => !cameraOrder.includes(id))])];

  const persistOrder = (ids) => {
    localStorage.setItem('axion_camera_order', JSON.stringify(ids));
    queueSyncToDB('axion_camera_order', ids);
    setCameraOrder(ids);
  };

  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...orderedFeeds];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    persistOrder(reordered);
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const connectNetworkCamera = () => {
    if (!networkUrl.trim()) return;
    setLoading(true);
    setErrorMsg('');
    const url = networkUrl.trim();
    setConnectedUrl(url);
    localStorage.setItem('axion_connected_url', url);
    setCameraOnline(true);
    setLoading(false);
  };

  const disconnectCamera = () => {
    setConnectedUrl('');
    localStorage.removeItem('axion_connected_url');
    setCameraOnline(false);
    setErrorMsg('');
  };

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setNetworkUrl(val);
    localStorage.setItem('axion_network_url', val);
  };

  if (currentRole === 'teacher' && !hasAssignedClasses(user?.email)) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text3)', opacity: 0.3 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <p>You must be assigned to a class by the admin to access this feature.</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div className="page-title" style={{ margin: 0 }}>CCTV Monitoring</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="text"
              value={networkUrl}
              onChange={handleUrlChange}
              placeholder="http://192.168.x.x:8080/video"
              style={{
                padding: '5px 10px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border)',
                background: 'var(--bg)', color: 'var(--text)', width: 220, outline: 'none'
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') connectNetworkCamera(); }}
            />
            {connectedUrl ? (
              <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 12 }} onClick={disconnectCamera}>
                <Unlink size={14} style={{ marginRight: 4 }} /> Stop
              </button>
            ) : (
              <button className="btn btn-sm" style={{ background: 'var(--primary-pale)', color: 'var(--primary)', fontWeight: 700, fontSize: 12 }} onClick={connectNetworkCamera} disabled={loading}>
                <Link size={14} style={{ marginRight: 4 }} /> {loading ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>

        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 12, border: '1px solid #fecaca' }}>
          {errorMsg}
        </div>
      )}

      {!connectedUrl && (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 14, fontWeight: 600, background: 'var(--bg2)', borderRadius: 12, marginBottom: 12 }}>
          <Smartphone size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
          <div>Enter your mobile camera URL above and click <strong>Connect</strong></div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)', fontWeight: 400, maxWidth: 400, margin: '8px auto 0' }}>
            Install an IP camera app on your phone (e.g., "IP Webcam" on Android), start the server, and enter the URL shown in the app (e.g., http://192.168.x.x:8080/video)
          </div>
        </div>
      )}

      {connectedUrl && (
      <div className="cam-feed-grid stagger-enter">
        {orderedFeeds.length === 0 ? (
          <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 14, fontWeight: 600 }}>
            No classrooms available for your role.
          </div>
        ) : orderedFeeds.map((id, idx) => {
          const classStudents = classes[id] || [];
          const present = classStudents.filter(s => rec[s.id] === 'present' || rec[s.id] === 'late').length;
          const absentCount = classStudents.filter(s => rec[s.id] === 'absent').length;
          const leave = classStudents.filter(s => rec[s.id] === 'leave').length;
          const unmarked = classStudents.filter(s => !rec[s.id]).length;
          return (
            <div key={id} className="card" style={{ overflow: 'hidden' }}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
            >
              <div style={{ position: 'relative' }}>
                <div className="camera-box" style={{ margin: 0, borderRadius: 0, aspectRatio: 'unset', height: 400, position: 'relative' }}
                  data-mobile-height="240">
                  <div className="cam-grid" />
                  <div className="cam-live-badge">● {cameraOnline ? 'LIVE' : 'OFF'}</div>
                  <img
                    src={connectedUrl}
                    alt="Camera feed"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={() => { setErrorMsg('Failed to load stream'); setCameraOnline(false); }}
                  />
                </div>
                <div draggable onDragStart={() => handleDragStart(idx)} style={{ position: 'absolute', top: 8, right: 8, cursor: 'grab', color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: 4, display: 'flex' }}>
                  <GripVertical size={16} />
                </div>
              </div>
              <div style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{id}</div>
                <div style={{ display: 'flex', gap: 8, fontSize: 11, fontWeight: 600 }}>
                  <span style={{ color: '#16a34a' }}>{present} present</span>
                  <span style={{ color: '#dc2626' }}>{absentCount} absent</span>
                  <span style={{ color: '#3b82f6' }}>{leave} leave</span>
                  {unmarked > 0 && <span style={{ color: 'var(--text3)' }}>{unmarked} unmarked</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Status Overview</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 14 }}>
            {orderedFeeds.map(id => {
              const classStudents = classes[id] || [];
              const present = classStudents.filter(s => rec[s.id] === 'present' || rec[s.id] === 'late').length;
              const absentCount = classStudents.filter(s => rec[s.id] === 'absent').length;
              const leave = classStudents.filter(s => rec[s.id] === 'leave').length;
              return (
                <div key={id} className="detect-card" style={{ margin: 0 }}>
                  <div className="detect-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: cameraOnline ? '#16a34a' : '#dc2626', display: 'inline-block' }} />
                    {id}
                  </div>
                  <div className="detect-value" style={{ fontSize: 20 }}>{present}/{classStudents.length}</div>
                  <div className="text-muted" style={{ marginTop: 2, fontSize: 10 }}>
                    {absentCount} absent · {leave} leave
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            <div className="detect-card" style={{ margin: 0 }}>
              <div className="detect-label">Camera</div>
              <div className="detect-value" style={{ fontSize: 18, color: cameraOnline ? '#16a34a' : '#dc2626' }}>{cameraOnline ? 'Live' : 'Offline'}</div>
              <div className="text-muted" style={{ marginTop: 2, fontSize: 10 }}>{orderedFeeds.length} feed{orderedFeeds.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="detect-card" style={{ margin: 0 }}>
              <div className="detect-label">Total Students</div>
              <div className="detect-value" style={{ fontSize: 18, color: 'var(--primary)' }}>{visibleStudents.length}</div>
              <div className="text-muted" style={{ marginTop: 2, fontSize: 10 }}>across {classrooms.length} class{classrooms.length !== 1 ? 'es' : ''}</div>
            </div>
            <div className="detect-card" style={{ margin: 0 }}>
              <div className="detect-label">Present Today</div>
              <div className="detect-value" style={{ fontSize: 18, color: '#16a34a' }}>{visibleStudents.filter(s => rec[s.id] === 'present' || rec[s.id] === 'late').length}</div>
              <div className="text-muted" style={{ marginTop: 2, fontSize: 10 }}>{visibleStudents.filter(s => rec[s.id] === 'absent').length} absent</div>
            </div>
            <div className="detect-card" style={{ margin: 0 }}>
              <div className="detect-label">Role</div>
              <div className="detect-value" style={{ fontSize: 18, color: 'var(--coral)', textTransform: 'capitalize' }}>{currentRole}</div>
              <div className="text-muted" style={{ marginTop: 2, fontSize: 10 }}>{visibleClassrooms.length} class{visibleClassrooms.length !== 1 ? 'es' : ''}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
