import { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { GripVertical } from 'lucide-react';
import { queueSyncToDB } from '../utils/dbSync';

export default function DetectionPage() {
  const { currentRole, students, attendanceData, user, getTeacherClassrooms, hasAssignedClasses } = useApp();
  const [cameraOnline, setCameraOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const streamRef = useRef(null);
  const videoRefs = useRef({});
  const playgroundRef = useRef(null);
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

  const allFeedIds = ['playground', ...visibleClassrooms];
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

  const setStreamOnAll = () => {
    if (!streamRef.current) return;
    Object.keys(videoRefs.current).forEach(cn => {
      const el = videoRefs.current[cn];
      if (el && !el.srcObject) {
        el.srcObject = streamRef.current;
      }
    });
    if (playgroundRef.current && !playgroundRef.current.srcObject) {
      playgroundRef.current.srcObject = streamRef.current;
    }
  };

  const startCamera = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setStreamOnAll();
      setCameraOnline(true);
      setLoading(false);
    } catch (e) {
      setErrorMsg(e.message || 'Camera access denied');
      setLoading(false);
      setCameraOnline(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    Object.keys(videoRefs.current).forEach(cn => {
      const el = videoRefs.current[cn];
      if (el) el.srcObject = null;
    });
    if (playgroundRef.current) playgroundRef.current.srcObject = null;
    setCameraOnline(false);
  };

  useEffect(() => {
    startCamera();
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, []);

  useEffect(() => {
    if (cameraOnline) setStreamOnAll();
  }, [cameraOnline]);

  const setVideoRef = (cn) => (el) => {
    if (!el) return;
    videoRefs.current[cn] = el;
    if (streamRef.current && !el.srcObject) el.srcObject = streamRef.current;
  };

  const setPlaygroundRef = (el) => {
    if (!el) return;
    playgroundRef.current = el;
    if (streamRef.current && !el.srcObject) el.srcObject = streamRef.current;
  };

  if (currentRole === 'teacher' && !hasAssignedClasses(user?.email)) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text3)', opacity: 0.3 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        <p>You must be assigned to a class by the admin to access this feature.</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="page-title" style={{ margin: 0 }}>CCTV Monitoring</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {visibleClassrooms.map(cn => (
              <div key={cn} style={{ padding: '4px 10px', borderRadius: 6, background: cameraOnline ? '#f0fdf4' : 'var(--primary-pale)', color: cameraOnline ? '#16a34a' : 'var(--primary)', fontSize: 11, fontWeight: 700 }}>
                ● {cn.length > 20 ? cn.substring(0, 18) + '..' : cn}
              </div>
            ))}
            <div style={{ padding: '4px 10px', borderRadius: 6, background: cameraOnline ? '#fef3c7' : 'var(--primary-pale)', color: cameraOnline ? '#d97706' : 'var(--primary)', fontSize: 11, fontWeight: 700 }}>
              ● Playground
            </div>
          </div>
          {cameraOnline ? (
            <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 12 }} onClick={stopCamera}>Stop</button>
          ) : !loading ? (
            <button className="btn btn-sm" style={{ background: 'var(--primary-pale)', color: 'var(--primary)', fontWeight: 700, fontSize: 12 }} onClick={startCamera}>Retry Camera</button>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 12, marginBottom: 16 }}>
        {orderedFeeds.length === 0 ? (
          <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 14, fontWeight: 600 }}>
            No classrooms available for your role.
          </div>
        ) : orderedFeeds.map((id, idx) => {
          const isPlayground = id === 'playground';
          const cn = isPlayground ? null : id;
          const classStudents = cn ? (classes[cn] || []) : [];
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
                <div className="camera-box" style={{ margin: 0, borderRadius: 0, aspectRatio: 'unset', height: 400 }}>
                  <div className="cam-grid" />
                  <div className="cam-live-badge">● {cameraOnline ? 'LIVE' : loading ? 'STARTING...' : 'OFF'}</div>
                  <video
                    ref={isPlayground ? setPlaygroundRef : setVideoRef(cn)}
                    autoPlay playsInline muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div draggable onDragStart={() => handleDragStart(idx)} style={{ position: 'absolute', top: 8, right: 8, cursor: 'grab', color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: 4, display: 'flex' }}>
                  <GripVertical size={16} />
                </div>
              </div>
              <div style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{isPlayground ? 'Playground' : cn}</div>
                {isPlayground ? (
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>Outdoor play area — all access</div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, fontSize: 11, fontWeight: 600 }}>
                    <span style={{ color: '#16a34a' }}>{present} present</span>
                    <span style={{ color: '#dc2626' }}>{absentCount} absent</span>
                    {leave > 0 && <span style={{ color: '#a55eea' }}>{leave} leave</span>}
                    {unmarked > 0 && <span style={{ color: 'var(--text3)' }}>{unmarked} unmarked</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Status Overview</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 14 }}>
            {orderedFeeds.map(id => {
              const isPlayground = id === 'playground';
              const cn = isPlayground ? null : id;
              const classStudents = cn ? (classes[cn] || []) : [];
              const present = classStudents.filter(s => rec[s.id] === 'present' || rec[s.id] === 'late').length;
              const absentCount = classStudents.filter(s => rec[s.id] === 'absent').length;
              const leave = classStudents.filter(s => rec[s.id] === 'leave').length;
              return (
                <div key={id} className="detect-card" style={{ margin: 0 }}>
                  <div className="detect-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: cameraOnline ? '#16a34a' : '#dc2626', display: 'inline-block' }} />
                    {isPlayground ? 'Playground' : cn}
                  </div>
                  <div className="detect-value" style={{ fontSize: 20 }}>{isPlayground ? '—' : present}/{isPlayground ? '—' : classStudents.length}</div>
                  <div className="text-muted" style={{ marginTop: 2, fontSize: 10 }}>
                    {isPlayground ? 'Outdoor area' : `${absentCount} absent · ${leave} leave`}
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
              <div className="text-muted" style={{ marginTop: 2, fontSize: 10 }}>{visibleClassrooms.length} class{visibleClassrooms.length !== 1 ? 'es' : ''} + playground</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
