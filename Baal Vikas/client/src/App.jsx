import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Login from './pages/Login';
import AppLayout from './components/Layout/AppLayout';
import NotificationPanel from './components/NotificationPanel';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import DetectionPage from './pages/DetectionPage';
import LeaderboardPage from './pages/LeaderboardPage';
import MessagesPage from './pages/MessagesPage';
import ComplaintsPage from './pages/ComplaintsPage';
import SchoolsPage from './pages/SchoolsPage';
import MyChildPage from './pages/MyChildPage';
import FeesPage from './pages/FeesPage';
import AttendanceReportsPage from './pages/AttendanceReportsPage';
import AwardModal from './components/Modals/AwardModal';
import ComplaintModal from './components/Modals/ComplaintModal';
import StudentModal from './components/Modals/StudentModal';
import RewardModal from './components/Modals/RewardModal';
import AttendanceModal from './components/Modals/AttendanceModal';
import GiveRewardModal from './components/Modals/GiveRewardModal';
import NewMsgModal from './components/Modals/NewMsgModal';
import TicketDetail from './components/Modals/TicketDetail';
import AddFeeModal from './components/Modals/AddFeeModal';
import RecordPaymentModal from './components/Modals/RecordPaymentModal';
import SendReminderModal from './components/Modals/SendReminderModal';
import StudentDetailModal from './components/Modals/StudentDetailModal';
import EditStudentModal from './components/Modals/EditStudentModal';
import EditSchoolModal from './components/Modals/EditSchoolModal';
import SchoolDetailModal from './components/Modals/SchoolDetailModal';

import EditParentModal from './components/Modals/EditParentModal';
import AnnouncementModal from './components/Modals/AnnouncementModal';
import TeacherTagModal from './components/Modals/TeacherTagModal';
import AIChatbotModal from './components/Modals/AIChatbotModal';
import TeacherSummaryModal from './components/Modals/TeacherSummaryModal';
import LinkParentModal from './components/Modals/LinkParentModal';
import AssignClassModal from './components/Modals/AssignClassModal';
import ManageClassesModal from './components/Modals/ManageClassesModal';
import AddBehaviourModal from './components/Modals/AddBehaviourModal';
import GlobalSearch from './components/GlobalSearch';

const MODAL_MAP = {
  award: AwardModal,
  complaint: ComplaintModal,
  student: StudentModal,
  editRewards: RewardModal,
  attendance: AttendanceModal,
  giveReward: GiveRewardModal,
  newMsg: NewMsgModal,
  ticketDetail: TicketDetail,
  addFee: AddFeeModal,
  recordPayment: RecordPaymentModal,
  sendReminder: SendReminderModal,
  studentDetail: StudentDetailModal,
  editStudent: EditStudentModal,
  editSchool: EditSchoolModal,
  schoolDetail: SchoolDetailModal,

  editParent: EditParentModal,
  announcement: AnnouncementModal,
  teacherTag: TeacherTagModal,
  aiChatbot: AIChatbotModal,
  teacherSummary: TeacherSummaryModal,
  linkParent: LinkParentModal,
  assignClass: AssignClassModal,
  manageClasses: ManageClassesModal,
  addBehaviour: AddBehaviourModal,
};

function Toast({ message }) {
  if (!message) return null;
  return (
    <div id="toast" style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%) translateY(0)',
      background: '#1a1a2e', color: '#fff', padding: '12px 22px', borderRadius: 30,
      fontSize: 13, fontWeight: 700, zIndex: 9999, opacity: 1,
      transition: 'all .35s ease', pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 8
    }}>
      {message}
    </div>
  );
}

function AppContent() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { isLoggedIn, currentRole, currentPage, navTo, activeModal, modalData, openModal, closeModal, toastMessage, notifOpen, setNotifOpen, notificationDot } = useApp();

  const handleNavigate = (page) => {
    navTo(page);
    setNotifOpen(false);
  };

  const handleCta = () => {
    if (currentRole === 'admin') openModal('student');
    else if (currentRole === 'teacher') openModal('award');
    else openModal('complaint');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage onNavigate={handleNavigate} />;
      case 'students': return <StudentsPage />;
      case 'detection': return <DetectionPage />;
      case 'leaderboard': return <LeaderboardPage />;
      case 'messages': return <MessagesPage />;
      case 'complaints': return <ComplaintsPage />;
      case 'schools': return <SchoolsPage />;
      case 'myChild': return <MyChildPage />;
      case 'fees': return <FeesPage />;
      case 'attendanceReports': return <AttendanceReportsPage />;
      default: return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  if (!isLoggedIn) {
    return <Login />;
  }

  const ActiveModal = MODAL_MAP[activeModal];

  return (
    <>
      <AppLayout
        onOpenModal={handleCta}
        onToggleNotif={() => setNotifOpen(!notifOpen)}
        notifDot={notificationDot}
        onOpenSearch={() => setSearchOpen(true)}
      >
        {renderPage()}
      </AppLayout>
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onNavigate={handleNavigate}
      />
      {ActiveModal && <ActiveModal open={true} onClose={closeModal} data={modalData} />}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Toast message={toastMessage} />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
