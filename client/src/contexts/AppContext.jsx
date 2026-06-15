import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { requestJSON, login as apiLogin, register as apiRegister, fetchAllData } from '../api';
import { API_BASE, SOCKET_URL } from '../config';

const AppContext = createContext(null);

export const ROLES = {
  admin: { name: 'Admin User', role: 'Administrator', avi: 'AD', color: 'var(--primary)', pages: ['dashboard', 'students', 'detection', 'dailyLog', 'leaderboard', 'messages', 'complaints', 'attendanceReports'], cta: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:text-bottom;margin-right:6px"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" x2="20" y1="8" y2="14"/><line x1="23" x2="17" y1="11" y2="11"/></svg> Register Student', ctaFn: 'openStudentModal', school: '' },
  teacher: { name: 'Teacher', role: 'Teacher', avi: 'TC', color: 'var(--sky)', pages: ['dashboard', 'students', 'detection', 'dailyLog', 'leaderboard', 'messages', 'complaints', 'attendanceReports'], cta: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:text-bottom;margin-right:6px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Award Points', ctaFn: 'openAwardModal', school: '' },
  parent: { name: 'Parent', role: 'Parent', avi: 'PA', color: 'var(--coral)', pages: ['dashboard', 'myChild', 'detection', 'messages', 'complaints', 'attendanceReports'], cta: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:text-bottom;margin-right:6px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg> File Complaint', ctaFn: 'openComplaintModal', school: '' },
};

export const NAV_DEFS = {
  dashboard: { label: 'Dashboard', icon: 'LayoutDashboard', section: 'Overview' },
  students: { label: 'Students', icon: 'Users', section: 'Overview' },
  detection: { label: 'Detection', icon: 'Video', section: 'Overview' },
  dailyLog: { label: 'Daily Log', icon: 'Notebook', section: 'Overview' },
  leaderboard: { label: 'Leaderboard', icon: 'Trophy', section: 'Engagement' },
  messages: { label: 'Messages', icon: 'MessageSquare', section: 'Engagement' },
  complaints: { label: 'Complaints', icon: 'ClipboardList', section: 'Engagement' },
  myChild: { label: 'My Child', icon: 'Star', section: 'Overview' },
  attendanceReports: { label: 'Attendance', icon: 'ClipboardCheck', section: 'Overview' },
};

export function AppProvider({ children }) {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentRole, setCurrentRole] = useState('admin');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentMsgId, setCurrentMsgId] = useState(null);
  const [currentMsgRoleFilter, setCurrentMsgRoleFilter] = useState('all');
  const [currentStudentFilter, setCurrentStudentFilter] = useState('all');
  const [currentComplaintFilter, setCurrentComplaintFilter] = useState('all');
  const [escalatedIds, setEscalatedIds] = useState(new Set());
  const [readNotifIds, setReadNotifIds] = useState(new Set());
  const [deletedConversationIds, setDeletedConversationIds] = useState(new Set());
  const deletedRef = useRef(deletedConversationIds);
  deletedRef.current = deletedConversationIds;
  const [allEligibleUsers, setAllEligibleUsers] = useState([]);
  const [currentLBFilter, setCurrentLBFilter] = useState('today');
  const lbCacheRef = useRef({});

  // Data state — start empty, populate from backend via refreshData
  const [students, setStudents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activities, setActivities] = useState([]);

  // UI state
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedChildId, setSelectedChildId] = useState(null);

  // Attendance
  const [attendanceData, setAttendanceData] = useState({});
  const [attendanceDraft, setAttendanceDraft] = useState({});
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dailyLogs, setDailyLogs] = useState({});

  // Fetch real notification count from server
  const refreshNotifCount = useCallback(() => {
    if (!user?.id) return;
    requestJSON(`${API_BASE}/notifications`).then(res => {
      if (res) setNotifCount(res.unread || 0);
    }).catch(() => {});
  }, [user]);

  useEffect(() => { refreshNotifCount(); }, [refreshNotifCount]);

  const markAllMessagesRead = useCallback(() => {
    setMessages(prev => prev.map(m => ({ ...m, unread: false })));
    const token = localStorage.getItem('axion_token');
    if (token) {
      fetch(`${API_BASE}/messages/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }, []);

  // noop


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

  // Socket.IO for real-time messaging
  const socketRef = useRef(null);
  const replyInFlightRef = useRef(false);



  useEffect(() => {
    const uid = user?.id || user?._id;
    if (!uid) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('identify', uid, user?.email);
      socket.emit('join', uid);
    });

      socket.on('new_message', (data) => {
        const { threadId, chatId, message } = data;
        if (!threadId || !message) return;
        setMessages(prev => {
          const idx = prev.findIndex(m => m.id === threadId);
          if (idx === -1) {
            // Unknown thread — trigger a background refresh to pull it in
            setTimeout(() => {
              requestJSON(`${API_BASE}/messages`)
                .then(res => {
                  const freshThreads = res.items || [];
                  if (freshThreads.length > 0) {
                    setMessages(current => {
                      const currentIds = new Set(current.map(m => m.id));
                      const newOnes = freshThreads.filter(t => !deletedRef.current.has(t.id) && !currentIds.has(t.id));
                      if (newOnes.length === 0) return current;
                      return [...newOnes, ...current];
                    });
                  }
                })
                .catch(() => {});
            }, 300);
            return prev;
          }
        const m = prev[idx];
        const chat = m.chat || [];
        const last = chat[chat.length - 1];
        if (last && last.text === message.text && last.time === message.time && (last.from === 'in' || last.from_dir === 'in')) {
          return prev;
        }
        const entry = {
          chatId: chatId || '',
          from: 'in',
          from_dir: 'in',
          text: message.text || '',
          time: message.time || 'Now',
          authorId: message.from,
          authorEmail: message.authorEmail || '',
        };
        const updated = { ...m };
        if (!updated.participants && updated.participantIds) {
          updated.participants = updated.participantIds;
        }
        return [
          ...prev.slice(0, idx),
          { ...updated, chat: [...chat, entry], preview: entry.text, time: entry.time, unread: true },
          ...prev.slice(idx + 1),
        ];
      });
    });

      socket.on('notification', (notif) => {
        refreshNotifCount();
      });

      socket.on('notifications-read', () => {
        refreshNotifCount();
      });

    socket.on('daily_logs_updated', () => {
      requestJSON(`${API_BASE}/data/axion_daily_logs`).then(blob => {
        if (blob && blob.data) setDailyLogs(blob.data);
      }).catch(() => {});
    });

    socket.on('attendance_updated', (data) => {
      const attDate = data?.date || new Date().toISOString().slice(0, 10);
      requestJSON(`${API_BASE}/attendance?date=${attDate}`).then(res => {
        if (res && res.records && Object.keys(res.records).length > 0) {
          setAttendanceData(prev => ({ ...prev, [attDate]: res.records }));
        }
      }).catch(() => {});
      refreshDataRef.current();
    });

    socket.on('complaints_updated', () => {
      if (replyInFlightRef.current) return;
      requestJSON(`${API_BASE}/complaints`).then(res => {
        if (res && res.items) setComplaints(res.items);
      }).catch(() => {});
    });

    socket.on('behaviour_updated', () => {
      refreshDataRef.current();
    });

    socket.on('award_updated', () => {
      refreshDataRef.current();
    });

    socket.on('disconnect', () => {});

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  const openModal = useCallback((id, data) => {
    setActiveModal(id);
    setModalData(data || null);
  }, []);
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
  }, []);

  // Data refresh — load all from backend API
  const refreshData = useCallback(async () => {
    try {
      const data = await fetchAllData();
      const deleted = deletedConversationIds;

      setMessages(prev => {
        const localOnly = prev.filter(m => m.id?.startsWith('msg-'));
        const backendThreads = (data.messages || []).filter(t => !deleted.has(t.id));
        const seen = new Set(localOnly.map(m => m.id));
        const merged = [...localOnly];
        for (const t of backendThreads) {
          if (!seen.has(t.id)) merged.push(t);
          seen.add(t.id);
        }
        return merged;
      });

      if (data.complaints && data.complaints.length > 0) setComplaints(data.complaints);
      if (data.students && data.students.length > 0) setStudents(data.students);
      if (data.activities && data.activities.length > 0) setActivities(data.activities);
      if (data.attendance && data.attendance.records && Object.keys(data.attendance.records).length > 0) {
        const backend = data.attendance.records;
        const dateKey = data.attendance.date || new Date().toISOString().slice(0, 10);
        setAttendanceData(prev => ({ ...prev, [dateKey]: backend }));
      }
      requestJSON(`${API_BASE}/data/axion_daily_logs`).then(blob => {
        if (blob && blob.data) setDailyLogs(blob.data);
      }).catch(() => {});
      requestJSON(`${API_BASE}/data/axion_teacher_tags`).then(blob => {
        if (blob && blob.data) setTeacherTags(blob.data);
      }).catch(() => {});
    } catch (e) {
      console.warn('Backend unavailable:', e.message);
    }
  }, [deletedConversationIds]);

  const refreshDataRef = useRef(refreshData);
  refreshDataRef.current = refreshData;

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

  // noop

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
  }, []);

  // API helpers for data operations
  const submitStudent = useCallback(async (payload) => {
    closeModal();
    try {
      const result = await requestJSON(`${API_BASE}/students`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (result && result.item) {
        setStudents(prev => [...prev, result.item]);
      }
      await refreshData();
      showToast('Student registered successfully!');
    } catch (e) {
      const student = {
        id: 'std-' + Date.now(), name: `${payload.firstName} ${payload.lastName}`,
        init: ((payload.firstName?.[0] || '') + (payload.lastName?.[0] || '')).toUpperCase() || '??',
        age: payload.age || 5, class: payload.className || '',
        pts: 0, pct: 0, rank: 0,
        bg: '#E0F2FE', col: '#0E7490',
        parentName: payload.parentName || null, parentEmail: payload.parentEmail || null,
      };
      setStudents(prev => [...prev, student]);
      showToast('Student registered (offline)');
    }
  }, [showToast, closeModal, refreshData]);

  const submitAward = useCallback(async (payload) => {
    const selected = students.find(s => s.name === payload.studentId) || students[0];
    closeModal();
    try {
      await requestJSON(`${API_BASE}/students/${selected?.id}/award`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      await refreshData();
      showToast('Points awarded successfully!');
    } catch (e) {
      if (selected) {
        const pts = payload.points || 5;
        selected.pts = Math.max(0, (selected.pts || 0) + pts);
        setStudents([...students]);
        const activity = { id: 'act-' + Date.now(), title: `Awarded ${pts} points to ${selected.name}`, desc: payload.source || 'Teacher Award', time: 'Just now', timeLabel: 'Just now' };
        setActivities([activity, ...activities]);
      }
      showToast('Points awarded (offline)');
    }
  }, [students, activities, showToast, closeModal, refreshData]);

  const submitComplaint = useCallback(async (payload) => {
    if (!payload.subject || !payload.subject.trim()) {
      showToast('Subject is required');
      return;
    }
    closeModal();
    try {
      await requestJSON(`${API_BASE}/complaints`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: payload.subject, desc: payload.details || '', priority: payload.priority, by: user?.name || currentRole, type: 'OTHER' }) });
      await refreshData();
      showToast('Complaint filed successfully!');
    } catch (e) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const complaint = {
        id: 'comp-' + Date.now(),
        title: payload.subject, desc: payload.details || 'No details provided.',
        status: 'open', type: 'general', priority: (payload.priority || 'Medium').toLowerCase(),
        student: payload.student || null, by: user?.name || currentRole, time: now,
        replies: [],
      };
      setComplaints([complaint, ...complaints]);
      showToast('Complaint filed (offline)');
    }
  }, [complaints, user, currentRole, showToast, closeModal, refreshData]);

  const submitEditStudent = useCallback(async (id, payload) => {
    closeModal();
    try {
      await requestJSON(`${API_BASE}/students/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      await refreshData();
      showToast('✓ Student updated');
    } catch (e) {
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
      showToast('✓ Student updated (offline)');
    }
  }, [students, showToast, closeModal, refreshData]);

  const deleteStudent = useCallback(async (id, name) => {
    closeModal();
    const confirmed = window.confirm(`Remove ${name} from the system? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await requestJSON(`${API_BASE}/students/${id}`, { method: 'DELETE' });
      await refreshData();
      showToast(`🗑 ${name} removed`);
    } catch (e) {
      setStudents(students.filter(x => x.id !== id));
      showToast(`🗑 ${name} removed (offline)`);
    }
  }, [students, showToast, closeModal, refreshData]);

  const saveParentDetails = useCallback(async (id, parentName, parentEmail) => {
    closeModal();
    try {
      await requestJSON(`${API_BASE}/students/${id}/parent`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentName, parentEmail }) });
      await refreshData();
      showToast('✓ Parent details updated');
    } catch (e) {
      const s = students.find(x => x.id === id);
      if (s) { s.parentName = parentName || null; s.parentEmail = parentEmail || null; setStudents([...students]); }
      showToast('✓ Parent details updated (offline)');
    }
  }, [students, showToast, closeModal, refreshData]);

  const selectMyChild = useCallback(async (studentId) => {
    setSelectedChildId(studentId);
    closeModal();
    const parentName = user?.name || '';
    const parentEmail = user?.email || '';
    try {
      await requestJSON(`${API_BASE}/students/${studentId}/parent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentName, parentEmail }),
      });
      await refreshData();
      showToast('✓ Child profile updated');
    } catch (e) {
      const s = students.find(x => x.id === studentId);
      if (s) { s.parentName = parentName || null; s.parentEmail = parentEmail || null; setStudents([...students]); }
      showToast('✓ Child profile updated (offline)');
    }
  }, [students, showToast, closeModal, user, refreshData]);

  const resolveComplaint = useCallback(async (id) => {
    try {
      await requestJSON(`${API_BASE}/complaints/${id}/resolve`, { method: 'PATCH' });
      await refreshData();
      showToast('✓ Complaint resolved');
    } catch (e) {
      const c = complaints.find(x => x.id === id);
      if (c) { c.status = 'resolved'; setComplaints([...complaints]); }
      showToast('✓ Complaint resolved (offline)');
    }
  }, [complaints, showToast, refreshData]);

  const escalateComplaint = useCallback(async (id) => {
    if (escalatedIds.has(id)) { showToast('Already escalated'); return; }
    try {
      await requestJSON(`${API_BASE}/complaints/${id}/escalate`, { method: 'PATCH' });
      setEscalatedIds(new Set([...escalatedIds, id]));
      await refreshData();
      showToast('Complaint escalated');
    } catch (e) {
      const c = complaints.find(x => x.id === id);
      if (c) { c.priority = 'high'; c.status = 'escalated'; setComplaints([...complaints]); }
      setEscalatedIds(new Set([...escalatedIds, id]));
      showToast('Complaint escalated (offline)');
    }
  }, [complaints, escalatedIds, showToast, refreshData]);

  const submitTicketReply = useCallback(async (id, text) => {
    if (!text) return;
    // Local complaints (comp- prefix) don't exist on backend — handle reply locally
    if (typeof id === 'string' && id.startsWith('comp-')) {
      const c = complaints.find(x => x.id === id);
      if (!c || c.status === 'resolved') return;
      const userName = user?.name || currentRole;
      const newReply = { id: 'temp-' + Date.now(), authorName: userName, authorRole: currentRole, text, time: 'Now' };
      if (!c.replies) c.replies = [];
      c.replies.push(newReply);
      c.status = 'in-progress';
      setComplaints([...complaints]);
      return;
    }
    replyInFlightRef.current = true;
    try {
      const result = await requestJSON(`${API_BASE}/complaints/${id}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      const c2 = complaints.find(x => x.id === id);
      if (c2 && c2.status !== 'resolved') {
        if (!c2.replies) c2.replies = [];
        c2.replies.push({ id: result.reply.id, authorName: result.reply.authorName, authorRole: result.reply.authorRole, text: result.reply.text, time: result.reply.time });
        if (c2.status === 'open') c2.status = 'in-progress';
        setComplaints([...complaints]);
      }
    } catch (e) {
      // API failed — add a local-only reply so user still sees it
      const c2 = complaints.find(x => x.id === id);
      if (c2 && c2.status !== 'resolved') {
        if (!c2.replies) c2.replies = [];
        c2.replies.push({ id: 'local-' + Date.now(), authorName: user?.name || currentRole, authorRole: currentRole, text, time: 'Now' });
        if (c2.status === 'open') c2.status = 'in-progress';
        setComplaints([...complaints]);
      }
      console.error('Reply API failed:', e.message);
    } finally {
      replyInFlightRef.current = false;
    }
  }, [complaints, user, currentRole]);

  const sendMsg = useCallback(async (text, fileData) => {
    if ((!text && !fileData) || !currentMsgId) return;
    let resolvedThreadId = currentMsgId;

    // If this is still a local temp thread, create it on the backend first
    if (currentMsgId?.startsWith('msg-')) {
      const tempThread = messages.find(m => m.id === currentMsgId);
      const myId = user?.id || (user?.email || '').replace(/[^a-z0-9]/gi, '_');
      const recipientId = tempThread?.participants?.find(id => id !== myId)
        || tempThread?.senderId;
      const recipientEmail = tempThread?.participantEmails?.[recipientId] || '';
      if (recipientId) {
        try {
          const result = await requestJSON(`${API_BASE}/messages/new`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipientId, recipientEmail }),
          });
          const realId = result.threadId || result.item?.id;
          if (realId) {
            resolvedThreadId = realId;
            setMessages(prev => prev.map(m => m.id === currentMsgId ? { ...m, id: realId } : m));
            setCurrentMsgId(realId);
          }
        } catch (e) {
          console.warn('Failed to create thread on backend before send:', e.message);
        }
      }
    }

    const msgText = fileData ? (text || `[File: ${fileData.name}]`) : text;
    const entry = { from: 'out', from_dir: 'out', text: msgText, time: 'Now', authorEmail: user?.email, authorId: user?.id };

    if (fileData) {
      entry.fileName = fileData.name;
      entry.fileType = fileData.type;
      entry.fileSize = fileData.size;
      const fileKey = 'file_' + Date.now() + '_' + fileData.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      entry.fileKey = fileKey;
    }

    // Optimistic local update — show message immediately on sender side
    setMessages(prev => prev.map(m => {
      if (m.id !== resolvedThreadId) return m;
      const updated = { ...m };
      if (!updated.participants && updated.participantIds) {
        updated.participants = updated.participantIds;
      }
      if (!updated.participantNames && updated.sender) {
        const cId = updated.participants?.find(id => id !== user?.id) || updated.senderId || '';
        updated.participantNames = { [user?.id || 'me']: user?.name || 'Me', [cId]: updated.sender || 'Unknown' };
        updated.participantRoles = { [user?.id || 'me']: currentRole?.toUpperCase() || 'USER', [cId]: updated.role?.toUpperCase() || 'CONTACT' };
      }
      return { ...updated, chat: [...(updated.chat || []), entry], preview: msgText, time: 'Now', unread: false };
    }));
    showToast('Message sent');

    // Save to backend — the server controller emits the socket event to the recipient.
    // We do NOT emit from the client side to avoid double delivery.
    if (!resolvedThreadId?.startsWith('msg-')) {
      try {
        const result = await requestJSON(`${API_BASE}/messages/${resolvedThreadId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from_dir: 'out', text: msgText, time: 'Now', authorEmail: user?.email, authorId: user?.id || user?._id }),
        });
        // Capture the MongoDB _id from the backend response and attach it to the local entry
        if (result?.item?.id) {
          setMessages(prev => prev.map(m => {
            if (m.id !== resolvedThreadId) return m;
            const chat = [...(m.chat || [])];
            const last = chat[chat.length - 1];
            if (last && !last.chatId) {
              chat[chat.length - 1] = { ...last, chatId: result.item.id };
            }
            return { ...m, chat };
          }));
        }
      } catch (e) {
        console.warn('Failed to persist message to backend:', e.message);
      }
    }
  }, [messages, currentMsgId, showToast, user, currentRole]);

  const editMessage = useCallback(async (msgId, chatIdx, newText) => {
    setMessages(messages.map(m => m.id === msgId ? { ...m, chat: m.chat.map((c, i) => i === chatIdx ? { ...c, text: newText, edited: true } : c) } : m));
    showToast('Message edited');
    try {
      const entry = messages.find(m => m.id === msgId)?.chat?.[chatIdx];
      const backendId = entry?.chatId || chatIdx;
      await requestJSON(`${API_BASE}/messages/${msgId}/chat/${backendId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: newText }) });
    } catch (e) {
      console.warn('Edit sync failed:', e.message);
    }
  }, [messages, showToast]);

  const deleteMessage = useCallback(async (msgId, chatIdx) => {
    setMessages(messages.map(m => m.id === msgId ? { ...m, chat: m.chat.filter((_, i) => i !== chatIdx) } : m));
    showToast('Message deleted');
    try {
      const entry = messages.find(m => m.id === msgId)?.chat?.[chatIdx];
      const backendId = entry?.chatId || chatIdx;
      await requestJSON(`${API_BASE}/messages/${msgId}/chat/${backendId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Delete sync failed:', e.message);
    }
  }, [messages, showToast]);

  const deleteConversation = useCallback(async (msgId) => {
    setDeletedConversationIds(prev => new Set([...prev, msgId]));
    setMessages(messages.filter(m => m.id !== msgId));
    if (currentMsgId === msgId) setCurrentMsgId(messages.find(m => m.id !== msgId)?.id || null);
    if (!msgId?.startsWith('msg-')) {
      try {
        await requestJSON(`${API_BASE}/messages/${msgId}`, { method: 'DELETE' });
      } catch {}
    }
  }, [messages, currentMsgId]);

  // Teacher tags
  const [teacherTags, setTeacherTags] = useState({});

  const addTeacherTag = useCallback((studentId, tag) => {
    const updated = { ...teacherTags };
    if (!updated[studentId]) updated[studentId] = [];
    if (!updated[studentId].includes(tag)) {
      updated[studentId] = [...updated[studentId], tag];
      setTeacherTags(updated);
      showToast(`Tagged student: ${tag}`);
      requestJSON(`${API_BASE}/data/axion_teacher_tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    }
  }, [teacherTags, showToast]);

  const removeTeacherTag = useCallback((studentId, tag) => {
    const updated = { ...teacherTags };
    if (updated[studentId]) {
      updated[studentId] = updated[studentId].filter(t => t !== tag);
      if (updated[studentId].length === 0) delete updated[studentId];
      setTeacherTags(updated);
      requestJSON(`${API_BASE}/data/axion_teacher_tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    }
  }, [teacherTags]);

  // Teacher classroom assignments
  const [classList, setClassList] = useState([]);

  const addClass = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setClassList(prev => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed].sort();
    });
  }, []);

  const removeClass = useCallback((name) => {
    setStudents(prev => prev.map(s => s.class === name ? { ...s, class: '' } : s));
    setTeacherClassrooms(prev => {
      const updated = {};
      for (const [email, classes] of Object.entries(prev)) {
        if (classes && classes.includes(name)) {
          const filtered = classes.filter(c => c !== name);
          if (filtered.length > 0) updated[email] = filtered;
        } else {
          updated[email] = classes;
        }
      }
      localStorage.setItem('axion_teacher_classrooms', JSON.stringify(updated));
      return updated;
    });
    setClassList(prev => prev.filter(c => c !== name));
  }, []);

  const getAllClasses = useCallback(() => {
    const fromStudents = [...new Set(students.map(s => s.class).filter(Boolean))];
    return [...new Set([...classList, ...fromStudents])].sort();
  }, [classList, students]);

  const [teacherClassrooms, setTeacherClassrooms] = useState(() => {
    try { return JSON.parse(localStorage.getItem('axion_teacher_classrooms') || '{}'); } catch { return {}; }
  });

  const saveTeacherClassrooms = useCallback((data) => {
    setTeacherClassrooms(data);
    localStorage.setItem('axion_teacher_classrooms', JSON.stringify(data));
  }, []);

  // Get classrooms a teacher is assigned to; returns [] if none set
  const getTeacherClassrooms = useCallback((email) => {
    if (!email) return [];
    const lowerEmail = email.toLowerCase();
    const key = Object.keys(teacherClassrooms).find(k => k.toLowerCase() === lowerEmail);
    if (key) {
      const assigned = teacherClassrooms[key];
      if (assigned && assigned.length > 0) return assigned;
    }
    return [];
  }, [teacherClassrooms]);

  const hasAssignedClasses = useCallback((email) => {
    if (!email) return false;
    const lowerEmail = email.toLowerCase();
    const key = Object.keys(teacherClassrooms).find(k => k.toLowerCase() === lowerEmail);
    if (key) {
      const assigned = teacherClassrooms[key];
      return assigned && assigned.length > 0;
    }
    return false;
  }, [teacherClassrooms]);

  const getTeacherClassName = useCallback((email) => {
    if (!email) return '';
    const lowerEmail = email.toLowerCase();
    const key = Object.keys(teacherClassrooms).find(k => k.toLowerCase() === lowerEmail);
    if (key) {
      const assigned = teacherClassrooms[key];
      if (assigned && assigned.length > 0) return assigned[0];
    }
    return '';
  }, [teacherClassrooms]);

  const startChatWith = useCallback(async (recipientId, recipientName, recipientRole, contactEmail) => {
    closeModal();
    const currentUserId = user?.id || (user?.email || '').replace(/[^a-z0-9]/gi, '_');

    // Check if a thread with this recipient already exists in local state
    const existing = messages.find(m => {
      const parts = m.participants || m.participantIds || [];
      return parts.includes(currentUserId) && parts.includes(recipientId);
    });
    if (existing) {
      setCurrentMsgId(existing.id);
      showToast(`Chat with ${recipientName} opened`);
      return;
    }

    // Create a temporary local thread so the UI responds immediately
    const tempId = 'msg-' + Date.now();
    const newMsg = {
      id: tempId,
      participants: [currentUserId, recipientId],
      participantIds: [currentUserId, recipientId],
      participantNames: {
        [currentUserId]: user?.name || 'Me',
        [recipientId]: recipientName,
      },
      participantRoles: {
        [currentUserId]: currentRole?.toUpperCase() || 'USER',
        [recipientId]: recipientRole || 'Contact',
      },
      participantEmails: {
        [currentUserId]: user?.email || '',
        [recipientId]: contactEmail || '',
      },
      participantAvis: {
        [currentUserId]: (user?.name || 'Me').substring(0, 2).toUpperCase(),
        [recipientId]: recipientName.substring(0, 2).toUpperCase(),
      },
      contactEmail: contactEmail || '',
      aColor: (recipientRole === 'TEACHER' ? 'var(--sky-pale)' : recipientRole === 'ADMIN' ? 'var(--primary-pale)' : 'var(--coral-pale)'),
      aText: (recipientRole === 'TEACHER' ? 'var(--sky)' : recipientRole === 'ADMIN' ? 'var(--primary)' : 'var(--coral)'),
      preview: 'No messages yet. Say hello!',
      time: 'Now',
      unread: false,
      chat: [],
      senderId: recipientId,
      sender: recipientName,
      role: recipientRole || 'Contact',
      avi: recipientName.substring(0, 2).toUpperCase(),
    };

    setMessages(prev => [newMsg, ...prev]);
    setCurrentMsgId(tempId);
    showToast(`Chat with ${recipientName} opened`);

    // Persist the thread on the backend and swap the temp ID for the real one
    try {
      const result = await requestJSON(`${API_BASE}/messages/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, recipientEmail: contactEmail }),
      });
      const realThreadId = result.threadId || result.item?.id;
      if (realThreadId && realThreadId !== tempId) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: realThreadId } : m));
        setCurrentMsgId(realThreadId);
      }
    } catch (e) {
      console.warn('Failed to persist new thread on backend:', e.message);
    }
  }, [showToast, closeModal, setCurrentMsgId, messages, user, currentRole]);

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

  const [announcements, setAnnouncements] = useState([]);

  const addAnnouncement = useCallback((title, body, targetRole) => {
    const a = { id: 'ann-' + Date.now(), title, body, targetRole: targetRole || 'all', by: user?.name || currentRole, time: new Date().toLocaleString(), createdAt: new Date().toISOString() };
    const updated = [a, ...announcements];
    setAnnouncements(updated);
    showToast('Announcement sent!');
    pushNotif('New Announcement', `${title} — ${by}`);
  }, [announcements, user, currentRole, showToast, pushNotif]);

  // Attendance helpers
  const todayStr = useCallback(() => new Date().toISOString().slice(0, 10), []);

  const saveAttendance = useCallback((dateStr, draft) => {
    closeModal();
    const absentCount = Object.entries(draft).filter(([, v]) => v === 'absent').length;
    setAttendanceData(prev => ({ ...prev, [dateStr]: draft }));
    requestJSON(`${API_BASE}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateStr, records: draft }),
    }).then(async () => {
      await refreshData();
      showToast('✓ Attendance saved for ' + new Date(dateStr + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }));
    }).catch(() => {
      showToast('✓ Attendance saved (offline)');
    });
    if (absentCount > 0) pushNotif('Attendance Alert', `${absentCount} student(s) marked absent today`);
  }, [attendanceData, showToast, closeModal, pushNotif, refreshData]);

  // Leaderboard helpers
  const invalidateLBCache = useCallback(() => { lbCacheRef.current = {}; }, []);

  const getScaledLeaderboard = useCallback((period) => {
    lbCacheRef.current = {};
    if (period === 'today') {
      const list = students.slice().sort((a, b) => b.pts - a.pts).map((s, i) => ({ ...s, rank: i + 1 }));
      return list;
    }
    const multipliers = { week: 5, month: 20 };
    const base = multipliers[period] || 1;
    const list = students.map(s => {
      const seed = [...(s.id + period)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const jitter = 0.85 + ((seed % 100) / 100) * 0.3;
      return { ...s, pts: Math.round(s.pts * base * jitter) };
    }).sort((a, b) => b.pts - a.pts).map((s, i) => ({ ...s, rank: i + 1 }));
    return list;
  }, [students]);

  const roleConfig = ROLES[currentRole] || ROLES.admin;

  const value = {
    isLoggedIn, setIsLoggedIn, user, setUser, currentRole, setCurrentRole, roleConfig,
    currentPage, setCurrentPage, currentMsgId, setCurrentMsgId,
    currentMsgRoleFilter, setCurrentMsgRoleFilter,
    currentStudentFilter, setCurrentStudentFilter,
    currentComplaintFilter, setCurrentComplaintFilter,
    escalatedIds, readNotifIds, setReadNotifIds,
    allEligibleUsers, setAllEligibleUsers,
    currentLBFilter, setCurrentLBFilter,
    selectedChildId, setSelectedChildId,
    students, setStudents, complaints, setComplaints,
    messages, setMessages,
    activities, setActivities,
    announcements, setAnnouncements,

    notifCount, setNotifCount, refreshNotifCount,
    notifOpen, setNotifOpen,
    activeModal, modalData, openModal, closeModal,
    toastMessage, showToast,
    attendanceData, setAttendanceData, attendanceDraft, setAttendanceDraft, selectedAttendanceDate, setSelectedAttendanceDate, dailyLogs, setDailyLogs,
    
    // Functions
    refreshData, doLogin, doRegister, logout: doLogout, navTo, buildNotifications,
    submitStudent, submitAward, submitComplaint,
    submitEditStudent, deleteStudent, saveParentDetails,
    selectMyChild,
    resolveComplaint, escalateComplaint, submitTicketReply,
    sendMsg, editMessage, deleteMessage, deleteConversation, startChatWith,
    saveAttendance, todayStr, pushNotif,
    
    invalidateLBCache, getScaledLeaderboard,
    addAnnouncement, addSavedProfile,
    teacherTags, addTeacherTag, removeTeacherTag,
    teacherClassrooms, saveTeacherClassrooms, getTeacherClassrooms, hasAssignedClasses, getTeacherClassName,
    classList, addClass, removeClass, getAllClasses,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
