import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout({ children, onOpenModal, onToggleNotif, notifDot, onOpenSearch }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div id="app" style={{ display: 'flex' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-area">
        <Topbar
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenModal={onOpenModal}
          onToggleNotif={onToggleNotif}
          notifDot={notifDot}
          onOpenSearch={onOpenSearch}
        />
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
}
