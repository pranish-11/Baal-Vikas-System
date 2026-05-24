export function seedDefaultData() {
  if (localStorage.getItem('axion_seed_done')) return;

  const students = [
    { id: 'std-1', name: 'Liam Kim', init: 'LK', age: 5, class: 'Room 3 — Sunflower Class', pts: 85, pct: 68, rank: 1, bg: '#E0F2FE', col: '#0E7490', parentName: 'Mrs. Lena Kim', parentEmail: 'lena@axion.edu' },
    { id: 'std-2', name: 'Sophia Chen', init: 'SC', age: 4, class: 'Room 3 — Sunflower Class', pts: 72, pct: 55, rank: 2, bg: '#FCE7F3', col: '#BE185D', parentName: 'Mrs. Mei Chen', parentEmail: 'mei@axion.edu' },
    { id: 'std-3', name: 'Noah Patel', init: 'NP', age: 5, class: 'Room 2 — Rainbow Room', pts: 90, pct: 75, rank: 1, bg: '#D1FAE5', col: '#047857', parentName: 'Mr. Raj Patel', parentEmail: 'raj@axion.edu' },
    { id: 'std-4', name: 'Emma Wilson', init: 'EW', age: 4, class: 'Room 2 — Rainbow Room', pts: 60, pct: 42, rank: 3, bg: '#FEF3C7', col: '#B45309', parentName: 'Mrs. Sarah Wilson', parentEmail: 'sarah@axion.edu' },
    { id: 'std-5', name: 'Aiden Sharma', init: 'AS', age: 3, class: 'Room 1 — Toddler Room', pts: 45, pct: 30, rank: 1, bg: '#EDE9FE', col: '#7C3AED', parentName: 'Mrs. Priya Sharma', parentEmail: 'priya@axion.edu' },
  ];

  const messages = [
    {
      id: 'msg-1', 
      participants: ['parent_lena_axion_edu', 'admin_axion_edu'],
      participantNames: { 'parent_lena_axion_edu': 'Mrs. Lena Kim', 'admin_axion_edu': 'Admin User' },
      participantRoles: { 'parent_lena_axion_edu': 'PARENT', 'admin_axion_edu': 'ADMIN' },
      participantAvis: { 'parent_lena_axion_edu': 'LK', 'admin_axion_edu': 'AD' },
      aColor: 'var(--coral-pale)', aText: 'var(--coral)',
      preview: 'Thank you for the update!', time: '10:30 AM',
      unread: false, senderId: 'parent_lena_axion_edu', sender: 'Mrs. Lena Kim', role: 'PARENT', avi: 'LK',
      chat: [
        { from: 'in', authorId: 'admin_axion_edu', text: 'Good morning! Liam had a great day today.', time: '9:15 AM' },
        { from: 'out', authorId: 'parent_lena_axion_edu', text: "That's wonderful to hear! What did he do?", time: '9:45 AM' },
        { from: 'in', authorId: 'admin_axion_edu', text: 'He helped organize the reading corner and shared his snack with Sophia.', time: '10:00 AM' },
        { from: 'out', authorId: 'parent_lena_axion_edu', text: 'Thank you for the update!', time: '10:30 AM' },
      ],
    },
    {
      id: 'msg-2',
      participants: ['teacher_anika_axion_edu', 'parent_lena_axion_edu'],
      participantNames: { 'teacher_anika_axion_edu': 'Ms. Anika Roy (Teacher)', 'parent_lena_axion_edu': 'Mrs. Lena Kim' },
      participantRoles: { 'teacher_anika_axion_edu': 'TEACHER', 'parent_lena_axion_edu': 'PARENT' },
      participantAvis: { 'teacher_anika_axion_edu': 'AR', 'parent_lena_axion_edu': 'LK' },
      aColor: 'var(--sky-pale)', aText: 'var(--sky)',
      preview: 'Please send Liam with outdoor shoes tomorrow.', time: '2:00 PM',
      unread: false, senderId: 'teacher_anika_axion_edu', sender: 'Ms. Anika Roy (Teacher)', role: 'TEACHER', avi: 'AR',
      chat: [
        { from: 'out', authorId: 'parent_lena_axion_edu', text: 'Just a reminder — tomorrow is outdoor play day.', time: '1:30 PM' },
        { from: 'in', authorId: 'teacher_anika_axion_edu', text: 'Please send Liam with outdoor shoes and a hat.', time: '2:00 PM' },
      ],
    },
  ];

  const complaints = [
    { id: 'comp-1', title: 'Noise level in cafeteria', desc: 'The cafeteria is too noisy during lunch hours, which makes it hard for some children to eat comfortably.', status: 'open', type: 'general', priority: 'medium', student: null, by: 'Mrs. Lena Kim', time: 'Yesterday', replies: [
      { id: 'rep-1', authorName: 'Ms. Anika Roy', authorRole: 'teacher', text: 'Thank you for raising this. We will assign a monitor during lunch.', time: 'Yesterday' },
    ] },
    { id: 'comp-2', title: 'Lost sweater', desc: 'My child lost their blue sweater with a name tag.', status: 'resolved', type: 'general', priority: 'low', student: 'std-1', by: 'Mrs. Lena Kim', time: '3 days ago', replies: [] },
  ];

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const attendance = {
    [today]: { 'std-1': 'present', 'std-2': 'absent', 'std-3': 'present', 'std-4': 'late', 'std-5': 'present' },
    [yesterday]: { 'std-1': 'present', 'std-2': 'present', 'std-3': 'present', 'std-4': 'absent', 'std-5': 'present' },
  };

  const behaviourEntries = [
    { id: 'beh-1', studentId: 'std-1', studentName: 'Liam Kim', type: 'positive', description: 'Helped friend with cleanup', ptsDelta: 5, time: '10:30 AM', date: today },
    { id: 'beh-2', studentId: 'std-1', studentName: 'Liam Kim', type: 'positive', description: 'Shared snack with Sophia', ptsDelta: 5, time: '11:00 AM', date: today },
    { id: 'beh-3', studentId: 'std-2', studentName: 'Sophia Chen', type: 'negative', description: 'Disrupted circle time', ptsDelta: -5, time: '9:00 AM', date: today },
    { id: 'beh-4', studentId: 'std-3', studentName: 'Noah Patel', type: 'positive', description: 'Excellent reading participation', ptsDelta: 5, time: '9:30 AM', date: today },
  ];

  const dailyLogs = {
    [`std-1_${today}`]: { ate: true, nap: true, play: true, group: true, quiet: false, note: 'Liam ate all his lunch and napped well.' },
    [`std-3_${today}`]: { ate: true, nap: false, play: true, group: true, quiet: true, note: 'Noah was energetic today, skipped nap but participated well.' },
  };

  const teacherTags = {
    'std-1': ['Great helper', 'Kind friend'],
    'std-3': ['Eager reader', 'Creative thinker'],
  };

  const teacherClassrooms = {
    'anika@axion.edu': ['Room 3 — Sunflower Class'],
    'admin@axion.edu': null,
  };

  const activities = [
    { id: 'act-1', title: 'Awarded 5 points to Liam Kim', desc: 'Helped friend with cleanup', time: 'Just now', timeLabel: 'Just now' },
    { id: 'act-2', title: 'Behaviour update: Sophia Chen', desc: 'Disrupted circle time', time: 'Just now', timeLabel: 'Just now' },
  ];

  const savedProfiles = [
    { email: 'admin@axion.edu', role: 'admin', name: 'Admin User', avi: 'AD' },
    { email: 'anika@axion.edu', role: 'teacher', name: 'Ms. Anika Roy', avi: 'AR' },
    { email: 'lena@axion.edu', role: 'parent', name: 'Mrs. Lena Kim', avi: 'LK' },
  ];

  try { localStorage.setItem('axion_students_cache', JSON.stringify(students)); } catch {}
  try { localStorage.setItem('axion_messages', JSON.stringify(messages)); } catch {}
  try { localStorage.setItem('axion_complaints', JSON.stringify(complaints)); } catch {}
  try { localStorage.setItem('axion_attendance', JSON.stringify(attendance)); } catch {}
  try { localStorage.setItem('axion_behaviour_entries', JSON.stringify(behaviourEntries)); } catch {}
  try { localStorage.setItem('axion_daily_logs', JSON.stringify(dailyLogs)); } catch {}
  try { localStorage.setItem('axion_teacher_tags', JSON.stringify(teacherTags)); } catch {}
  try { localStorage.setItem('axion_activities', JSON.stringify(activities)); } catch {}
  try { localStorage.setItem('axion_teacher_classrooms', JSON.stringify(teacherClassrooms)); } catch {}
  try { localStorage.setItem('axion_saved_profiles', JSON.stringify(savedProfiles)); } catch {}
  try { localStorage.setItem('axion_seed_done', '1'); } catch {}
}
