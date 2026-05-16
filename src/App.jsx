import { useState, useEffect, useRef, useMemo } from 'react';
import {
  LayoutDashboard, Plus, Scale, Target, Trophy, Award,
  LogOut, Settings, Activity, BarChart2, Pill, Syringe, Sun,
  Wifi, WifiOff, RefreshCw, BookOpen, FlaskConical, CalendarCheck, Moon,
} from 'lucide-react';
import { storage, todayISO } from './storage';
import { hasSupabase } from './supabase';
import {
  loadAllData, migrateIfNeeded,
  syncWorkout, deleteWorkout,
  syncWeight, deleteWeight,
  syncSupplement, deleteSupplement,
  syncTrtLog, deleteTrtLog,
  syncProfile, clearAllRemote,
} from './db';
import { getRestAdvice } from './restIntelligence';

import Dashboard    from './pages/Dashboard';
import Today        from './pages/Today';
import LogWorkout   from './pages/LogWorkout';
import WeightTracker from './pages/WeightTracker';
import GoalPlanner  from './pages/GoalPlanner';
import Records      from './pages/Records';
import Badges       from './pages/Badges';
import History      from './pages/History';
import SettingsPage from './pages/SettingsPage';
import Analytics    from './pages/Analytics';
import Supplements  from './pages/Supplements';
import TRTTracker   from './pages/TRTTracker';
import WeeklyReview from './pages/WeeklyReview';
import Journal      from './pages/Journal';
import LabResults   from './pages/LabResults';

const PASSWORD = 'fitness';

const DEFAULT_PROFILE = {
  name: 'John', heightFt: 5, heightIn: 10, age: 40, sex: 'male',
  dailyCalorieGoal: 300, activityLevel: 'light',
};
const DEFAULT_CHALLENGE = {
  startDate: todayISO(), months: 3, startWeight: null, goalWeight: null,
};

// ── Theme helpers ─────────────────────────────────────────
const LIGHT_VARS = `
  :root {
    --bg: #f4f4f4;
    --bg-2: #ffffff;
    --bg-3: #ebebeb;
    --border: #d8d8d8;
    --border-2: #c8c8c8;
    --text: #111111;
    --text-dim: #444444;
    --text-mute: #888888;
    --accent: #5a9e00;
    --accent-2: #4a8400;
    --danger: #cc2222;
    --warn: #c47a00;
    --info: #1a6ebb;
  }
  body { background: #f4f4f4; }
  .login-screen { background: #f4f4f4; }
`;

const applyTheme = (dark) => {
  const existing = document.getElementById('theme-override');
  if (existing) existing.remove();
  if (!dark) {
    const style = document.createElement('style');
    style.id = 'theme-override';
    style.textContent = LIGHT_VARS;
    document.head.appendChild(style);
  }
};

export default function App() {
  const [authed,     setAuthed]     = useState(() => storage.get('auth', false));
  const [page,       setPage]       = useState('today');
  const [toast,      setToast]      = useState('');
  const [syncing,    setSyncing]    = useState(false);
  const [syncError,  setSyncError]  = useState(false);
  const [loaded,     setLoaded]     = useState(false);
  const [darkMode,   setDarkMode]   = useState(() => storage.get('darkMode', true));

  const [workouts,    setWorkoutsRaw]    = useState(() => storage.get('workouts', []));
  const [weights,     setWeightsRaw]     = useState(() => storage.get('weights', []));
  const [supplements, setSupplementsRaw] = useState(() => storage.get('supplements', []));
  const [trtLogs,     setTrtLogsRaw]     = useState(() => storage.get('trtLogs', []));
  const [profile,     setProfileRaw]     = useState(() => storage.get('profile', DEFAULT_PROFILE));
  const [challenge,   setChallengeRaw]   = useState(() => storage.get('challenge', DEFAULT_CHALLENGE));

  // Apply theme on mount and on change
  useEffect(() => { applyTheme(darkMode); storage.set('darkMode', darkMode); }, [darkMode]);

  useEffect(() => storage.set('workouts',    workouts),    [workouts]);
  useEffect(() => storage.set('weights',     weights),     [weights]);
  useEffect(() => storage.set('supplements', supplements), [supplements]);
  useEffect(() => storage.set('trtLogs',     trtLogs),     [trtLogs]);
  useEffect(() => storage.set('profile',     profile),     [profile]);
  useEffect(() => storage.set('challenge',   challenge),   [challenge]);
  useEffect(() => storage.set('auth',        authed),      [authed]);

  const loadFromSupabase = async () => {
    if (!hasSupabase()) { setLoaded(true); return; }
    setSyncing(true); setSyncError(false);
    try {
      const localData = {
        workouts:    storage.get('workouts', []),
        weights:     storage.get('weights', []),
        supplements: storage.get('supplements', []),
        trtLogs:     storage.get('trtLogs', []),
        profile:     storage.get('profile', DEFAULT_PROFILE),
        challenge:   storage.get('challenge', DEFAULT_CHALLENGE),
      };
      await migrateIfNeeded(localData);
      const merged = await loadAllData(localData);
      setWorkoutsRaw(merged.workouts);
      setWeightsRaw(merged.weights);
      setSupplementsRaw(merged.supplements);
      setTrtLogsRaw(merged.trtLogs);
      setProfileRaw(merged.profile);
      setChallengeRaw(merged.challenge);
    } catch (err) {
      console.warn('[App] Supabase load failed:', err.message);
      setSyncError(true);
    } finally {
      setSyncing(false); setLoaded(true);
    }
  };

  useEffect(() => { if (authed) loadFromSupabase(); else setLoaded(false); }, [authed]);

  const setWorkouts    = (next) => setWorkoutsRaw(typeof next === 'function' ? next(workouts) : next);
  const setWeights     = (val)  => setWeightsRaw(val);
  const setSupplements = (val)  => setSupplementsRaw(val);
  const setTrtLogs     = (val)  => setTrtLogsRaw(val);
  const setProfile     = (val)  => { setProfileRaw(val);   syncProfile(val, challenge); };
  const setChallenge   = (val)  => { setChallengeRaw(val); syncProfile(profile, val);  };

  const toastTimer = useRef(null);
  const showToast  = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  };

  const handleLogin  = (pw) => { if (pw === PASSWORD) { setAuthed(true); return true; } return false; };
  const handleLogout = ()   => { setAuthed(false); setPage('today'); };

  const currentWeight = useMemo(() => {
    if (!weights.length) return null;
    return Number([...weights].sort((a, b) => b.date.localeCompare(a.date))[0].weight);
  }, [weights]);

  const restAdvice = useMemo(() => getRestAdvice(workouts), [workouts]);

  if (!authed) return <Login onLogin={handleLogin} darkMode={darkMode} />;
  if (!loaded) return <LoadingScreen syncing={syncing} />;

  const trtAlert = new Date().getDay() === 4 && !trtLogs.some((t) => t.date === todayISO());

  const nav = [
    { id: 'today',       label: 'Today',          icon: Sun },
    { id: 'dashboard',   label: 'Dashboard',      icon: LayoutDashboard },
    { id: 'log',         label: 'Log Workout',    icon: Plus },
    { id: 'history',     label: 'History',        icon: Activity },
    { id: 'weight',      label: 'Weight',         icon: Scale },
    { id: 'analytics',   label: 'Analytics',      icon: BarChart2 },
    { id: 'goal',        label: 'Goal Planner',   icon: Target },
    { id: 'records',     label: 'Records',        icon: Trophy },
    { id: 'badges',      label: 'Badges',         icon: Award },
    { id: 'supplements', label: 'Supplements',    icon: Pill },
    { id: 'trt',         label: 'TRT',            icon: Syringe, alert: trtAlert },
    { id: 'labs',        label: 'Lab Results',    icon: FlaskConical },
    { id: 'journal',     label: 'Journal',        icon: BookOpen },
    { id: 'review',      label: 'Weekly Review',  icon: CalendarCheck },
    { id: 'settings',    label: 'Settings',       icon: Settings },
  ];

  const pageProps = {
    workouts, setWorkouts, weights, setWeights,
    supplements, setSupplements, trtLogs, setTrtLogs,
    profile, setProfile, challenge, setChallenge,
    currentWeight, showToast, setPage,
    syncWorkout, deleteWorkout, syncWeight, deleteWeight,
    syncSupplement, deleteSupplement, syncTrtLog, deleteTrtLog,
    clearAllRemote,
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>HYBRID<br /><span>HUSTLER</span></h1>
          <p>Fitness OS</p>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {nav.map((n) => (
            <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
              <n.icon size={18} />
              {n.label}
              {n.alert && (
                <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: 'var(--warn)', flexShrink: 0 }} />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          {/* Rest intelligence */}
          {restAdvice && (
            <div style={{
              padding: '10px 12px', marginBottom: 12,
              background: 'var(--bg-3)', border: `1px solid ${restAdvice.color}33`,
              borderLeft: `3px solid ${restAdvice.color}`,
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: 1, color: restAdvice.color, marginBottom: 3 }}>
                {restAdvice.icon} {restAdvice.title.toUpperCase()}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                {restAdvice.message}
              </div>
            </div>
          )}

          {/* Dark / Light toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 1,
              color: 'var(--text-mute)', padding: '8px 0', marginBottom: 8,
              background: 'none', border: 'none', cursor: 'pointer',
              textTransform: 'uppercase', transition: 'color 0.15s',
            }}
          >
            {darkMode ? <Sun size={13} /> : <Moon size={13} />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* Sync status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: 1,
            color: syncError ? 'var(--warn)' : 'var(--text-mute)', marginBottom: 12,
          }}>
            {syncing ? <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> SYNCING</>
              : syncError ? <><WifiOff size={12} /> OFFLINE</>
              : hasSupabase() ? <><Wifi size={12} /> SYNCED</>
              : <><WifiOff size={12} /> LOCAL ONLY</>}
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main">
        {page === 'today'       && <Today        {...pageProps} />}
        {page === 'dashboard'   && <Dashboard    {...pageProps} />}
        {page === 'log'         && <LogWorkout   {...pageProps} />}
        {page === 'history'     && <History      {...pageProps} />}
        {page === 'weight'      && <WeightTracker {...pageProps} />}
        {page === 'analytics'   && <Analytics    {...pageProps} />}
        {page === 'goal'        && <GoalPlanner  {...pageProps} />}
        {page === 'records'     && <Records      {...pageProps} />}
        {page === 'badges'      && <Badges       {...pageProps} />}
        {page === 'supplements' && <Supplements  {...pageProps} />}
        {page === 'trt'         && <TRTTracker   {...pageProps} />}
        {page === 'labs'        && <LabResults   {...pageProps} />}
        {page === 'journal'     && <Journal      {...pageProps} />}
        {page === 'review'      && <WeeklyReview {...pageProps} />}
        {page === 'settings'    && <SettingsPage {...pageProps} />}
      </main>

      {toast && <div className="toast">{toast}</div>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function LoadingScreen({ syncing }) {
  return (
    <div className="login-screen">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 56, letterSpacing: 2, marginBottom: 24, lineHeight: 0.9 }}>
          HYBRID<br /><span style={{ color: 'var(--accent)' }}>HUSTLER</span>
        </div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 3,
          color: 'var(--text-mute)', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
          {syncing ? 'Syncing your data...' : 'Loading...'}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function Login({ onLogin }) {
  const [pw, setPw]     = useState('');
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
          <input type="password" className="login-input" value={pw}
            onChange={(e) => { setPw(e.target.value); setError(''); }} autoFocus />
          {error && <div className="login-error">! {error}</div>}
          <button type="submit" className="login-button">Enter →</button>
        </form>
        {!hasSupabase() && (
          <div style={{ marginTop: 16, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: 1 }}>
            ⚠ Supabase not configured — running local only
          </div>
        )}
      </div>
    </div>
  );
}
