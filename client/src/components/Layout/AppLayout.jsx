import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout({ children, pageKey, onOpenModal, onToggleNotif, notifCount, onOpenSearch }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div id="app" style={{ display: 'flex' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-area">
        <Topbar
          onOpenSidebar={() => setSidebarOpen(prev => !prev)}
          onOpenModal={onOpenModal}
          onToggleNotif={onToggleNotif}
          notifCount={notifCount}
          onOpenSearch={onOpenSearch}
        />
        <div className="content-area">
          <div className="page-enter" key={pageKey}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
