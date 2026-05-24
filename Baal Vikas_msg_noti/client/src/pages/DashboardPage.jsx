import { useApp } from '../contexts/AppContext';
import StatsGrid from '../components/Dashboard/StatsGrid';
import ActivityFeed from '../components/Dashboard/ActivityFeed';
import BehaviorOverview from '../components/Dashboard/BehaviorOverview';
import MiniPodium, { MiniLBList } from '../components/Dashboard/MiniPodium';
import { Activity } from 'lucide-react';

export default function DashboardPage({ onNavigate }) {
  const { currentRole, openModal } = useApp();

  if (currentRole === 'parent') {
    return (
      <>
        <StatsGrid />
        <ActivityFeed onNavigate={onNavigate} />
      </>
    );
  }

  return (
    <>
      {(currentRole === 'teacher' || currentRole === 'admin') && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #16a34a', fontWeight: 800, gap: 6, display: 'flex', alignItems: 'center' }}
            onClick={() => openModal('addBehaviour')}>
            <Activity size={14} /> Log Behaviour
          </button>
          <button className="btn btn-sm" style={{ background: 'var(--primary-pale)', color: 'var(--primary)', border: '1.5px solid var(--primary)', fontWeight: 800, gap: 6, display: 'flex', alignItems: 'center' }}
            onClick={() => onNavigate('students')}>
            Manage Students
          </button>
        </div>
      )}
      <StatsGrid />
      <div className="dash-grid">
        <div>
          <ActivityFeed onNavigate={onNavigate} />
          <BehaviorOverview onNavigate={onNavigate} />
        </div>
        <div>
          <div className="card mb-16">
            <div className="card-header">
              <div className="card-title">Today's Leaders</div>
              <span className="card-action" onClick={() => onNavigate('leaderboard')}>Full board →</span>
            </div>
            <MiniPodium />
            <MiniLBList />
          </div>
        </div>
      </div>
    </>
  );
}
