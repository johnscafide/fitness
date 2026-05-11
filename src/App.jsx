import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Plus, Scale, Target, Trophy, Award,
  LogOut, Settings, Activity, BarChart2, Pill, Syringe, Sun,
} from 'lucide-react';
import { storage, todayISO } from './storage';
import Dashboard from './pages/Dashboard';
import Today from './pages/Today';
import LogWorkout from './pages/LogWorkout';
import WeightTracker from './pages/WeightTracker';
import GoalPlanner from './pages/GoalPlanner';
import Records from './pages/Records';
import Badges from './pages/Badges';
import History from './pages/History';
import SettingsPage from './pages/SettingsPage';
import Analytics from './pages/Analytics';
import Supplements from './pages/Supplements';
import TRTTracker from './pages/TRTTracker';

const PASSWORD = 'fitness';

export default function App() {
  const [authed, setAuthed] = useState(() => storage.get('auth', false));
  const [page, setPage] = useState('today');
  const [toast, setToast] = useState('');

  const [workouts, setWorkouts] = useState(() => storage.get('workouts', []));
  const [weights, setWeights] = useState(() => storage.get('weights', []));
  const [supplements, setSupplements] = useState(() => storage.get('supplements', []));
  const [trtLogs, setTrtLogs] = useState(() => storage.get('trtLogs', []));
  const [profile, setProfile] = useState(() =>
    storage.get('profile', {
      name: 'John',
      heightFt: 5, heightIn: 10, age: 40, sex: 'male',
      dailyCalorieGoal: 300,
      activityLevel: 'light',
    })
  );
  const [challenge, setChallenge] = useState(() =>
    storage.get('challenge', {
      startDate: todayISO(), months: 3, startWeight: null, goalWeight: null,
    })
  );

  useEffect(() => storage.set('workouts', workouts), [workouts]);
  useEffect(() => storage.set('weights', weights), [weights]);
  useEffect(() => storage.set('supplements', supplements), [supplements]);
  useEffect(() => storage.set('trtLogs', trtLogs), [trtLogs]);
  useEffect(() => storage.set('profile', profile), [profile]);
  useEffect(() => storage.set('challenge', challenge), [challenge]);
  useEffect(() => storage.set('auth', authed), [authed]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  };

  const handleLogin = (pw) => {
    if (pw === PASSWORD) { setAuthed(true); return true; }
    return false;
  };

  const handleLogout = () => { setAuthed(false); setPage('today'); };

  const currentWeight = useMemo(() => {
    if (!weights.length) return null;
    return Number([...weights].sort((a, b) => b.date.localeCompare(a.date))[0].weight);
  }, [weights]);

  if (!authed) return <Login onLogin={handleLogin} />;

  // TRT day alert for nav badge
  const dayOfWeek = new Date().getDay();
  const isTrtDay = dayOfWeek === 4 || dayOfWeek === 3;
  const trtLoggedToday = trtLogs.some((t) => t.date === todayISO());
  const trtAlert = isTrtDay && !trtLoggedToday;

  const nav = [
    { id: 'today', label: 'Today', icon: Sun },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'log', label: 'Log Workout', icon: Plus },
    { id: 'history', label: 'History', icon: Activity },
    { id: 'weight', label: 'Weight', icon: Scale },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'goal', label: 'Goal Planner', icon: Target },
    { id: 'records', label: 'Records', icon: Trophy },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'supplements', label: 'Supplements', icon: Pill },
    { id: 'trt', label: 'TRT', icon: Syringe, alert: trtAlert },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const pageProps = {
    workouts, setWorkouts,
    weights, setWeights,
    supplements, setSupplements,
    trtLogs, setTrtLogs,
    profile, setProfile,
    challenge, setChallenge,
    currentWeight, showToast, setPage,
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>HYBRID<br /><span>HUSTLER</span></h1>
          <p>Fitness OS</p>
        </div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? 'active' : ''}`}
              onClick={() => setPage(n.id)}
            >
              <n.icon size={18} />
              {n.label}
              {n.alert && (
                <span style={{
                  marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--warn)', flexShrink: 0,
                }} />
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main">
        {page === 'today' && <Today {...pageProps} />}
        {page === 'dashboard' && <Dashboard {...pageProps} />}
        {page === 'log' && <LogWorkout {...pageProps} />}
        {page === 'history' && <History {...pageProps} />}
        {page === 'weight' && <WeightTracker {...pageProps} />}
        {page === 'analytics' && <Analytics {...pageProps} />}
        {page === 'goal' && <GoalPlanner {...pageProps} />}
        {page === 'records' && <Records {...pageProps} />}
        {page === 'badges' && <Badges {...pageProps} />}
        {page === 'supplements' && <Supplements {...pageProps} />}
        {page === 'trt' && <TRTTracker {...pageProps} />}
        {page === 'settings' && <SettingsPage {...pageProps} />}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Login({ onLogin }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!onLogin(pw)) { setError('Wrong password'); setPw(''); }
  };

  return (
    <div className="login-screen">
      <div className="login-box">
        <div className="login-brand">HYBRID<br /><span>HUSTLER</span></div>
        <div className="login-sub">// Fitness OS // Private Access</div>
        <form onSubmit={submit}>
          <label className="login-label">Access Code</label>
          <input
            type="password"
            className="login-input"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(''); }}
            autoFocus
          />
          {error && <div className="login-error">! {error}</div>}
          <button type="submit" className="login-button">Enter →</button>
        </form>
      </div>
    </div>
  );
}
