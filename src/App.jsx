import { useState, useEffect, useRef, useMemo } from 'react';
import {
  LayoutDashboard, Plus, Scale, Target, Trophy, Award,
  LogOut, Settings, Activity, BarChart2, Pill, Syringe, Sun,
  Wifi, WifiOff, RefreshCw,
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

const DEFAULT_PROFILE = {
  name: 'John',
  heightFt: 5, heightIn: 10, age: 40, sex: 'male',
  dailyCalorieGoal: 300, activityLevel: 'light',
};
const DEFAULT_CHALLENGE = {
  startDate: todayISO(), months: 3, startWeight: null, goalWeight: null,
};

export default function App() {
  const [authed, setAuthed]       = useState(() => storage.get('auth', false));
  const [page, setPage]           = useState('today');
  const [toast, setToast]         = useState('');
  const [syncing, setSyncing]     = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [loaded, setLoaded]       = useState(false);

  // Core data state — initialised from localStorage, then overwritten by Supabase on load
  const [workouts,    setWorkoutsRaw]    = useState(() => storage.get('workouts', []));
  const [weights,     setWeightsRaw]     = useState(() => storage.get('weights', []));
  const [supplements, setSupplementsRaw] = useState(() => storage.get('supplements', []));
  const [trtLogs,     setTrtLogsRaw]     = useState(() => storage.get('trtLogs', []));
  const [profile,     setProfileRaw]     = useState(() => storage.get('profile', DEFAULT_PROFILE));
  const [challenge,   setChallengeRaw]   = useState(() => storage.get('challenge', DEFAULT_CHALLENGE));

  // ── Keep localStorage in sync on every state change ───────
  useEffect(() => storage.set('workouts',    workouts),    [workouts]);
  useEffect(() => storage.set('weights',     weights),     [weights]);
  useEffect(() => storage.set('supplements', supplements), [supplements]);
  useEffect(() => storage.set('trtLogs',     trtLogs),     [trtLogs]);
  useEffect(() => storage.set('profile',     profile),     [profile]);
  useEffect(() => storage.set('challenge',   challenge),   [challenge]);
  useEffect(() => storage.set('auth',        authed),      [authed]);

  // ── Load from Supabase on login ───────────────────────────
  const loadFromSupabase = async () => {
    if (!hasSupabase()) { setLoaded(true); return; }
    setSyncing(true);
    setSyncError(false);
    try {
      const localData = {
        workouts:    storage.get('workouts', []),
        weights:     storage.get('weights', []),
        supplements: storage.get('supplements', []),
        trtLogs:     storage.get('trtLogs', []),
        profile:     storage.get('profile', DEFAULT_PROFILE),
        challenge:   storage.get('challenge', DEFAULT_CHALLENGE),
      };

      // First time: migrate existing localStorage data up to Supabase
      await migrateIfNeeded(localData);

      // Merge remote + local
      const merged = await loadAllData(localData);
      setWorkoutsRaw(merged.workouts);
      setWeightsRaw(merged.weights);
      setSupplementsRaw(merged.supplements);
      setTrtLogsRaw(merged.trtLogs);
      setProfileRaw(merged.profile);
      setChallengeRaw(merged.challenge);
    } catch (err) {
      console.warn('[App] Supabase load failed, using localStorage:', err.message);
      setSyncError(true);
    } finally {
      setSyncing(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    if (authed) loadFromSupabase();
    else setLoaded(false);
  }, [authed]);

  // ── Wrapped setters: update state + sync to Supabase ──────

  const setWorkouts = (next) => {
    const val = typeof next === 'function' ? next(workouts) : next;
    setWorkoutsRaw(val);
    // Sync happens via History/LogWorkout passing the specific item
  };

  const setWeights = (val) => setWeightsRaw(val);
  const setSupplements = (val) => setSupplementsRaw(val);
  const setTrtLogs = (val) => setTrtLogsRaw(val);

  const setProfile = (val) => {
    setProfileRaw(val);
    syncProfile(val, challenge);
  };

  const setChallenge = (val) => {
    setChallengeRaw(val);
    syncProfile(profile, val);
  };

  // ── Toast ─────────────────────────────────────────────────
  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  };

  // ── Auth ──────────────────────────────────────────────────
  const handleLogin = (pw) => {
    if (pw === PASSWORD) { setAuthed(true); return true; }
    return false;
  };
  const handleLogout = () => { setAuthed(false); setPage('today'); };

  // ── Derived ───────────────────────────────────────────────
  const currentWeight = useMemo(() => {
    if (!weights.length) return null;
    return Number([...weights].sort((a, b) => b.date.localeCompare(a.date))[0].weight);
  }, [weights]);

  if (!authed) return <Login onLogin={handleLogin} />;

  if (!loaded) return <LoadingScreen syncing={syncing} />;

  const dayOfWeek = new Date().getDay();
  const isTrtDay = dayOfWeek === 4 || dayOfWeek === 3;
  const trtLoggedToday = trtLogs.some((t) => t.date === todayISO());
  const trtAlert = isTrtDay && !trtLoggedToday;

  const nav = [
    { id: 'today',       label: 'Today',       icon: Sun },
    { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
    { id: 'log',         label: 'Log Workout', icon: Plus },
    { id: 'history',     label: 'History',     icon: Activity },
    { id: 'weight',      label: 'Weight',      icon: Scale },
    { id: 'analytics',   label: 'Analytics',   icon: BarChart2 },
    { id: 'goal',        label: 'Goal Planner',icon: Target },
    { id: 'records',     label: 'Records',     icon: Trophy },
    { id: 'badges',      label: 'Badges',      icon: Award },
    { id: 'supplements', label: 'Supplements', icon: Pill },
    { id: 'trt',         label: 'TRT',         icon: Syringe, alert: trtAlert },
    { id: 'settings',    label: 'Settings',    icon: Settings },
  ];

  const pageProps = {
    workouts, setWorkouts,
    weights,  setWeights,
    supplements, setSupplements,
    trtLogs, setTrtLogs,
    profile, setProfile,
    challenge, setChallenge,
    currentWeight, showToast, setPage,
    // Supabase-aware helpers passed down to pages
    syncWorkout, deleteWorkout,
    syncWeight, deleteWeight,
    syncSupplement, deleteSupplement,
    syncTrtLog, deleteTrtLog,
    clearAllRemote,
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
          {/* Sync status indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: 1,
            color: syncError ? 'var(--warn)' : 'var(--text-mute)',
            marginBottom: 12,
          }}>
            {syncing
              ? <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> SYNCING</>
              : syncError
              ? <><WifiOff size={12} /> OFFLINE</>
              : hasSupabase()
              ? <><Wifi size={12} /> SYNCED</>
              : <><WifiOff size={12} /> LOCAL ONLY</>
            }
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main">
        {page === 'today'       && <Today       {...pageProps} />}
        {page === 'dashboard'   && <Dashboard   {...pageProps} />}
        {page === 'log'         && <LogWorkout  {...pageProps} />}
        {page === 'history'     && <History     {...pageProps} />}
        {page === 'weight'      && <WeightTracker {...pageProps} />}
        {page === 'analytics'   && <Analytics   {...pageProps} />}
        {page === 'goal'        && <GoalPlanner {...pageProps} />}
        {page === 'records'     && <Records     {...pageProps} />}
        {page === 'badges'      && <Badges      {...pageProps} />}
        {page === 'supplements' && <Supplements {...pageProps} />}
        {page === 'trt'         && <TRTTracker  {...pageProps} />}
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
        <div style={{
          fontFamily: 'var(--display)', fontSize: 56, letterSpacing: 2,
          marginBottom: 24, lineHeight: 0.9,
        }}>
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
        {!hasSupabase() && (
          <div style={{
            marginTop: 16, fontFamily: 'var(--mono)', fontSize: 10,
            color: 'var(--text-mute)', letterSpacing: 1,
          }}>
            ⚠ Supabase not configured — running local only
          </div>
        )}
      </div>
    </div>
  );
}
