import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ROLE_EMAILS = {
  admin: 'admin@axionschool.edu',
  teacher: 'anika.roy@axionschool.edu',
  parent: 'lena.kim@parent.edu',
};

function firstPath(role) {
  if (role === 'parent') return '/my-child';
  return '/dashboard';
}

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState(ROLE_EMAILS.admin);
  const [password, setPassword] = useState('password123');
  const [err, setErr] = useState('');

  const pickRole = (r) => {
    setEmail(ROLE_EMAILS[r]);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const u = await login(email, password);
      nav(firstPath(u.role), { replace: true });
    } catch {
      setErr('Invalid email or password.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-mark">
          <div className="login-leaf">🍃</div>
          <div className="login-wordmark">Axion</div>
        </div>
        <div className="login-role-row">
          <button
            type="button"
            className="login-role-btn"
            onClick={() => pickRole('admin')}
          >
            Admin 🏫
          </button>
          <button
            type="button"
            className="login-role-btn"
            onClick={() => pickRole('teacher')}
          >
            Teacher 👩‍🏫
          </button>
          <button
            type="button"
            className="login-role-btn"
            onClick={() => pickRole('parent')}
          >
            Parent 👨‍👩‍👧
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {err ? <div className="login-error">{err}</div> : null}
          <button type="submit" className="btn-primary login-submit">
            Sign In to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
