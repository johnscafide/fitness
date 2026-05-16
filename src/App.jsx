import { useState, useEffect, useRef, useMemo } from 'react';
import {
  LayoutDashboard, Plus, Scale, Target, Trophy, Award,
  LogOut, Settings, Activity, BarChart2, Pill, Syringe, Sun,
  Wifi, WifiOff, RefreshCw, BookOpen, FlaskConical, CalendarCheck, Moon,
  Map, Camera, Calendar, BarChart, User, ArrowLeftRight,
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
import { getRestAdvice }   from './restIntelligence';
import { VersionBadge }    from './changelog.jsx';
import { WeatherWidget }   from './weather.jsx';

import Dashboard          from './pages/Dashboard';
import Today              from './pages/Today';
import LogWorkout         from './pages/LogWorkout';
import WeightTracker      from './pages/WeightTracker';
import GoalPlanner        from './pages/GoalPlanner';
import Records            from './pages/Records';
import Badges             from './pages/Badges';
import History            from './pages/History';
import SettingsPage       from './pages/SettingsPage';
import Analytics          from './pages/Analytics';
import Supplements        from './pages/Supplements';
import TRTTracker         from './pages/TRTTracker';
import WeeklyReview       from './pages/WeeklyReview';
import Journal            from './pages/Journal';
import LabResults         from './pages/LabResults';
import JourneyMap         from './pages/JourneyMap';
import ProgressPhotos     from './pages/ProgressPhotos';
import ActivityCalendar   from './pages/ActivityCalendar';
import ProgressComparison from './pages/ProgressComparison';

const PASSWORD = 'fitness';

const DEFAULT_PROFILE = {
  name: 'John', heightFt: 5, heightIn: 10, age: 40, sex: 'male',
  dailyCalorieGoal: 300, activityLevel: 'light',
  displayName: '', photoB64: '',
};
const DEFAULT_CHALLENGE = {
  startDate: todayISO(), months: 3, startWeight: null, goalWeight: null,
};

// ── Theme ─────────────────────────────────────────────────
const LIGHT_VARS = `
  :root {
    --bg:#f2f2f2;--bg-2:#ffffff;--bg-3:#e8e8e8;
    --border:#d0d0d0;--border-2:#bbb;
    --text:#111;--text-dim:#444;--text-mute:#888;
    --accent:#5a9e00;--accent-2:#4a8400;
    --danger:#cc2222;--warn:#c47a00;--info:#1a6ebb;
  }
  body{background:#f2f2f2;}
  .login-screen{background:#f2f2f2;}
`;

const applyTheme = (dark) => {
  const old = document.getElementById('theme-override');
  if (old) old.remove();
  if (!dark) {
    const s = document.createElement('style');
    s.id = 'theme-override';
    s.textContent = LIGHT_VARS;
    document.head.appendChild(s);
  }
};

// ── Animated counter ──────────────────────────────────────
function AnimatedNumber({ target, decimals = 1, duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return <>{val.toFixed(decimals)}</>;
}

export default function App() {
  const [authed,    setAuthed]    = useState(() => storage.get('auth', false));
  const [page,      setPage]      = useState('today');
  const [toast,     setToast]     = useState('');
  const [syncing,   setSyncing]   = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [loaded,    setLoaded]    = useState(false);
  const [darkMode,  setDarkMode]  = useState(() => storage.get('darkMode', true));

  const [workouts,    setWorkoutsRaw]    = useState(() => storage.get('workouts', []));
  const [weights,     setWeightsRaw]     = useState(() => storage.get('weights', []));
  const [supplements, setSupplementsRaw] = useState(() => storage.get('supplements', []));
  const [trtLogs,     setTrtLogsRaw]     = useState(() => storage.get('trtLogs', []));
  const [profile,     setProfileRaw]     = useState(() => storage.get('profile', DEFAULT_PROFILE));
  const [challenge,   setChallengeRaw]   = useState(() => storage.get('challenge', DEFAULT_CHALLENGE));

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
      const local = {
        workouts:    storage.get('workouts', []),
        weights:     storage.get('weights', []),
        supplements: storage.get('supplements', []),
        trtLogs:     storage.get('trtLogs', []),
        profile:     storage.get('profile', DEFAULT_PROFILE),
        challenge:   storage.get('challenge', DEFAULT_CHALLENGE),
      };
      await migrateIfNeeded(local);
      const merged = await loadAllData(local);
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

  const setWorkouts    = (n)   => setWorkoutsRaw(typeof n === 'function' ? n(workouts) : n);
  const setWeights     = (v)   => setWeightsRaw(v);
  const setSupplements = (v)   => setSupplementsRaw(v);
  const setTrtLogs     = (v)   => setTrtLogsRaw(v);
  const setProfile     = (v)   => { setProfileRaw(v);   syncProfile(v, challenge); };
  const setChallenge   = (v)   => { setChallengeRaw(v); syncProfile(profile, v);  };

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

  // Weight loss = earliest logged weight minus current
  const weightLost = useMemo(() => {
    if (weights.length < 2) return null;
    const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
    const diff = Number(sorted[0].weight) - Number(sorted[sorted.length - 1].weight);
    return diff > 0 ? diff : null;
  }, [weights]);

  const restAdvice = useMemo(() => getRestAdvice(workouts), [workouts]);

  if (!authed) return <Login onLogin={handleLogin} />;
  if (!loaded) return <LoadingScreen syncing={syncing} />;

  const trtAlert = new Date().getDay() === 4 && !trtLogs.some((t) => t.date === todayISO());

  const nav = [
    { id: 'today',       label: 'Today',          icon: Sun },
    { id: 'dashboard',   label: 'Dashboard',      icon: LayoutDashboard },
    { id: 'log',         label: 'Log Workout',    icon: Plus },
    { id: 'history',     label: 'History',        icon: Activity },
    { id: 'calendar',    label: 'Calendar',       icon: Calendar },
    { id: 'weight',      label: 'Weight',         icon: Scale },
    { id: 'analytics',   label: 'Analytics',      icon: BarChart2 },
    { id: 'compare',     label: 'Compare',        icon: ArrowLeftRight },
    { id: 'goal',        label: 'Goal Planner',   icon: Target },
    { id: 'journey',     label: 'Journey Map',    icon: Map },
    { id: 'photos',      label: 'Progress Photos',icon: Camera },
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

  const displayName  = profile.displayName || profile.name || 'Hybrid Hustler';
  const photoB64     = profile.photoB64 || '';

  return (
    <div className="app">
      <aside className="sidebar">
        {/* Brand / Profile */}
        <div className="sidebar-brand" style={{ paddingBottom: 16 }}>
          {/* Photo + name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {photoB64 ? (
              <img src={photoB64} alt="Profile"
                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)', flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'var(--bg-3)', border: '2px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <User size={22} color="var(--text-mute)" />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontFamily: 'var(--display)', fontSize: 18, letterSpacing: 1, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName.toUpperCase()}
              </h1>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 2, color: 'var(--text-mute)', marginTop: 2, textTransform: 'uppercase' }}>
                Fitness OS
              </p>
            </div>
          </div>

          {/* Weight loss counter */}
          {weightLost !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(198,255,61,0.08)', border: '1px solid rgba(198,255,61,0.25)',
              padding: '6px 10px',
            }}>
              <span style={{ fontSize: 16 }}>📉</span>
              <div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: 'var(--accent)', lineHeight: 1, letterSpacing: 1 }}>
                  <AnimatedNumber target={weightLost} decimals={1} /> lbs
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-mute)', letterSpacing: 1, textTransform: 'uppercase' }}>
                  lost so far
                </div>
              </div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {nav.map((n) => (
            <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
              <n.icon size={16} />
              {n.label}
              {n.alert && (
                <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: 'var(--warn)', flexShrink: 0 }} />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          {/* Rest intelligence */}
          {restAdvice && (
            <div style={{
              padding: '8px 10px', marginBottom: 10,
              background: 'var(--bg-3)', border: `1px solid ${restAdvice.color}33`,
              borderLeft: `3px solid ${restAdvice.color}`,
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 1, color: restAdvice.color, marginBottom: 2, textTransform: 'uppercase' }}>
                {restAdvice.icon} {restAdvice.title}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                {restAdvice.message}
              </div>
            </div>
          )}

          {/* Dark/light */}
          <button onClick={() => setDarkMode(!darkMode)} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: 1,
            color: 'var(--text-mute)', padding: '6px 0', marginBottom: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            textTransform: 'uppercase', transition: 'color 0.15s',
          }}>
            {darkMode ? <Sun size={12} /> : <Moon size={12} />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* Sync */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 1,
            color: syncError ? 'var(--warn)' : 'var(--text-mute)', marginBottom: 8,
          }}>
            {syncing ? <><RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> SYNCING</>
              : syncError ? <><WifiOff size={11} /> OFFLINE</>
              : hasSupabase() ? <><Wifi size={11} /> SYNCED</>
              : <><WifiOff size={11} /> LOCAL ONLY</>}
          </div>

          {/* Bottom row: sign out + version */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={13} /> Sign Out
            </button>
            <VersionBadge />
          </div>
        </div>
      </aside>

      <main className="main">
        {/* Weather strip on every page */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <WeatherWidget />
        </div>

        {page === 'today'       && <Today              {...pageProps} />}
        {page === 'dashboard'   && <Dashboard          {...pageProps} />}
        {page === 'log'         && <LogWorkout         {...pageProps} />}
        {page === 'history'     && <History            {...pageProps} />}
        {page === 'calendar'    && <ActivityCalendar   {...pageProps} />}
        {page === 'weight'      && <WeightTracker      {...pageProps} />}
        {page === 'analytics'   && <Analytics          {...pageProps} />}
        {page === 'compare'     && <ProgressComparison {...pageProps} />}
        {page === 'goal'        && <GoalPlanner        {...pageProps} />}
        {page === 'journey'     && <JourneyMap         {...pageProps} />}
        {page === 'photos'      && <ProgressPhotos     {...pageProps} />}
        {page === 'records'     && <Records            {...pageProps} />}
        {page === 'badges'      && <Badges             {...pageProps} />}
        {page === 'supplements' && <Supplements        {...pageProps} />}
        {page === 'trt'         && <TRTTracker         {...pageProps} />}
        {page === 'labs'        && <LabResults         {...pageProps} />}
        {page === 'journal'     && <Journal            {...pageProps} />}
        {page === 'review'      && <WeeklyReview       {...pageProps} />}
        {page === 'settings'    && <SettingsPage       {...pageProps} />}
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
  const [pw, setPw]       = useState('');
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
