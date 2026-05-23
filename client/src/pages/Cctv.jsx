import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const CAMERAS = [
  { id: 'cam1', name: 'Main Entrance', room: 'all', type: 'public' },
  { id: 'cam2', name: 'Playground', room: 'all', type: 'public' },
  { id: 'cam3', name: 'Cafeteria', room: 'all', type: 'public' },
  { id: 'cam4', name: 'Room 1 — Daisy Class', room: 'Room 1 — Daisy Class', type: 'classroom' },
  { id: 'cam5', name: 'Room 2 — Tulip Class', room: 'Room 2 — Tulip Class', type: 'classroom' },
  { id: 'cam6', name: 'Room 3 — Sunflower Class', room: 'Room 3 — Sunflower Class', type: 'classroom' },
];

export default function Cctv() {
  const { user } = useAuth();
  
  const allowedCameras = useMemo(() => {
    if (['admin', 'head_admin', 'school_admin'].includes(user?.role)) {
      return CAMERAS;
    }
    if (user?.role === 'teacher') {
      return CAMERAS.filter(c => c.type === 'public' || c.room === user?.classroom);
    }
    if (user?.role === 'parent') {
      // Assuming parent has a child classroom, wait we don't have child classroom in user object
      // But we can just show public cameras for parents, or if we know the child's classroom we show it.
      // For now, let's just show public and one dummy classroom if child data is not fully populated here.
      return CAMERAS.filter(c => c.type === 'public');
    }
    return [];
  }, [user]);

  return (
    <div className="page-padding">
      <div className="card card-pad" style={{ marginBottom: '2rem' }}>
        <h2 className="title-font section-title">Live Security Feeds</h2>
        <p className="text-secondary">
          Select a camera to view its live feed. Note: Only authorized personnel can view classroom cameras.
        </p>
      </div>

      <div className="dashboard-grid">
        {allowedCameras.map(cam => (
          <div key={cam.id} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ background: '#000', color: '#fff', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="title-font" style={{ fontSize: '0.9rem' }}>{cam.name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--coral)', animation: 'pulse 2s infinite' }} />
                LIVE
              </span>
            </div>
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#111' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', flexDirection: 'column' }}>
                <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: '0.5rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"></path>
                </svg>
                <span>Camera Feed Connecting...</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
