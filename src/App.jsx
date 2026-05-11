import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Plus, Scale, Target, Trophy, Award,
  Download, LogOut, Settings, Activity,
} from 'lucide-react';
import { storage, todayISO } from './storage';
import Dashboard from './pages/Dashboard';
import LogWorkout from './pages/LogWorkout';
import WeightTracker from './pages/WeightTracker';
import GoalPlanner from './pages/GoalPlanner';
import Records from './pages/Records';
import Badges from './pages/Badges';
import History from './pages/History';
import SettingsPage from './pages/SettingsPage';

const PASSWORD = 'fitness';

export default function App() {
  const [authed, setAuthed] = useState(() => storage.get('auth', false));
  const [page, setPage] = useState('dashboard');
  const [toast, setToast] = useState('');

  // Core state
  const [workouts, setWorkouts] = useState(() => storage.get('workouts', []));
  const [weights, setWeights] = useState(() => storage.get('weights', []));
  const [profile, setProfile] = useState(() =>
    storage.get('profile', {
      name: 'John',
      heightFt: 5,
      heightIn: 10,
      age: 40,
      sex: 'male',
      dailyCalorieGoal: 300,
    })
  );
  const [challenge, setChallenge] = useState(() =>
    storage.get('challenge', {
      startDate: todayISO(),
      months: 3,
      startWeight: null,
      goalWeight: null,
    })
  );

  // Persist on every change
  useEffect(() => storage.set('workouts', workouts), [workouts]);
  useEffect(() => storage.set('weights', weights), [weights]);
  useEffect(() => storage.set('profile', profile), [profile]);
  useEffect(() => storage.set('challenge', challenge), [challenge]);
  useEffect(() => storage.set('auth', authed), [authed]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const handleLogin = (pw) => {
    if (pw === PASSWORD) {
      setAuthed(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setAuthed(false);
    setPage('dashboard');
  };

  // Computed: current weight (most recent entry)
  const currentWeight = useMemo(() => {
    if (!weights.length) return null;
    const sorted = [...weights].sort((a, b) => b.date.localeCompare(a.date));
    return Number(sorted[0].weight);
  }, [weights]);

  if (!authed) {
    return <Login onLogin={handleLogin} />;
  }

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'log', label: 'Log Workout', icon: Plus },
    { id: 'history', label: 'History', icon: Activity },
    { id: 'weight', label: 'Weight', icon: Scale },
    { id: 'goal', label: 'Goal Planner', icon: Target },
    { id: 'records', label: 'Records', icon: Trophy },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const pageProps = {
    workouts, setWorkouts,
    weights, setWeights,
    profile, setProfile,
    challenge, setChallenge,
    currentWeight,
    showToast,
    setPage,
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>HYBRID<br/><span>HUSTLER</span></h1>
          <p>Fitness OS</p>
        </div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? 'active' : ''}`}
              onClick={() => setPage(n.id)}
            >
              <n.icon /> {n.label}
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
        {page === 'dashboard' && <Dashboard {...pageProps} />}
        {page === 'log' && <LogWorkout {...pageProps} />}
        {page === 'history' && <History {...pageProps} />}
        {page === 'weight' && <WeightTracker {...pageProps} />}
        {page === 'goal' && <GoalPlanner {...pageProps} />}
        {page === 'records' && <Records {...pageProps} />}
        {page === 'badges' && <Badges {...pageProps} />}
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
    if (!onLogin(pw)) {
      setError('Wrong password');
      setPw('');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-box">
        <div className="login-brand">HYBRID<br/><span>HUSTLER</span></div>
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
