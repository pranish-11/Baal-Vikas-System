import { useState } from 'react';
import { LogIn, Loader, X, Leaf, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { register } from '../api';
import { queueSyncToDB } from '../utils/dbSync';

const ROLE_COLORS = {
  admin: { bg: 'var(--primary-pale)', col: 'var(--primary)', label: 'Administrator' },
  teacher: { bg: 'var(--sky-pale)', col: 'var(--sky)', label: 'Teacher' },
  parent: { bg: 'var(--coral-pale)', col: 'var(--coral)', label: 'Parent' },
};

export default function Login() {
  const { doLogin, setCurrentRole, setUser, setIsLoggedIn, setCurrentMsgId, refreshData, addSavedProfile, setAllEligibleUsers } = useApp();
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const savedPass = localStorage.getItem('axion_last_pass') || '';
  const savedProfiles = (() => {
    try { return JSON.parse(localStorage.getItem('axion_saved_profiles')) || []; } catch { return []; }
  })();

  const mockLogin = (profileKey, customEmail) => {
    const profiles = {
      admin: { name: 'Admin User', email: 'admin@axionschool.edu' },
      teacher: { name: 'Ms. Anika Roy', email: 'anika.roy@axionschool.edu' },
      parent: { name: 'Mrs. Lena Kim', email: 'lena.kim@parent.edu' },
    };
    const p = profiles[profileKey];
    const userEmail = customEmail || p.email;
    const userName = customEmail ? (customEmail === 'admin@axionschool.edu' ? 'Admin User' : customEmail === 'anika.roy@axionschool.edu' ? 'Ms. Anika Roy' : 'Mrs. Lena Kim') : p.name;
    const u = { name: userName, email: userEmail, role: profileKey.toUpperCase() };
    const profile = { role: profileKey, user: u };
    localStorage.setItem('axion_profile', JSON.stringify(profile));
    localStorage.setItem('axion_token', 'demo-token-' + profileKey);
    localStorage.setItem('axion_last_email', userEmail);
    addSavedProfile(userEmail, profileKey, u);
    setCurrentRole(profileKey);
    setUser(u);
    setCurrentMsgId(null);
    setIsLoggedIn(true);
    setAllEligibleUsers([]);
    // Note: data is already loaded from localStorage by useState initializers + seed data.
    // Skipping refreshData() here prevents backend with limited data from overwriting local data.
  };

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Email and password required'); return; }
    setBusy(true);
    try {
      await doLogin(email, password);
    } catch (e) {
      const fallbacks = { 'admin@axionschool.edu': 'admin', 'anika.roy@axionschool.edu': 'teacher', 'lena.kim@parent.edu': 'parent' };
      const match = Object.entries(fallbacks).find(([em]) => em === email);
      if (match) { mockLogin(match[1], email); return; }
      setError(e.message === 'Failed to fetch' ? 'Backend offline — use one of the saved accounts above' : e.message);
      setBusy(false);
    }
  };

  const handleQuickLogin = async (p) => {
    if (!p.email) return;
    setError('');
    setBusy(true);
    try {
      await doLogin(p.email, savedPass);
    } catch {
      mockLogin(p.role, p.email);
    }
  };

  const removeProfile = (email, e) => {
    e.stopPropagation();
    try {
      const list = JSON.parse(localStorage.getItem('axion_saved_profiles')) || [];
      const filtered = list.filter(p => p.email !== email);
      localStorage.setItem('axion_saved_profiles', JSON.stringify(filtered));
      queueSyncToDB('axion_saved_profiles', filtered);
      window.location.reload();
    } catch {}
  };

  const clearAllProfiles = () => {
    localStorage.removeItem('axion_saved_profiles');
    localStorage.removeItem('axion_seed_done');
    window.location.reload();
  };

  const handleRegister = async () => {
    setError('');
    if (!name || !email || !password) { setError('All fields are required'); return; }
    try {
      await register(name, email, password, role.toUpperCase());
      setSuccess('Account created! Please sign in.');
      setMode('login');
    } catch (e) {
      setError(e.message);
    }
  };

  const roleBtns = [
    { key: 'admin', icon: (s) => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" x2="20" y1="8" y2="14"/><line x1="23" x2="17" y1="11" y2="11"/></svg>, label: 'Admin' },
    { key: 'teacher', icon: (s) => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>, label: 'Teacher' },
    { key: 'parent', icon: (s) => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'Parent' },
  ];

  return (
    <div id="login-screen" style={{ display: 'flex' }}>
      <div className="login-card" style={{ display: mode === 'login' ? 'block' : 'none' }}>
        <div className="login-logo">
          <Leaf size={40} style={{ color: 'var(--primary)', marginBottom: 8 }} />
          <div className="wordmark">Axi<span>on</span></div>
          <div className="tagline">Montessori Management System</div>
        </div>

        {savedProfiles.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Saved Accounts ({savedProfiles.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {savedProfiles.map((p, i) => {
                const rc = ROLE_COLORS[p.role] || ROLE_COLORS.admin;
                return (
                  <div key={p.email + i} onClick={() => handleQuickLogin(p)}
                    style={{ cursor: busy ? 'default' : 'pointer', padding: '10px 12px', borderRadius: 10, background: rc.bg, border: '1.5px solid transparent', display: 'flex', alignItems: 'center', gap: 10, opacity: busy ? 0.5 : 1, transition: 'border-color .15s' }}
                    onMouseEnter={e => { if (!busy) e.currentTarget.style.borderColor = rc.col; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: rc.col, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                      {p.avi || p.name?.substring(0, 2).toUpperCase() || '??'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{rc.label} · {p.email}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {busy ? <Loader size={16} style={{ color: rc.col, animation: 'spin 1s linear infinite' }} /> : <LogIn size={16} style={{ color: rc.col }} />}
                      <div onClick={(e) => removeProfile(p.email, e)} style={{ padding: 2, borderRadius: 4, cursor: 'pointer', opacity: 0.4, hover: { opacity: 1 } }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}>
                        <X size={14} style={{ color: 'var(--text3)' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 14, textAlign: 'center' }}>
          {savedProfiles.length > 0 ? (
            <span style={{ color: 'var(--primary)', cursor: 'pointer', borderBottom: '1.5px dashed var(--primary)' }} onClick={() => { setEmail(''); setPassword(''); }}>
              Or sign in with a different account
            </span>
          ) : 'Sign in to your account'}
        </p>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
        </div>
        <div className="form-group" style={{ position: 'relative' }}>
          <label className="form-label">Password</label>
          <input className="form-input" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ paddingRight: 40 }} />
          <div onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, bottom: 10, cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center' }}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </div>
        </div>
        {error && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: 'center', background: 'var(--coral-pale)', color: 'var(--coral)' }}>{error}</div>}
        {success && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: 'center', background: 'var(--primary-pale)', color: 'var(--primary)' }}>{success}</div>}
        <button className="btn-login" onClick={handleLogin} disabled={busy} style={{ opacity: busy ? 0.6 : 1 }}>
          {busy ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</span> : 'Sign In to Dashboard'}
        </button>
        <div className="login-footer">
          Don't have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }} onClick={() => { setMode('register'); setError(''); setSuccess(''); }}>Create Account</span>
        </div>
        {savedProfiles.length > 0 && (
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <button onClick={clearAllProfiles} style={{ background: 'transparent', border: '1.5px solid var(--coral-pale)', borderRadius: 8, padding: '6px 16px', color: 'var(--coral)', fontSize: 12, fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--coral-pale)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              Clear all saved accounts
            </button>
          </div>
        )}
      </div>

      <div className="login-card" style={{ display: mode === 'register' ? 'block' : 'none' }}>
        <div className="login-logo">
          <Leaf size={40} style={{ color: 'var(--primary)', marginBottom: 8 }} />
          <div className="wordmark">Axi<span>on</span></div>
          <div className="tagline">Create New Account</div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 14, textAlign: 'center' }}>Select your role:</p>
        <div className="role-grid">
          {roleBtns.map(r => {
            const selected = role === r.key;
            return (
              <div key={r.key} className={`role-btn${selected ? ' selected' : ''}`} onClick={() => setRole(r.key)}>
                <div className="role-icon">{r.icon(24)}</div>
                <div className="role-name">{r.label}</div>
              </div>
            );
          })}
        </div>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
        </div>
        <div className="form-group" style={{ position: 'relative' }}>
          <label className="form-label">Password</label>
          <input className="form-input" type={showRegPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ paddingRight: 40 }} />
          <div onClick={() => setShowRegPassword(!showRegPassword)} style={{ position: 'absolute', right: 12, bottom: 10, cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center' }}>
            {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </div>
        </div>
        {error && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: 'center', background: 'var(--coral-pale)', color: 'var(--coral)' }}>{error}</div>}
        {success && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: 'center', background: 'var(--primary-pale)', color: 'var(--primary)' }}>{success}</div>}
        <button className="btn-login" onClick={handleRegister}>Register</button>
        <div className="login-footer">
          Already have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }} onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>Sign In</span>
        </div>
      </div>
    </div>
  );
}
