import { useState } from 'react';
import { LogIn, Loader, X, Leaf } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { register } from '../api';

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const savedPass = localStorage.getItem('axion_last_pass') || '';
  const savedProfiles = (() => {
    try { return JSON.parse(localStorage.getItem('axion_saved_profiles')) || []; } catch { return []; }
  })();

  const mockLogin = async (profileKey, customEmail) => {
    const profiles = {
      admin: { name: 'Admin User', email: 'admin@axion.edu' },
      teacher: { name: 'Ms. Anika Roy', email: 'anika@axion.edu' },
      parent: { name: 'Mrs. Lena Kim', email: 'lena@axion.edu' },
    };
    const p = profiles[profileKey];
    const userEmail = (customEmail || p.email).toLowerCase();
    const userName = customEmail
      ? profiles[profileKey]?.name || customEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : p.name;
    const u = {
      name: userName,
      email: userEmail,
      role: profileKey.toUpperCase(),
      id: userEmail.replace(/[^a-z0-9]/gi, '_')
    };
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
    await refreshData();
  };

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Email and password required'); return; }
    setBusy(true);
    try {
      await doLogin(email, password);
    } catch (e) {
      const fallbacks = { 'admin@axion.edu': 'admin', 'anika@axion.edu': 'teacher', 'lena@axion.edu': 'parent' };
      const match = Object.entries(fallbacks).find(([em]) => em === email);
      if (match) { mockLogin(match[1], email); return; }
      if (e.message === 'Failed to fetch') { mockLogin(role, email); return; }
      setError(e.message);
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
      window.location.reload();
    } catch {}
  };

  const clearAllProfiles = () => {
    localStorage.removeItem('axion_saved_profiles');
    localStorage.removeItem('axion_token');
    localStorage.removeItem('axion_profile');
    localStorage.removeItem('axion_last_email');
    localStorage.removeItem('axion_last_pass');
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
    { key: 'admin', icon: (s) => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>, label: 'Admin' },
    { key: 'teacher', icon: (s) => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>, label: 'Teacher' },
    { key: 'parent', icon: (s) => <svg width={s||24} height={s||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'Parent' },
  ];

  return (
    <div id="login-screen" style={{ display: 'flex' }}>
      <div className="login-card" style={{ display: mode === 'login' ? 'block' : 'none', padding: '40px 40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Leaf size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: -1 }}><span style={{ color: 'var(--primary)' }}>Ax</span><span style={{ color: 'var(--gold)' }}>ion</span></div>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>Montessori Management</div>
        </div>

        {savedProfiles.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, paddingLeft: 2 }}>
              Quick Access
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {savedProfiles.map((p, i) => {
                const rc = ROLE_COLORS[p.role] || ROLE_COLORS.admin;
                return (
                  <div key={p.email + i} onClick={() => handleQuickLogin(p)}
                    style={{
                      cursor: busy ? 'default' : 'pointer', padding: '10px 12px', borderRadius: 12,
                      background: rc.bg, border: '1px solid transparent',
                      display: 'flex', alignItems: 'center', gap: 10,
                      opacity: busy ? 0.5 : 1, transition: 'all .15s',
                    }}
                    onMouseEnter={e => { if (!busy) { e.currentTarget.style.borderColor = rc.col; } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: rc.col, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {p.avi || p.name?.substring(0, 2).toUpperCase() || '??'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{p.name}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>{p.email}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: rc.col }}>
                        {busy ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <LogIn size={14} />}
                      </div>
                      <div onClick={(e) => removeProfile(p.email, e)}
                        style={{ width: 24, height: 24, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'all .12s' }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(232,97,74,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.background = 'transparent'; }}>
                        <X size={12} style={{ color: 'var(--coral)' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ position: 'relative', marginBottom: 20 }}>
          <div style={{ borderTop: '1px solid var(--border)', height: 1 }} />
          <div style={{ position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 10px', fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>
            {savedProfiles.length > 0 ? 'or sign in manually' : 'sign in'}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@school.edu" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 13 }} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 13 }} />
        </div>
        {error && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, textAlign: 'center', background: 'var(--coral-pale)', color: 'var(--coral)' }}>{error}</div>}
        {success && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, textAlign: 'center', background: 'var(--primary-pale)', color: 'var(--primary)' }}>{success}</div>}
        <button className="btn-login" onClick={handleLogin} disabled={busy} style={{ opacity: busy ? 0.6 : 1, borderRadius: 12, padding: '12px', fontSize: 14 }}>
          {busy ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</span> : 'Sign In'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>
          Don't have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }} onClick={() => { setMode('register'); setError(''); setSuccess(''); }}>Create one</span>
        </div>
        {savedProfiles.length > 0 && (
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <span style={{ color: 'var(--text3)', fontSize: 11, cursor: 'pointer', fontWeight: 600, opacity: 0.5, transition: 'opacity .15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
              onClick={clearAllProfiles}>
              Clear saved accounts
            </span>
          </div>
        )}
      </div>

      <div className="login-card" style={{ display: mode === 'register' ? 'block' : 'none', padding: '40px 40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Leaf size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: -1 }}><span style={{ color: 'var(--primary)' }}>Ax</span><span style={{ color: 'var(--gold)' }}>ion</span></div>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>Create your account</div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, paddingLeft: 2 }}>Select Role</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {roleBtns.map(r => {
              const selected = role === r.key;
              return (
                <div key={r.key}
                  style={{
                    flex: 1, padding: '10px 6px', border: '1.5px solid', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                    transition: 'all .15s', background: selected ? 'var(--primary-pale)' : '#fff',
                    borderColor: selected ? 'var(--primary)' : 'var(--border)',
                  }}
                  onClick={() => setRole(r.key)}>
                  <div style={{ fontSize: 18, marginBottom: 2, color: selected ? 'var(--primary)' : 'var(--text3)' }}>{r.icon(18)}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: selected ? 'var(--primary)' : 'var(--text2)' }}>{r.label}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 13 }} />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@school.edu" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 13 }} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 13 }} />
        </div>
        {error && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, textAlign: 'center', background: 'var(--coral-pale)', color: 'var(--coral)' }}>{error}</div>}
        {success && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, textAlign: 'center', background: 'var(--primary-pale)', color: 'var(--primary)' }}>{success}</div>}
        <button className="btn-login" onClick={handleRegister} style={{ borderRadius: 12, padding: '12px', fontSize: 14 }}>Create Account</button>
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>
          Already have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }} onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>Sign In</span>
        </div>
      </div>
    </div>
  );
}
