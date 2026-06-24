import { Award, Star, Tag } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

function useStudentAvatar(studentId) {
  try { return JSON.parse(localStorage.getItem('axion_student_avatars'))?.[studentId] || null; } catch { return null; }
}

export default function StudentCard({ student, attendanceStatus }) {
  const { name = '', init = '??', class: sClass = '', age = '', pts = 0, pct = 0, rank = 0, bg, col, id } = student;
  const { teacherTags, openModal, setCurrentStudentFilter } = useApp();
  const tags = teacherTags?.[id] || [];
  const avatarSrc = useStudentAvatar(id);
  const rankColors = ['#f4a91f', '#8A9BAA', '#C07B45'];
  const rankBg = rank <= 3 ? rankColors[rank - 1] : 'rgba(0,0,0,0.08)';
  const barColor = pct >= 80 ? '#16a34a' : pct >= 50 ? '#eab308' : '#e11d48';
  const statusLabel = pct >= 80 ? 'Excellent' : pct >= 50 ? 'Fair' : 'Needs Attention';
  const statusBg = pct >= 80 ? '#f0fdf4' : pct >= 50 ? '#fefce8' : '#fff1f2';
  const statusCol = pct >= 80 ? '#16a34a' : pct >= 50 ? '#a16207' : '#be123c';
  const aviColor = col || '#2E7D6B';
  const aviBg = bg || '#e8f5e9';

  const attBadge = attendanceStatus === 'absent'
    ? <div style={{ position: 'absolute', top: 6, left: 6, background: '#e11d48', color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 20, letterSpacing: .5, boxShadow: '0 2px 6px rgba(225,29,72,0.3)', zIndex: 2 }}>ABSENT</div>
    : attendanceStatus === 'late'
    ? <div style={{ position: 'absolute', top: 6, left: 6, background: '#F4A929', color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 20, letterSpacing: .5, boxShadow: '0 2px 6px rgba(244,169,41,0.3)', zIndex: 2 }}>LATE</div>
    : attendanceStatus === 'present'
    ? <div style={{ position: 'absolute', top: 6, left: 6, background: '#16a34a', color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 20, letterSpacing: .5, boxShadow: '0 2px 6px rgba(22,163,74,0.3)', zIndex: 2 }}>PRESENT</div>
    : attendanceStatus === 'leave'
    ? <div style={{ position: 'absolute', top: 6, right: 6, background: '#3b82f6', color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 20, letterSpacing: .5, boxShadow: '0 2px 6px rgba(59,130,246,0.3)', zIndex: 2 }}>LEAVE</div>
    : null;

  return (
    <div className="student-card" style={{ position: 'relative', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
      {attBadge}
      <div style={{ padding: '20px 16px 0', textAlign: 'center', width: '100%' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: aviBg, color: aviColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, margin: '0 auto 8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {avatarSrc ? <img src={avatarSrc} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : init}
          </div>
          <div style={{ position: 'absolute', bottom: 6, right: -4, background: rankBg, color: rank <= 3 ? '#fff' : 'rgba(0,0,0,0.4)', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            {rank <= 3 ? <Award size={11} style={{ color: '#fff' }} /> : `#${rank}`}
          </div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 800 }}>{name}</div>
        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', fontWeight: 600, marginTop: 1 }}>{sClass} · Age {age}</div>
      </div>
      {tags.length > 0 ? (
        <div className="tag-scroll" style={{ padding: '6px 14px 0', overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex', gap: 4, justifyContent: 'center', width: '100%' }}>
          {tags.slice(0, 2).map(t => (
            <span key={t} style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: '#f0f0ff', color: '#6366f1', lineHeight: '16px', display: 'inline-block', whiteSpace: 'nowrap', flexShrink: 0, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t}
            </span>
          ))}
          {tags.length > 2 && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 10, background: '#e8e8ef', color: '#888', lineHeight: '16px', display: 'inline-block', whiteSpace: 'nowrap', flexShrink: 0 }}>
              +{tags.length - 2}
            </span>
          )}
        </div>
      ) : (
        <div style={{ padding: '6px 14px 0', display: 'flex', justifyContent: 'center', width: '100%', minHeight: 22 }}>
            <span onClick={e => { e.stopPropagation(); setCurrentStudentFilter(id); openModal('teacherTag', { studentId: id }); }}
            style={{ fontSize: 9, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: '#f5f5ff', color: '#a5a5d0', lineHeight: '16px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3, border: '1px dashed #d0d0ef' }}>
            <Tag size={10} /> Tag
          </span>
        </div>
      )}
      <div style={{ flex: 1 }} />
      <div style={{ padding: '10px 14px 14px', width: '100%' }}>
        <div style={{ width: '100%', marginBottom: 4 }}>
          <div className="stu-bar-wrap"><div className="stu-bar" style={{ width: `${20 + (pct / 100) * 80}%`, background: barColor }} /></div>
          <div className="stu-bar-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.4)', fontWeight: 700 }}>Behavior</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: barColor }}>{pct}%</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 800, color: '#8a6000' }}>
            <Star size={11} style={{ color: '#f4c844', fill: '#f4c844' }} /> {pts} pts
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: statusBg, color: statusCol, whiteSpace: 'nowrap', minWidth: 110, textAlign: 'center' }}>{statusLabel}</div>
        </div>
      </div>
    </div>
  );
}
