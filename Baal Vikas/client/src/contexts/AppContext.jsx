import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { requestJSON, login as apiLogin, register as apiRegister, fetchAllData } from '../api';
import { seedDefaultData } from '../utils/seedData';
import { syncAllFromDB, queueSyncToDB } from '../utils/dbSync';

const API_BASE = 'http://127.0.0.1:8011/api';

const AppContext = createContext(null);

export const ROLES = {
  admin: { name: 'Admin User', role: 'Administrator', avi: 'AD', color: 'var(--primary)', pages: ['dashboard', 'students', 'detection', 'leaderboard', 'messages', 'complaints', 'schools', 'fees', 'attendanceReports'], cta: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:text-bottom;margin-right:6px"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" x2="20" y1="8" y2="14"/><line x1="23" x2="17" y1="11" y2="11"/></svg> Register Student', ctaFn: 'openStudentModal', school: 'Sunrise Montessori' },
  teacher: { name: 'Ms. Anika Roy', role: 'Teacher · Room 3', avi: 'AR', color: 'var(--sky)', pages: ['dashboard', 'students', 'detection', 'leaderboard', 'messages', 'complaints', 'attendanceReports'], cta: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:text-bottom;margin-right:6px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Award Points', ctaFn: 'openAwardModal', school: 'Room 3 — Sunflower Class' },
  parent: { name: 'Mrs. Lena Kim', role: 'Parent of Liam K.', avi: 'LK', color: 'var(--coral)', pages: ['myChild', 'detection', 'messages', 'complaints', 'fees', 'attendanceReports'], cta: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:text-bottom;margin-right:6px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg> File Complaint', ctaFn: 'openComplaintModal', school: 'Sunrise Montessori' },
};

export const NAV_DEFS = {
  dashboard: { label: 'Dashboard', icon: 'LayoutDashboard', section: 'Overview' },
  students: { label: 'Students', icon: 'Users', section: 'Overview' },
  detection: { label: 'Detection', icon: 'Video', section: 'Overview' },
  leaderboard: { label: 'Leaderboard', icon: 'Trophy', section: 'Engagement' },
  messages: { label: 'Messages', icon: 'MessageSquare', section: 'Engagement' },
  complaints: { label: 'Complaints', icon: 'ClipboardList', section: 'Engagement' },
  schools: { label: 'Schools', icon: 'School', section: 'Admin' },
  myChild: { label: 'My Child', icon: 'Star', section: 'Overview' },
  fees: { label: 'Fees', icon: 'CreditCard', section: 'Finance' },
  attendanceReports: { label: 'Attendance', icon: 'ClipboardCheck', section: 'Overview' },
};

export function AppProvider({ children }) {
  seedDefaultData();
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentRole, setCurrentRole] = useState('admin');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentMsgId, setCurrentMsgId] = useState(() => {
    try { return localStorage.getItem('axion_current_msg_id') || null; } catch { return null; }
  });
  const [currentMsgRoleFilter, setCurrentMsgRoleFilter] = useState('all');
  const [currentStudentFilter, setCurrentStudentFilter] = useState('all');
  const [currentComplaintFilter, setCurrentComplaintFilter] = useState('all');
  const [currentFeeFilter, setCurrentFeeFilter] = useState('all');
  const [escalatedIds, setEscalatedIds] = useState(new Set());
  const [readNotifIds, setReadNotifIds] = useState(new Set());
  const [deletedConversationIds, setDeletedConversationIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('axion_deleted_conversations'))); } catch { return new Set(); }
  });
  const [allEligibleUsers, setAllEligibleUsers] = useState([]);
  const [currentLBFilter, setCurrentLBFilter] = useState('today');
  const lbCacheRef = useRef({});

  // Data state — start empty, populate from backend or cache
  const [students, setStudents] = useState(() => {
    try { const c = localStorage.getItem('axion_students_cache'); return c ? JSON.parse(c) : []; } catch { return []; }
  });
  const [complaints, setComplaints] = useState(() => {
    try { const c = localStorage.getItem('axion_complaints'); return c ? JSON.parse(c) : []; } catch { return []; }
  });
  const [messages, setMessages] = useState(() => {
    try {
      const deleted = new Set(JSON.parse(localStorage.getItem('axion_deleted_conversations')));
      const msgs = JSON.parse(localStorage.getItem('axion_messages')) || [];
      // Filter out deleted messages and legacy messages without participants
      return msgs.filter(m => !deleted.has(m.id) && m.participants && Array.isArray(m.participants));
    } catch { return []; }
  });
  const [schools, setSchools] = useState(() => {
    try { const v = localStorage.getItem('axion_schools'); return v ? JSON.parse(v) : []; } catch { return []; }
  });
  const [activities, setActivities] = useState(() => {
    try { const v = localStorage.getItem('axion_activities'); return v ? JSON.parse(v) : []; } catch { return []; }
  });
  const [fees, setFees] = useState(() => {
    try { const v = localStorage.getItem('axion_fees'); return v ? JSON.parse(v) : []; } catch { return []; }
  });

  // UI state
  const [notificationDot, setNotificationDot] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedChildId, setSelectedChildId] = useState(() => {
    try { return localStorage.getItem('axion_child_id_default'); } catch { return null; }
  });

  // Attendance
  const [attendanceData, setAttendanceData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('axion_attendance')) || {}; } catch { return {}; }
  });
  const [attendanceDraft, setAttendanceDraft] = useState({});

  // Auto-update notification dot on data changes
  const refreshNotifDot = useCallback(() => {
    let has = false;
    for (const m of messages) { if (m.unread) { has = true; break; } }
    if (!has) for (const c of complaints) { if (c.status === 'open') { has = true; break; } }
    if (!has) for (const f of fees) { if (f.status === 'overdue') { has = true; break; } }
    if (!has) { const today = new Date().toISOString().slice(0, 10); const rec = attendanceData[today] || {}; for (const s of students) { if (rec[s.id] === 'absent') { has = true; break; } } }
    setNotificationDot(has);
  }, [messages, complaints, fees, students, attendanceData, setNotificationDot]);

  useEffect(() => { refreshNotifDot(); }, [refreshNotifDot]);

  const markAllMessagesRead = useCallback(() => {
    setMessages(prev => prev.map(m => ({ ...m, unread: false })));
  }, []);

  // Rewards
  const [awardedRewards, setAwardedRewards] = useState(() => {
    try { return JSON.parse(localStorage.getItem('axion_awarded_rewards')) || []; } catch { return []; }
  });
  const [selectedGiveRewardTier, setSelectedGiveRewardTier] = useState('gold');
  const [rewardTiers, setRewardTiers] = useState(() => {
    try {
      const saved = localStorage.getItem('axion_reward_tiers');
      return saved ? JSON.parse(saved) : {
        gold: { title: 'Gold Trophy', desc: 'Star sticker on class chart + 10 min extra recess + certificate of excellence' },
        silver: { title: 'Silver Award', desc: "Choose the class's afternoon activity + homework pass (1 day)" },
        bronze: { title: 'Bronze Badge', desc: 'Full homework pass for the week + recognition at morning circle' },
      };
    } catch {
      return {
        gold: { title: 'Gold Trophy', desc: 'Star sticker on class chart + 10 min extra recess + certificate of excellence' },
        silver: { title: 'Silver Award', desc: "Choose the class's afternoon activity + homework pass (1 day)" },
        bronze: { title: 'Bronze Badge', desc: 'Full homework pass for the week + recognition at morning circle' },
      };
    }
  });

  // Toast
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  }, []);

  // Browser notifications API
  const pushNotif = useCallback((title, body) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => { if (p === 'granted') new Notification(title, { body, icon: '/favicon.ico' }); });
    }
  }, []);

  const openModal = useCallback((id, data) => {
    setActiveModal(id);
    setModalData(data || null);
  }, []);
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
  }, []);

  // Data refresh — prefer backend, fall back to DB blobs, then localStorage
  const refreshData = useCallback(async () => {
    try {
      const data = await fetchAllData();
      if (data.messages && data.messages.length > 0) {
        const deleted = new Set(JSON.parse(localStorage.getItem('axion_deleted_conversations')));
        setMessages(data.messages.filter(m => !deleted.has(m.id)));
      }
      if (data.complaints && data.complaints.length > 0) setComplaints(data.complaints);
      if (data.students && data.students.length > 0) {
        try { const cached = localStorage.getItem('axion_students_cache'); if (!cached || JSON.parse(cached).length === 0) { setStudents(data.students); localStorage.setItem('axion_students_cache', JSON.stringify(data.students)); } } catch { setStudents(data.students); }
      }
      if (data.schools && data.schools.length > 0) setSchools(data.schools);
      if (data.activities && data.activities.length > 0) setActivities(data.activities);
      if (data.fees && data.fees.length > 0) setFees(data.fees);
    } catch (e) {
      console.warn('Backend API unavailable, trying DB blobs:', e.message);
      // Try to restore from DB blobs (persisted in MongoDB)
      const restored = await syncAllFromDB();
      if (restored > 0) console.log(`Restored ${restored} data blobs from DB`);
      // Fall back to localStorage
      try { const v = localStorage.getItem('axion_messages'); if (v) { const deleted = new Set(JSON.parse(localStorage.getItem('axion_deleted_conversations'))); setMessages(JSON.parse(v).filter(m => !deleted.has(m.id) && m.participants && Array.isArray(m.participants))); } } catch {}
      try { const v = localStorage.getItem('axion_students_cache'); if (v) setStudents(JSON.parse(v)); } catch {}
      try { const v = localStorage.getItem('axion_complaints'); if (v) setComplaints(JSON.parse(v)); } catch {}
      try { const v = localStorage.getItem('axion_fees'); if (v) setFees(JSON.parse(v)); } catch {}
      try { const v = localStorage.getItem('axion_activities'); if (v) setActivities(JSON.parse(v)); } catch {}
      try { const v = localStorage.getItem('axion_schools'); if (v) setSchools(JSON.parse(v)); } catch {}
    }
  }, []);

  // Session restore on mount — only sets role/user from saved profile, does NOT auto-login
  useEffect(() => {
    const savedProfile = localStorage.getItem('axion_profile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setCurrentRole(profile.role);
        setUser(profile.user);
      } catch (e) {
        localStorage.removeItem('axion_profile');
      }
    }
  }, []);

  // Cross-tab real-time sync via localStorage events
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'axion_messages') { try { const deleted = new Set(JSON.parse(localStorage.getItem('axion_deleted_conversations'))); setMessages(JSON.parse(e.newValue || '[]').filter(m => !deleted.has(m.id) && m.participants && Array.isArray(m.participants))); } catch {} }
      if (e.key === 'axion_attendance') { try { setAttendanceData(JSON.parse(e.newValue || '{}')); } catch {} }
      if (e.key === 'axion_students_cache') { try { setStudents(JSON.parse(e.newValue || '[]')); } catch {} }
      if (e.key === 'axion_awarded_rewards') { try { setAwardedRewards(JSON.parse(e.newValue || '[]')); } catch {} }
      if (e.key === 'axion_complaints') { try { setComplaints(JSON.parse(e.newValue || '[]')); } catch {} }
      if (e.key === 'axion_announcements') { try { setAnnouncements(JSON.parse(e.newValue || '[]')); } catch {} }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Auto-refresh when tab becomes visible
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') refreshData(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [refreshData]);

  // Save a profile to the multi-account list (deduplicate by email)
  const addSavedProfile = useCallback((email, role, userData) => {
    try {
      const list = JSON.parse(localStorage.getItem('axion_saved_profiles')) || [];
      const filtered = list.filter(p => p.email !== email);
      filtered.unshift({ email, role, name: userData.name, avi: userData.name?.substring(0, 2).toUpperCase() || '??' });
      localStorage.setItem('axion_saved_profiles', JSON.stringify(filtered.slice(0, 10)));
    } catch {}
  }, []);

  // Login / Register / Logout
  const doLogin = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    localStorage.setItem('axion_token', data.token);
    const profile = { role: data.user.role.toLowerCase(), user: data.user };
    localStorage.setItem('axion_profile', JSON.stringify(profile));
    localStorage.setItem('axion_last_email', email);
    if (password) localStorage.setItem('axion_last_pass', password);
    setCurrentRole(data.user.role.toLowerCase());
    setUser(data.user);
    setCurrentMsgId(null);
    setAllEligibleUsers([]);
    addSavedProfile(email, data.user.role.toLowerCase(), data.user);
    await refreshData();
    setIsLoggedIn(true);
  }, [refreshData, addSavedProfile]);

  // Persist data to localStorage + sync to MongoDB
  useEffect(() => { if (messages.length > 0) try { localStorage.setItem('axion_messages', JSON.stringify(messages)); queueSyncToDB('axion_messages', messages); } catch {} }, [messages]);
  useEffect(() => { try { localStorage.setItem('axion_current_msg_id', currentMsgId); } catch {} }, [currentMsgId]);
  useEffect(() => { if (students.length > 0) try { localStorage.setItem('axion_students_cache', JSON.stringify(students)); queueSyncToDB('axion_students_cache', students); } catch {} }, [students]);
  useEffect(() => { if (complaints.length > 0) try { localStorage.setItem('axion_complaints', JSON.stringify(complaints)); queueSyncToDB('axion_complaints', complaints); } catch {} }, [complaints]);
  useEffect(() => { try { localStorage.setItem('axion_fees', JSON.stringify(fees)); queueSyncToDB('axion_fees', fees); } catch {} }, [fees]);
  useEffect(() => { try { localStorage.setItem('axion_activities', JSON.stringify(activities)); queueSyncToDB('axion_activities', activities); } catch {} }, [activities]);
  useEffect(() => { try { localStorage.setItem('axion_schools', JSON.stringify(schools)); queueSyncToDB('axion_schools', schools); } catch {} }, [schools]);

  const doRegister = useCallback(async (name, email, password, role) => {
    await apiRegister(name, email, password, role);
  }, []);

  const doLogout = useCallback(() => {
    localStorage.removeItem('axion_token');
    setIsLoggedIn(false);
    setUser(null);
    setCurrentMsgId(null);
    setCurrentPage('dashboard');
    setAllEligibleUsers([]);
  }, [setAllEligibleUsers]);

  // Navigation
  const navTo = useCallback((pid) => {
    setCurrentPage(pid);
    setCurrentMsgId(null);
    if (pid === 'fees') {
      loadFeesData();
    }
  }, []);

  // API helpers for data operations
  const submitStudent = useCallback(async (payload) => {
    const student = {
      id: 'std-' + Date.now(), name: `${payload.firstName} ${payload.lastName}`,
      init: ((payload.firstName?.[0] || '') + (payload.lastName?.[0] || '')).toUpperCase() || '??',
      age: payload.age || 5, class: payload.className || 'Room 3 — Sunflower Class',
      pts: 0, pct: 0, rank: students.length + 1,
      bg: '#E0F2FE', col: '#0E7490',
      parentName: payload.parentName || null, parentEmail: payload.parentEmail || null,
    };
    setStudents([...students, student]);
    showToast('Student registered successfully!');
    closeModal();
    try {
      await requestJSON(`${API_BASE}/students`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (e) {
      console.warn('Backend sync failed:', e.message);
    }
  }, [students, showToast, closeModal]);

  const submitAward = useCallback(async (payload) => {
    const selected = students.find(s => s.name === payload.studentId) || students[0];
    if (selected) {
      const pts = payload.points || 5;
      selected.pts = (selected.pts || 0) + pts;
      selected.pct = Math.min(100, (selected.pct || 0) + 2);
      setStudents([...students]);
      const activity = { id: 'act-' + Date.now(), title: `Awarded ${pts} points to ${selected.name}`, desc: payload.source || 'Teacher Award', time: 'Just now', timeLabel: 'Just now' };
      setActivities([activity, ...activities]);
    }
    showToast('Points awarded successfully!');
    closeModal();
    try {
      await requestJSON(`${API_BASE}/students/${selected?.id}/award`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (e) {
      console.warn('Backend sync failed:', e.message);
    }
  }, [students, activities, showToast, closeModal]);

  const submitComplaint = useCallback(async (payload) => {
    if (!payload.subject || !payload.subject.trim()) {
      showToast('Subject is required');
      return;
    }
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const complaint = {
      id: 'comp-' + Date.now(),
      title: payload.subject, desc: payload.details || 'No details provided.',
      status: 'open', type: 'general', priority: (payload.priority || 'Medium').toLowerCase(),
      student: payload.student || null, by: user?.name || currentRole, time: now,
      replies: [],
    };
    setComplaints([complaint, ...complaints]);
    showToast('Complaint filed successfully!');
    closeModal();
    try {
      await requestJSON(`${API_BASE}/complaints`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (e) {
      console.warn('Backend sync failed:', e.message);
    }
  }, [complaints, user, currentRole, showToast, closeModal]);

  const submitEditStudent = useCallback(async (id, payload) => {
    const s = students.find(x => x.id === id);
    if (s) {
      s.name = `${payload.firstName} ${payload.lastName}`;
      s.init = `${payload.firstName[0]}${payload.lastName[0]}`.toUpperCase();
      s.class = payload.className;
      if (payload.age) s.age = payload.age;
      if (payload.parentName !== undefined) s.parentName = payload.parentName || null;
      if (payload.parentEmail !== undefined) s.parentEmail = payload.parentEmail || null;
      if (payload.medicalNotes !== undefined) s.medicalNotes = payload.medicalNotes || null;
      setStudents([...students]);
    }
    closeModal();
    showToast('✓ Student updated');
    try {
      await requestJSON(`${API_BASE}/students/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (e) {
      console.warn('Edit student sync failed:', e.message);
    }
  }, [students, showToast, closeModal]);

  const deleteStudent = useCallback(async (id, name) => {
    closeModal();
    const confirmed = window.confirm(`Remove ${name} from the system? This cannot be undone.`);
    if (!confirmed) return;
    setStudents(students.filter(x => x.id !== id));
    showToast(`🗑 ${name} removed`);
    try {
      await requestJSON(`${API_BASE}/students/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Delete student sync failed:', e.message);
    }
  }, [students, showToast, closeModal]);

  const saveParentDetails = useCallback(async (id, parentName, parentEmail) => {
    const s = students.find(x => x.id === id);
    if (s) {
      s.parentName = parentName || null;
      s.parentEmail = parentEmail || null;
      setStudents([...students]);
    }
    closeModal();
    showToast('✓ Parent details updated');
    try {
      await requestJSON(`${API_BASE}/students/${id}/parent`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentName, parentEmail }) });
    } catch (e) {
      console.warn('Parent update failed:', e.message);
    }
  }, [students, showToast, closeModal]);

  const selectMyChild = useCallback(async (studentId) => {
    const storageKey = 'axion_child_id_default';
    const prevId = localStorage.getItem(storageKey);
    if (prevId && prevId !== studentId) {
      const prev = students.find(x => x.id === prevId);
      if (prev) { prev.parentName = null; prev.parentEmail = null; setStudents([...students]); }
      requestJSON(`${API_BASE}/students/${prevId}/parent`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentName: null, parentEmail: null }) }).catch(() => {});
    }
    localStorage.setItem(storageKey, studentId);
    setSelectedChildId(studentId);
    const s = students.find(x => x.id === studentId);
    if (s) {
      const name = document.getElementById('user-name')?.textContent || '';
      const email = document.getElementById('user-name')?.dataset?.email || '';
      if (name) s.parentName = name;
      if (email) s.parentEmail = email;
      setStudents([...students]);
    }
    closeModal();
    showToast('✓ Child profile updated');
    try {
      await requestJSON(`${API_BASE}/students/${studentId}/parent`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentName: s?.parentName || undefined, parentEmail: s?.parentEmail || undefined }) });
      const data = await fetchAllData();
      if (data.students?.length) setStudents(data.students);
    } catch (e) {
      console.warn('Parent link sync failed:', e.message);
    }
  }, [students, showToast, closeModal]);

  const registerSchool = useCallback(async (payload) => {
    if (!payload.name) { showToast('School name is required.'); return; }
    try {
      await requestJSON(`${API_BASE}/schools`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      showToast('School registered successfully!');
      await refreshData();
    } catch (e) {
      showToast('Error: ' + e.message);
    }
  }, [showToast, refreshData]);

  const submitEditSchool = useCallback(async (id, payload) => {
    const s = schools.find(x => x.id === id);
    if (s) {
      s.name = payload.name;
      if (payload.location !== undefined) s.location = payload.location || 'N/A';
      if (payload.principalName !== undefined) s.principalName = payload.principalName;
      if (payload.contactEmail !== undefined) s.contactEmail = payload.contactEmail;
      if (payload.classrooms !== undefined) s.rooms = payload.classrooms;
      if (payload.teachers !== undefined) s.teachers = payload.teachers;
      if (payload.phone !== undefined) s.phone = payload.phone;
      if (payload.address !== undefined) s.address = payload.address;
      if (payload.notes !== undefined) s.notes = payload.notes;
      setSchools([...schools]);
    }
    closeModal();
    showToast('✓ School updated');
    try {
      await requestJSON(`${API_BASE}/schools/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (e) {
      showToast('Saved locally — sync failed: ' + e.message);
    }
  }, [schools, showToast, closeModal]);

  const resolveComplaint = useCallback(async (id) => {
    const c = complaints.find(x => x.id === id);
    if (!c) return;
    c.status = 'resolved';
    setComplaints([...complaints]);
    showToast('✓ Complaint resolved');
    try {
      await requestJSON(`${API_BASE}/complaints/${id}/resolve`, { method: 'PATCH' });
    } catch (e) {
      console.warn('Resolve backend sync failed:', e.message);
    }
  }, [complaints, showToast]);

  const escalateComplaint = useCallback(async (id) => {
    const c = complaints.find(x => x.id === id);
    if (!c) return;
    if (escalatedIds.has(id) || c.status === 'escalated') {
      showToast('Already escalated');
      return;
    }
    c.priority = 'high';
    c.status = 'escalated';
    setEscalatedIds(new Set([...escalatedIds, id]));
    setComplaints([...complaints]);
      showToast('Complaint escalated — marked as High priority');
    try {
      await requestJSON(`${API_BASE}/complaints/${id}/escalate`, { method: 'PATCH' });
    } catch (e) {
      console.warn('Escalate backend sync failed:', e.message);
    }
  }, [complaints, escalatedIds, showToast]);

  const submitTicketReply = useCallback(async (id, text) => {
    if (!text) return;
    const c = complaints.find(x => x.id === id);
    if (!c || c.status === 'resolved') return;
    const userName = user?.name || currentRole;
    const newReply = { id: 'temp-' + Date.now(), authorName: userName, authorRole: currentRole, text, time: 'Now' };
    if (!c.replies) c.replies = [];
    c.replies.push(newReply);
    if (currentRole === 'teacher' || currentRole === 'admin') {
      if (c.status === 'open' || c.status === 'escalated') c.status = 'in-progress';
    }
    setComplaints([...complaints]);
    try {
      await requestJSON(`${API_BASE}/complaints/${id}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    } catch (e) {
      console.warn('Reply backend sync failed:', e.message);
    }
  }, [complaints, user, currentRole]);

  const loadFeesData = useCallback(async () => {
    try {
      const data = await requestJSON(`${API_BASE}/fees`);
      if (data.items && data.items.length > 0) setFees(data.items);
    } catch (e) {
      console.warn('Could not load fees from backend:', e.message);
    }
  }, []);

  const submitAddFee = useCallback(async (payload) => {
    try {
      await requestJSON(`${API_BASE}/fees`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      showToast('Fee record added!');
      closeModal();
      await loadFeesData();
    } catch (e) {
      showToast('Error: ' + e.message);
    }
  }, [showToast, closeModal, loadFeesData]);

  const submitRecordPayment = useCallback(async (id, amountPaid, note) => {
    const fee = fees.find(f => f.id === id);
    if (fee) {
      if (!fee.payments) fee.payments = [];
      fee.payments.push({ amount: amountPaid, note: note || '', date: new Date().toISOString(), by: user?.name || 'Staff' });
      fee.amountPaid = (fee.amountPaid || 0) + amountPaid;
      fee.balance = fee.amount - fee.amountPaid;
      if (fee.balance <= 0) { fee.balance = 0; fee.status = 'paid'; fee.paidAt = new Date().toISOString(); }
      else if (fee.amountPaid > 0) fee.status = 'partial';
      setFees([...fees]);
    }
    try {
      await requestJSON(`${API_BASE}/fees/${id}/pay`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amountPaid, note: note || undefined }) });
    } catch (e) { console.warn('Payment sync failed:', e.message); }
    showToast('Payment recorded!');
    closeModal();
  }, [fees, user, showToast, closeModal]);

  const submitSendReminder = useCallback(async (id, message) => {
    try {
      const result = await requestJSON(`${API_BASE}/fees/${id}/remind`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: message || undefined }) });
      showToast(`Reminder sent to ${result.to}`);
      closeModal();
    } catch (e) {
      showToast('Error: ' + e.message);
    }
  }, [showToast, closeModal]);

  const deleteFeeRecord = useCallback(async (id) => {
    if (!window.confirm('Delete this fee record? This cannot be undone.')) return;
    try {
      await requestJSON(`${API_BASE}/fees/${id}`, { method: 'DELETE' });
      showToast('Fee record deleted.');
      setFees(fees.filter(f => f.id !== id));
    } catch (e) {
      showToast('Error: ' + e.message);
    }
  }, [fees, showToast]);

  const sendMsg = useCallback(async (text, fileData) => {
    if ((!text && !fileData) || !currentMsgId) return;
    setMessages(prev => prev.map(m => {
      if (m.id !== currentMsgId) return m;
      const entry = { from: 'out', text: text || '', time: 'Now', authorEmail: user?.email, authorId: user?.id };
      if (fileData) {
        entry.fileName = fileData.name;
        entry.fileType = fileData.type;
        entry.fileSize = fileData.size;
        const fileKey = 'file_' + Date.now() + '_' + fileData.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        try {
          const cache = JSON.parse(localStorage.getItem('axion_file_data') || '{}');
          cache[fileKey] = fileData.dataUrl;
          localStorage.setItem('axion_file_data', JSON.stringify(cache));
          queueSyncToDB('axion_file_data', cache);
        } catch {}
        entry.fileKey = fileKey;
        entry.text = text || `[File: ${fileData.name}]`;
      }
      return { ...m, chat: [...(m.chat || []), entry], preview: entry.text, time: 'Now', unread: false };
    }));
    showToast('Message sent');
    showToast('Message sent');
    try {
      await requestJSON(`${API_BASE}/messages/${currentMsgId}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from_dir: 'out', text: text || '', time: 'Now' }) });
    } catch (e) {
      console.warn('Message send sync failed:', e.message);
    }
  }, [messages, currentMsgId, showToast]);

  const editMessage = useCallback(async (msgId, chatIdx, newText) => {
    setMessages(messages.map(m => m.id === msgId ? { ...m, chat: m.chat.map((c, i) => i === chatIdx ? { ...c, text: newText, edited: true } : c) } : m));
    showToast('Message edited');
    try {
      await requestJSON(`${API_BASE}/messages/${msgId}/chat/${chatIdx}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: newText }) });
    } catch (e) {
      console.warn('Edit sync failed:', e.message);
    }
  }, [messages, showToast]);

  const deleteMessage = useCallback(async (msgId, chatIdx) => {
    setMessages(messages.map(m => m.id === msgId ? { ...m, chat: m.chat.filter((_, i) => i !== chatIdx) } : m));
    showToast('Message deleted');
    try {
      await requestJSON(`${API_BASE}/messages/${msgId}/chat/${chatIdx}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Delete sync failed:', e.message);
    }
  }, [messages, showToast]);

  const deleteConversation = useCallback(async (msgId) => {
    if (!window.confirm('Delete this entire conversation? This cannot be undone.')) return;
    setDeletedConversationIds(prev => {
      const next = new Set(prev);
      next.add(msgId);
      localStorage.setItem('axion_deleted_conversations', JSON.stringify([...next]));
      queueSyncToDB('axion_deleted_conversations', [...next]);
      return next;
    });
    setMessages(messages.filter(m => m.id !== msgId));
    if (currentMsgId === msgId) setCurrentMsgId(messages.find(m => m.id !== msgId)?.id || null);
    showToast('Conversation deleted');
    try {
      await requestJSON(`${API_BASE}/messages/${msgId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Delete conversation sync failed:', e.message);
    }
  }, [messages, currentMsgId, showToast]);

  // Teacher tags — stored in localStorage, pushed to student profile
  const [teacherTags, setTeacherTags] = useState(() => {
    try { return JSON.parse(localStorage.getItem('axion_teacher_tags')) || {}; } catch { return {}; }
  });

  const addTeacherTag = useCallback((studentId, tag) => {
    const updated = { ...teacherTags };
    if (!updated[studentId]) updated[studentId] = [];
    if (!updated[studentId].includes(tag)) {
      updated[studentId] = [...updated[studentId], tag];
      setTeacherTags(updated);
      try { localStorage.setItem('axion_teacher_tags', JSON.stringify(updated)); queueSyncToDB('axion_teacher_tags', updated); } catch {}
      showToast(`Tagged student: ${tag}`);
    }
  }, [teacherTags, showToast]);

  const removeTeacherTag = useCallback((studentId, tag) => {
    const updated = { ...teacherTags };
    if (updated[studentId]) {
      updated[studentId] = updated[studentId].filter(t => t !== tag);
      if (updated[studentId].length === 0) delete updated[studentId];
      setTeacherTags(updated);
      try { localStorage.setItem('axion_teacher_tags', JSON.stringify(updated)); queueSyncToDB('axion_teacher_tags', updated); } catch {}
    }
  }, [teacherTags]);

  // Teacher classroom assignments — stored in localStorage, keyed by teacher email
  const [classList, setClassList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('axion_class_list')) || []; } catch { return []; }
  });

  const addClass = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setClassList(prev => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed].sort();
      localStorage.setItem('axion_class_list', JSON.stringify(next));
      queueSyncToDB('axion_class_list', next);
      return next;
    });
  }, []);

  const removeClass = useCallback((name) => {
    setClassList(prev => {
      const next = prev.filter(c => c !== name);
      localStorage.setItem('axion_class_list', JSON.stringify(next));
      queueSyncToDB('axion_class_list', next);
      return next;
    });
  }, []);

  const getAllClasses = useCallback(() => {
    const fromStudents = [...new Set(students.map(s => s.class).filter(Boolean))];
    return [...new Set([...classList, ...fromStudents])].sort();
  }, [classList, students]);

  const [teacherClassrooms, setTeacherClassrooms] = useState(() => {
    try { return JSON.parse(localStorage.getItem('axion_teacher_classrooms')) || {}; } catch { return {}; }
  });

  const saveTeacherClassrooms = useCallback((data) => {
    setTeacherClassrooms(data);
    try { localStorage.setItem('axion_teacher_classrooms', JSON.stringify(data)); queueSyncToDB('axion_teacher_classrooms', data); } catch {}
  }, []);

  // Get classrooms a teacher is assigned to; defaults to all if none set
  const getTeacherClassrooms = useCallback((email) => {
    const assigned = teacherClassrooms[email];
    if (assigned && assigned.length > 0) return assigned;
    return null; // null = all classrooms
  }, [teacherClassrooms]);

  const startChatWith = useCallback(async (recipientId, recipientName, recipientRole) => {
    closeModal();
    const currentUserId = user?.id || (user?.email || '').replace(/[^a-z0-9]/gi, '_');
    const newMsg = {
      id: 'msg-' + Date.now(),
      participants: [currentUserId, recipientId],
      participantNames: {
        [currentUserId]: user?.name || 'Me',
        [recipientId]: recipientName
      },
      participantRoles: {
        [currentUserId]: currentRole?.toUpperCase() || 'USER',
        [recipientId]: recipientRole || 'Contact'
      },
      participantAvis: {
        [currentUserId]: (user?.name || 'Me').substring(0, 2).toUpperCase(),
        [recipientId]: recipientName.substring(0, 2).toUpperCase()
      },
      aColor: 'var(--sky-pale)',
      aText: 'var(--sky)',
      preview: 'No messages yet. Say hello!',
      time: 'Now',
      unread: false,
      chat: [],
      senderId: recipientId, // legacy fallback
      sender: recipientName, // legacy fallback
      role: recipientRole || 'Contact', // legacy fallback
      avi: recipientName.substring(0, 2).toUpperCase(), // legacy fallback
    };
    setMessages(prev => {
      const merged = [newMsg, ...prev];
      showToast(`Chat with ${recipientName} opened`);
      setCurrentMsgId(newMsg.id);
      return merged;
    });
    try {
      await requestJSON(`${API_BASE}/messages/new`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipientId, time: 'Now' }) });
      const data = await requestJSON(`${API_BASE}/messages`);
      if (data.items?.length) {
        setMessages(prev => {
          const serverSenderIds = new Set(data.items.map(m => m.senderId).filter(Boolean));
          const matched = data.items.find(m => m.senderId === recipientId);
          if (matched) setCurrentMsgId(matched.id);
          return [...prev.filter(m => !serverSenderIds.has(m.senderId)), ...data.items];
        });
      }
    } catch (e) {
      console.warn('Chat sync failed (using local):', e.message);
    }
  }, [showToast, closeModal, setCurrentMsgId]);

  // Build notifications
  const buildNotifications = useCallback(() => {
    const notifs = [];
    messages.forEach(m => {
      if (m.chat?.length > 0) {
        const last = m.chat[m.chat.length - 1];
        if (last.from === 'in') {
          notifs.push({ id: 'msg-' + m.id, unread: true });
        }
      }
    });
    complaints.forEach(c => {
      if (c.status === 'open' || c.status === 'pending') {
        notifs.push({ id: 'comp-' + c.id, unread: c.status === 'open' });
      }
    });
    const unreadCount = notifs.filter(n => n.unread && !readNotifIds.has(n.id)).length;
    setNotificationDot(unreadCount > 0);
  }, [messages, complaints, readNotifIds]);

  // Announcements — stored in localStorage for persistence
  const [announcements, setAnnouncements] = useState(() => {
    try { return JSON.parse(localStorage.getItem('axion_announcements')) || []; } catch { return []; }
  });

  const addAnnouncement = useCallback((title, body, targetRole) => {
    const a = { id: 'ann-' + Date.now(), title, body, targetRole: targetRole || 'all', by: user?.name || currentRole, time: new Date().toLocaleString(), createdAt: new Date().toISOString() };
    const updated = [a, ...announcements];
    setAnnouncements(updated);
    try { localStorage.setItem('axion_announcements', JSON.stringify(updated)); queueSyncToDB('axion_announcements', updated); } catch {}
    showToast('Announcement sent!');
    pushNotif('New Announcement', `${title} — ${by}`);
  }, [announcements, user, currentRole, showToast, pushNotif]);

  // Attendance helpers
  const todayStr = useCallback(() => new Date().toISOString().slice(0, 10), []);

  const saveAttendance = useCallback((dateStr, draft) => {
    const newData = { ...attendanceData, [dateStr]: draft };
    setAttendanceData(newData);
    try { localStorage.setItem('axion_attendance', JSON.stringify(newData)); queueSyncToDB('axion_attendance', newData); } catch {}
    const absentCount = Object.entries(draft).filter(([, v]) => v === 'absent').length;
    if (absentCount > 0) pushNotif('Attendance Alert', `${absentCount} student(s) marked absent today`);
    showToast('✓ Attendance saved for ' + new Date(dateStr + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }));
    closeModal();
  }, [attendanceData, showToast, closeModal, pushNotif, students]);

  const persistAwardedRewards = useCallback((rewards) => {
    try { localStorage.setItem('axion_awarded_rewards', JSON.stringify(rewards)); queueSyncToDB('axion_awarded_rewards', rewards); } catch {}
  }, []);

  // Leaderboard helpers
  const invalidateLBCache = useCallback(() => { lbCacheRef.current = {}; }, []);

  const getScaledLeaderboard = useCallback((period) => {
    if (lbCacheRef.current[period]) return lbCacheRef.current[period];
    if (period === 'today') {
      const list = students.slice().sort((a, b) => b.pts - a.pts).map((s, i) => ({ ...s, rank: i + 1 }));
      lbCacheRef.current[period] = list;
      return list;
    }
    const multipliers = { week: 5, month: 20 };
    const base = multipliers[period] || 1;
    const list = students.map(s => {
      const seed = [...(s.id + period)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const jitter = 0.85 + ((seed % 100) / 100) * 0.3;
      return { ...s, pts: Math.round(s.pts * base * jitter) };
    }).sort((a, b) => b.pts - a.pts).map((s, i) => ({ ...s, rank: i + 1 }));
    lbCacheRef.current[period] = list;
    return list;
  }, [students]);

  const roleConfig = ROLES[currentRole] || ROLES.admin;

  const value = {
    isLoggedIn, setIsLoggedIn, user, setUser, currentRole, setCurrentRole, roleConfig,
    currentPage, setCurrentPage, currentMsgId, setCurrentMsgId,
    currentMsgRoleFilter, setCurrentMsgRoleFilter,
    currentStudentFilter, setCurrentStudentFilter,
    currentComplaintFilter, setCurrentComplaintFilter,
    currentFeeFilter, setCurrentFeeFilter,
    escalatedIds, readNotifIds, setReadNotifIds,
    allEligibleUsers, setAllEligibleUsers,
    currentLBFilter, setCurrentLBFilter,
    selectedChildId, setSelectedChildId,
    selectedGiveRewardTier, setSelectedGiveRewardTier,

    students, setStudents, complaints, setComplaints,
    messages, setMessages, schools, setSchools,
    activities, setActivities, fees, setFees,
    announcements, setAnnouncements,

    notificationDot, setNotificationDot,
    notifOpen, setNotifOpen,
    activeModal, modalData, openModal, closeModal,
    toastMessage, showToast,
    attendanceData, setAttendanceData, attendanceDraft, setAttendanceDraft,
    awardedRewards, setAwardedRewards,
    rewardTiers, setRewardTiers,

    // Functions
    refreshData, doLogin, doRegister, logout: doLogout, navTo, buildNotifications,
    submitStudent, submitAward, submitComplaint,
    submitEditStudent, deleteStudent, saveParentDetails,
    selectMyChild,
    registerSchool, submitEditSchool,
    resolveComplaint, escalateComplaint, submitTicketReply,
    sendMsg, editMessage, deleteMessage, deleteConversation, startChatWith,
    submitAddFee, submitRecordPayment, submitSendReminder, deleteFeeRecord,
    loadFeesData,
    saveAttendance, todayStr, pushNotif,
    persistAwardedRewards,
    invalidateLBCache, getScaledLeaderboard,
    addAnnouncement, addSavedProfile,
    teacherTags, addTeacherTag, removeTeacherTag,
    teacherClassrooms, saveTeacherClassrooms, getTeacherClassrooms,
    classList, addClass, removeClass, getAllClasses,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
