import { useEffect, useMemo, useState } from 'react';
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import axios from './api/axios.js';
import { useAuth } from './context/AuthContext.jsx';
import { useSocket } from './context/SocketContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Modal from './components/Modal.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import Detection from './pages/Detection.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Messages from './pages/Messages.jsx';
import Complaints from './pages/Complaints.jsx';
import Schools from './pages/Schools.jsx';
import MyChild from './pages/MyChild.jsx';
import Cctv from './pages/Cctv.jsx';
import AttendanceFees from './pages/AttendanceFees.jsx';

function defaultPath(role) {
  if (role === 'parent') return '/my-child';
  return '/dashboard';
}

function Guard({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) {
    return <Navigate to={defaultPath(user?.role)} replace />;
  }
  return children;
}

const ROUTE_META = {
  '/dashboard': { title: 'Dashboard', subtitle: 'School overview and pulse' },
  '/students': { title: 'Students', subtitle: 'Classroom roster and behavior' },
  '/detection': { title: 'AI Detection', subtitle: 'Cameras and live events' },
  '/leaderboard': { title: 'Leaderboard', subtitle: 'Points and recognition' },
  '/messages': { title: 'Messages', subtitle: 'Staff and family conversations' },
  '/complaints': { title: 'Complaints', subtitle: 'Issues and follow-up' },
  '/schools': { title: 'Schools', subtitle: 'Network and registration' },
  '/my-child': { title: 'My Child', subtitle: 'Progress and wellbeing' },
  '/cctv': { title: 'CCTV Security', subtitle: 'Live security feeds' },
  '/fees': { title: 'Attendance & Fees', subtitle: 'Financial overview' },
};

function Shell() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [openComplaints, setOpenComplaints] = useState(0);
  const [studentsRefreshKey, setStudentsRefreshKey] = useState(0);
  const [complaintsRefreshKey, setComplaintsRefreshKey] = useState(0);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);
  const [liveNotifs, setLiveNotifs] = useState([]);
  const socket = useSocket();

  const [awardOpen, setAwardOpen] = useState(false);
  const [awardStudentId, setAwardStudentId] = useState('');
  const [awardPoints, setAwardPoints] = useState(5);
  const [awardSource, setAwardSource] = useState('Teacher Award');
  const [awardReason, setAwardReason] = useState('');
  const [awardNotify, setAwardNotify] = useState('yes');
  const [studentOptions, setStudentOptions] = useState([]);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    classroom: 'Room 3 — Sunflower Class',
    parentName: '',
    parentEmail: '',
    enrollmentDate: '',
    medicalNotes: '',
  });

  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    filedByType: 'teacher',
    subject: '',
    priority: 'medium',
    description: '',
    studentId: '',
  });

  const meta = ROUTE_META[loc.pathname] || {
    title: 'Axion',
    subtitle: '',
  };

  const refreshBadges = () => {
    axios.get('/api/messages/conversations').then((r) => {
      setUnread(r.data.totalUnread ?? 0);
    });
    axios.get('/api/complaints').then((r) => {
      setOpenComplaints(
        r.data.filter((c) => c.status === 'open').length
      );
    });
  };

  useEffect(() => {
    refreshBadges();
  }, [loc.pathname]);

  useEffect(() => {
    if (!socket) return;
    const onPoints = (data) => {
      setLiveNotifs((n) => [{ id: Date.now(), text: `Points updated for ${data.studentName}: ${data.points > 0 ? '+'+data.points : data.points}` }, ...n].slice(0, 10));
    };
    const onNewMessage = () => refreshBadges();
    const onComplaintUpdate = () => refreshBadges();
    
    socket.on('points_notification', onPoints);
    socket.on('new_message', onNewMessage);
    socket.on('new_complaint', onComplaintUpdate);
    socket.on('complaint_updated', onComplaintUpdate);
    
    return () => {
      socket.off('points_notification', onPoints);
      socket.off('new_message', onNewMessage);
      socket.off('new_complaint', onComplaintUpdate);
      socket.off('complaint_updated', onComplaintUpdate);
    };
  }, [socket]);

  useEffect(() => {
    if (awardOpen || registerOpen || complaintOpen) {
      axios.get('/api/students').then((r) => setStudentOptions(r.data));
    }
  }, [awardOpen, registerOpen, complaintOpen]);

  const outletContext = useMemo(
    () => ({
      openAwardModal: (studentId) => {
        setAwardStudentId(studentId || '');
        setAwardOpen(true);
      },
      openRegisterModal: () => setRegisterOpen(true),
      openComplaintModal: () => {
        setComplaintForm((f) => ({
          ...f,
          filedByType: user?.role === 'parent' ? 'parent' : 'teacher',
        }));
        setComplaintOpen(true);
      },
      studentsRefreshKey,
      complaintsRefreshKey,
      leaderboardRefreshKey,
    }),
    [user?.role, studentsRefreshKey, complaintsRefreshKey, leaderboardRefreshKey]
  );

  const submitAward = async () => {
    if (!awardStudentId) return;
    await axios.post('/api/leaderboard/award', {
      studentId: awardStudentId,
      points: Number(awardPoints),
      source: awardSource,
      reason: awardReason,
      notifyParent: awardNotify === 'yes',
    });
    setAwardOpen(false);
    refreshBadges();
    setLeaderboardRefreshKey((k) => k + 1);
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    await axios.post('/api/students', {
      firstName: regForm.firstName,
      lastName: regForm.lastName,
      age: regForm.age,
      classroom: regForm.classroom,
      parentName: regForm.parentName,
      parentEmail: regForm.parentEmail,
      enrollmentDate: regForm.enrollmentDate,
      medicalNotes: regForm.medicalNotes,
    });
    setRegisterOpen(false);
    setRegForm({
      firstName: '',
      lastName: '',
      age: '',
      classroom: 'Room 3 — Sunflower Class',
      parentName: '',
      parentEmail: '',
      enrollmentDate: '',
      medicalNotes: '',
    });
    refreshBadges();
    setStudentsRefreshKey((k) => k + 1);
  };

  const submitComplaint = async (e) => {
    e?.preventDefault?.();
    await axios.post('/api/complaints', {
      filedByType: complaintForm.filedByType,
      subject: complaintForm.subject,
      priority: complaintForm.priority,
      description: complaintForm.description,
      studentId: complaintForm.studentId || undefined,
    });
    setComplaintOpen(false);
    setComplaintForm({
      filedByType: user?.role === 'parent' ? 'parent' : 'teacher',
      subject: '',
      priority: 'medium',
      description: '',
      studentId: '',
    });
    refreshBadges();
    setComplaintsRefreshKey((k) => k + 1);
  };

  const topCta = () => {
    if (['head_admin', 'school_admin', 'admin'].includes(user?.role)) setRegisterOpen(true);
    else if (user?.role === 'teacher') {
      setAwardStudentId('');
      setAwardOpen(true);
    } else {
      setComplaintForm((f) => ({
        ...f,
        filedByType: 'parent',
      }));
      setComplaintOpen(true);
    }
  };

  const notifItems = useMemo(
    () => [
      unread > 0 ? `${unread} unread message(s)` : null,
      openComplaints > 0 ? `${openComplaints} open complaint(s)` : null,
      ...liveNotifs.map(n => n.text)
    ].filter(Boolean),
    [unread, openComplaints, liveNotifs]
  );

  return (
    <div className="shell">
      <Sidebar
        role={user?.role}
        user={user}
        onLogout={logout}
        open={menuOpen}
        onCloseOverlay={() => setMenuOpen(false)}
        unreadMessages={unread}
        openComplaints={openComplaints}
      />
      <div className="main-area">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          role={user?.role}
          onHamburger={() => setMenuOpen((o) => !o)}
          onCta={topCta}
          notifOpen={notifOpen}
          onToggleNotif={() => setNotifOpen((n) => !n)}
          notifItems={notifItems}
        />
        <main className="main-content">
          <Outlet context={outletContext} />
        </main>
      </div>

      <Modal
        open={awardOpen}
        title="Update Points"
        onClose={() => setAwardOpen(false)}
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setAwardOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={submitAward}>
              Submit
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Student</label>
          <select
            className="form-select"
            value={awardStudentId}
            onChange={(e) => setAwardStudentId(e.target.value)}
            required
          >
            <option value="">Select student</option>
            {studentOptions.map((s) => (
              <option key={s._id} value={s._id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Points</label>
          <input
            type="number"
            className="form-input"
            value={awardPoints}
            onChange={(e) => setAwardPoints(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Source</label>
          <select
            className="form-select"
            value={awardSource}
            onChange={(e) => setAwardSource(e.target.value)}
          >
            <option>Teacher Award</option>
            <option>AI Detection</option>
            <option>Peer Nomination</option>
            <option>Parent Report</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Behavior Description</label>
          <textarea
            className="form-textarea"
            value={awardReason}
            onChange={(e) => setAwardReason(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Notify Parent</label>
          <select
            className="form-select"
            value={awardNotify}
            onChange={(e) => setAwardNotify(e.target.value)}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </Modal>

      <Modal
        open={registerOpen}
        title="Register Student"
        onClose={() => setRegisterOpen(false)}
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setRegisterOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="register-student-form" className="btn-primary">
              Submit
            </button>
          </>
        }
      >
        <form id="register-student-form" onSubmit={submitRegister}>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input
              className="form-input"
              value={regForm.firstName}
              onChange={(e) => setRegForm((f) => ({ ...f, firstName: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input
              className="form-input"
              value={regForm.lastName}
              onChange={(e) => setRegForm((f) => ({ ...f, lastName: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Age</label>
            <input
              type="number"
              className="form-input"
              min="0"
              value={regForm.age}
              onChange={(e) => setRegForm((f) => ({ ...f, age: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Classroom</label>
            <select
              className="form-select"
              value={regForm.classroom}
              onChange={(e) => setRegForm((f) => ({ ...f, classroom: e.target.value }))}
            >
              <option>Room 3 — Sunflower Class</option>
              <option>Room 1 — Lotus</option>
              <option>Room 2 — Maple</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Parent Name</label>
            <input
              className="form-input"
              value={regForm.parentName}
              onChange={(e) => setRegForm((f) => ({ ...f, parentName: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Parent Email</label>
            <input
              type="email"
              className="form-input"
              value={regForm.parentEmail}
              onChange={(e) => setRegForm((f) => ({ ...f, parentEmail: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Enrollment Date</label>
            <input
              type="date"
              className="form-input"
              value={regForm.enrollmentDate}
              onChange={(e) =>
                setRegForm((f) => ({ ...f, enrollmentDate: e.target.value }))
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Medical/Dietary Notes</label>
            <textarea
              className="form-textarea"
              value={regForm.medicalNotes}
              onChange={(e) =>
                setRegForm((f) => ({ ...f, medicalNotes: e.target.value }))
              }
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={complaintOpen}
        title="File Complaint"
        onClose={() => setComplaintOpen(false)}
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setComplaintOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={submitComplaint}>
              Submit
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Filed By</label>
          <select
            className="form-select"
            value={complaintForm.filedByType}
            onChange={(e) =>
              setComplaintForm((f) => ({ ...f, filedByType: e.target.value }))
            }
          >
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <input
            className="form-input"
            value={complaintForm.subject}
            onChange={(e) =>
              setComplaintForm((f) => ({ ...f, subject: e.target.value }))
            }
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select
            className="form-select"
            value={complaintForm.priority}
            onChange={(e) =>
              setComplaintForm((f) => ({ ...f, priority: e.target.value }))
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Details</label>
          <textarea
            className="form-textarea"
            value={complaintForm.description}
            onChange={(e) =>
              setComplaintForm((f) => ({ ...f, description: e.target.value }))
            }
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Student Involved (optional)</label>
          <select
            className="form-select"
            value={complaintForm.studentId}
            onChange={(e) =>
              setComplaintForm((f) => ({ ...f, studentId: e.target.value }))
            }
          >
            <option value="">None</option>
            {studentOptions.map((s) => (
              <option key={s._id} value={s._id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();
  if (!user?.token) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Shell />}>
        <Route
          index
          element={<Navigate to={defaultPath(user.role)} replace />}
        />
        <Route
          path="dashboard"
          element={
            <Guard roles={['head_admin', 'school_admin', 'admin', 'teacher']}>
              <Dashboard />
            </Guard>
          }
        />
        <Route
          path="students"
          element={
            <Guard roles={['head_admin', 'school_admin', 'admin', 'teacher']}>
              <Students />
            </Guard>
          }
        />
        <Route
          path="detection"
          element={
            <Guard roles={['head_admin', 'school_admin', 'admin', 'teacher']}>
              <Detection />
            </Guard>
          }
        />
        <Route
          path="leaderboard"
          element={
            <Guard roles={['head_admin', 'school_admin', 'admin', 'teacher']}>
              <Leaderboard />
            </Guard>
          }
        />
        <Route
          path="messages"
          element={
            <Guard roles={['head_admin', 'school_admin', 'admin', 'teacher', 'parent']}>
              <Messages />
            </Guard>
          }
        />
        <Route
          path="complaints"
          element={
            <Guard roles={['head_admin', 'school_admin', 'admin', 'teacher', 'parent']}>
              <Complaints />
            </Guard>
          }
        />
        <Route
          path="schools"
          element={
            <Guard roles={['head_admin', 'admin']}>
              <Schools />
            </Guard>
          }
        />
        <Route
          path="my-child"
          element={
            <Guard roles={['parent']}>
              <MyChild />
            </Guard>
          }
        />
        <Route
          path="cctv"
          element={
            <Guard roles={['head_admin', 'school_admin', 'admin', 'teacher', 'parent']}>
              <Cctv />
            </Guard>
          }
        />
        <Route
          path="fees"
          element={
            <Guard roles={['head_admin', 'school_admin', 'admin']}>
              <AttendanceFees />
            </Guard>
          }
        />
        <Route
          path="*"
          element={<Navigate to={defaultPath(user.role)} replace />}
        />
      </Route>
    </Routes>
  );
}
