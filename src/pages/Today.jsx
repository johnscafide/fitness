import { useMemo, useRef } from 'react';
import { CheckCircle, Circle, Download } from 'lucide-react';
import { todayISO, fmtNum } from '../storage';
import {
  getTodayChallenges, getWeeklyChallenges, getMonthlyChallenges,
  getActiveEventChallenges, computeChallengeStats,
  evalCheck, evalProgress,
  recordChallengeComplete, importDLCPack, validateDLCPack, SAMPLE_DLC_PACK,
} from '../challenges';

export default function Today({ workouts, weights, supplements, trtLogs, profile, setPage, showToast }) {
  const today   = todayISO();
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const fileRef = useRef(null);

  const todayWorkouts  = workouts.filter((w) => w.date === today);
  const todayCals      = todayWorkouts.reduce((s, w) => s + (Number(w.calories) || 0), 0);
  const todayMins      = todayWorkouts.reduce((s, w) => s + (Number(w.minutes)  || 0), 0);
  const hitGoal        = todayCals >= (profile.dailyCalorieGoal || 300);
  const goalPct        = Math.min(100, profile.dailyCalorieGoal ? (todayCals / profile.dailyCalorieGoal) * 100 : 0);

  const todaySupps        = useMemo(() => supplements.filter((s) => s.date === today), [supplements, today]);
  const loggedWeightToday = weights.some((w) => w.date === today);

  const dayOfWeek      = new Date().getDay();
  const isTrtDay       = dayOfWeek === 4;   // Thursday only
  const trtLoggedToday = (trtLogs || []).some((t) => t.date === today);

  const DEFAULT_SUPPS = ['Vitamin D3+K2', 'Magnesium'];
  const suppChecked   = (name) => todaySupps.some((s) =>
    s.name.toLowerCase().includes(name.toLowerCase())
  );

  const cStats = useMemo(
    () => computeChallengeStats(workouts, weights, supplements, trtLogs, profile),
    [workouts, weights, supplements, trtLogs, profile]
  );

  const dailyChallenges   = useMemo(() => getTodayChallenges(),       [today]);
  const weeklyChallenges  = useMemo(() => getWeeklyChallenges(),      [today]);
  const monthlyChallenges = useMemo(() => getMonthlyChallenges(),     [today]);
  const eventChallenges   = useMemo(() => getActiveEventChallenges(), [today]);

  // Record completed challenges to lifetime history
  useMemo(() => {
    [...dailyChallenges, ...weeklyChallenges, ...monthlyChallenges, ...eventChallenges].forEach((c) => {
      try {
        if (evalCheck(c.check, cStats)) recordChallengeComplete(c.id, c.name, today);
      } catch { /* never crash on a bad DLC challenge */ }
    });
  }, [cStats]);

  // DLC import
  const handleDLCImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const pack   = JSON.parse(ev.target.result);
        const errors = validateDLCPack(pack);
        if (errors.length) { showToast('Invalid pack: ' + errors[0]); return; }
        importDLCPack(pack);
        showToast(`Imported: ${pack.name}`);
      } catch {
        showToast('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadSample = () => {
    const blob = new Blob([JSON.stringify(SAMPLE_DLC_PACK, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'holiday-hustle-2026.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Sample DLC downloaded');
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">
            {dayName.toUpperCase().slice(0, 4)}<span>{dayName.toUpperCase().slice(4)}</span>
          </div>
          <div className="page-sub">// {dateStr}</div>
        </div>
        <button className="btn" onClick={() => setPage('log')}>+ Log Workout</button>
      </div>

      {/* Status bar */}
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="card stat-card" style={{ borderColor: hitGoal ? 'var(--accent)' : 'var(--border)' }}>
          <div className="stat-label">Today's Burn</div>
          <div><span className={`stat-value ${hitGoal ? 'accent' : ''}`}>{fmtNum(todayCals)}</span><span className="stat-unit">cal</span></div>
          <div style={{ marginTop: 8 }}>
            <div style={{ height: 6, background: 'var(--bg)', border: '1px solid var(--border-2)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${goalPct}%`, background: hitGoal ? 'var(--accent)' : 'var(--info)', transition: 'width 0.4s' }} />
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 4 }}>
              {fmtNum(goalPct)}% of {profile.dailyCalorieGoal} goal
            </div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-label">Time Logged</div>
          <div><span className="stat-value">{fmtNum(todayMins)}</span><span className="stat-unit">min</span></div>
          <div className="stat-delta">{todayWorkouts.length} workout{todayWorkouts.length !== 1 ? 's' : ''} today</div>
        </div>

        <div className="card stat-card">
          <div className="stat-label">Streak</div>
          <div><span className="stat-value warn">{cStats.currentStreak}</span><span className="stat-unit">days</span></div>
          <div className="stat-delta">🔥 Keep it going</div>
        </div>
      </div>

      {/* Checklist + today's workouts */}
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-title">Daily Checklist</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <CheckItem label="Logged a workout"    done={todayWorkouts.length > 0} onClick={() => setPage('log')} />
            <CheckItem label="Hit calorie burn goal" done={hitGoal} sub={`${fmtNum(todayCals)} / ${profile.dailyCalorieGoal} cal`} />
            <CheckItem label="Weighed in today"    done={loggedWeightToday}        onClick={() => setPage('weight')} />
            {DEFAULT_SUPPS.map((name) => (
              <CheckItem key={name} label={name} done={suppChecked(name)} onClick={() => setPage('supplements')} />
            ))}
            {isTrtDay && (
              <CheckItem label="TRT Injection" done={trtLoggedToday} onClick={() => setPage('trt')} highlight />
            )}
          </div>
        </div>

        <div className="card">
          <div className="section-title">Today's Workouts</div>
          {todayWorkouts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💤</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-mute)', marginBottom: 16 }}>Nothing logged yet</div>
              <button className="btn" onClick={() => setPage('log')}>Log First Workout</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayWorkouts.map((w) => (
                <div key={w.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border-2)',
                }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                      <span className={`tag ${w.type}`}>{w.type}</span>
                      <span style={{ fontSize: 13 }}>{w.equipment}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                      {w.minutes} min{w.miles ? ` · ${w.miles} mi` : ''}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 28, color: 'var(--accent)' }}>
                    {fmtNum(w.calories)}<span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}> cal</span>
                  </div>
                </div>
              ))}
              <button className="btn secondary small" onClick={() => setPage('log')}>+ Add Another</button>
            </div>
          )}
        </div>
      </div>

      {/* Event challenges */}
      {eventChallenges.length > 0 && (
        <>
          <div className="section-title">Active Event Challenges</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {eventChallenges.map((c) => (
              <SafeEventCard key={c.id} challenge={c} stats={cStats} />
            ))}
          </div>
        </>
      )}

      {/* Daily */}
      <div className="section-title">Today's Challenges</div>
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        {dailyChallenges.map((c) => <SafeChallengeCard key={c.id} challenge={c} stats={cStats} period="Daily" />)}
      </div>

      {/* Weekly */}
      <div className="section-title">This Week's Challenges</div>
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        {weeklyChallenges.map((c) => <SafeChallengeCard key={c.id} challenge={c} stats={cStats} period="Weekly" />)}
      </div>

      {/* Monthly */}
      <div className="section-title">This Month's Challenges</div>
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        {monthlyChallenges.map((c) => <SafeChallengeCard key={c.id} challenge={c} stats={cStats} period="Monthly" />)}
      </div>

      {/* DLC import */}
      <div className="card" style={{ borderColor: 'rgba(198,255,61,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="section-title">Challenge DLC Packs</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, maxWidth: 500 }}>
              Import downloadable challenge packs to add seasonal events and special challenges.
              All completed challenges are saved to your lifetime history.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn secondary small" onClick={downloadSample}>
              <Download size={12} /> Sample Pack
            </button>
            <button className="btn small" onClick={() => fileRef.current.click()}>
              + Import Pack
            </button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleDLCImport} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Safe wrappers — catch any runtime error from bad DLC ──

function SafeChallengeCard({ challenge, stats, period }) {
  try {
    const done = evalCheck(challenge.check, stats);
    const prog = evalProgress(challenge.progress, stats);
    return <ChallengeCard challenge={challenge} done={done} prog={prog} period={period} />;
  } catch {
    return null; // silently drop broken DLC challenges
  }
}

function SafeEventCard({ challenge, stats }) {
  try {
    const done = evalCheck(challenge.check, stats);
    const prog = evalProgress(challenge.progress, stats);
    return <EventChallengeCard challenge={challenge} done={done} prog={prog} />;
  } catch {
    return null;
  }
}

// ── Challenge card with progress bar ─────────────────────
function ChallengeCard({ challenge, done, prog, period }) {
  const pct = prog ? Math.min(100, prog.target > 0 ? (prog.current / prog.target) * 100 : 0) : null;

  const fmt = (n, f) => {
    if (f === '0.00') return Number(n).toFixed(2);
    if (f === '0.1')  return Number(n).toFixed(1);
    return Math.round(n).toLocaleString();
  };

  return (
    <div className="card" style={{
      borderColor: done ? 'var(--accent)' : challenge.dlc ? 'rgba(77,159,255,0.3)' : 'var(--border)',
      background:  done ? 'linear-gradient(135deg, var(--bg-2), rgba(198,255,61,0.06))' : 'var(--bg-2)',
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: 28 }}>{challenge.icon}</span>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
          color: done ? 'var(--accent)' : challenge.dlc ? 'var(--info)' : 'var(--text-mute)',
          border: `1px solid ${done ? 'rgba(198,255,61,0.4)' : challenge.dlc ? 'rgba(77,159,255,0.3)' : 'var(--border)'}`,
          padding: '2px 6px',
        }}>
          {done ? '✓ Done' : challenge.dlc ? 'DLC' : period}
        </span>
      </div>

      <div style={{ fontFamily: 'var(--display)', fontSize: 19, letterSpacing: 1, marginBottom: 4, lineHeight: 1.1 }}>
        {challenge.name}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4, marginBottom: prog ? 10 : 0 }}>
        {challenge.desc}
      </div>

      {prog && pct !== null && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: done ? 'var(--accent)' : 'var(--text-dim)' }}>
              {fmt(prog.current, prog.format)} / {fmt(prog.target, prog.format)} {prog.unit}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: done ? 'var(--accent)' : 'var(--text-mute)' }}>
              {Math.round(pct)}%
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--bg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: done ? 'var(--accent)' : 'var(--info)',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Event challenge card (wide, prominent) ────────────────
function EventChallengeCard({ challenge, done, prog }) {
  const pct      = prog ? Math.min(100, prog.target > 0 ? (prog.current / prog.target) * 100 : 0) : null;
  const today    = todayISO();
  const end      = challenge.period?.end;
  const daysLeft = end
    ? Math.max(0, Math.round((new Date(end + 'T00:00:00') - new Date(today + 'T00:00:00')) / 86400000))
    : null;

  return (
    <div className="card" style={{
      borderColor: done ? 'var(--accent)' : 'rgba(255,176,32,0.5)',
      background:  done
        ? 'linear-gradient(135deg, var(--bg-2), rgba(198,255,61,0.06))'
        : 'linear-gradient(135deg, var(--bg-2), rgba(255,176,32,0.05))',
    }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 40 }}>{challenge.icon}</div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 26, letterSpacing: 1 }}>{challenge.name}</div>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
              color: 'var(--warn)', border: '1px solid rgba(255,176,32,0.4)', padding: '2px 6px',
            }}>
              {challenge.dlc || 'Seasonal Event'}
            </span>
            {done && (
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
                color: 'var(--accent)', border: '1px solid rgba(198,255,61,0.4)', padding: '2px 6px',
              }}>✓ Complete</span>
            )}
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.5 }}>
            {challenge.desc}
          </div>

          {prog && pct !== null && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: done ? 'var(--accent)' : 'var(--text-dim)' }}>
                  {Math.round(prog.current).toLocaleString()} / {Math.round(prog.target).toLocaleString()} {prog.unit}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: done ? 'var(--accent)' : 'var(--text-mute)' }}>
                  {Math.round(pct)}%{!done && daysLeft !== null ? ` · ${daysLeft}d left` : ''}
                </span>
              </div>
              <div style={{ height: 8, background: 'var(--bg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: done ? 'var(--accent)' : 'linear-gradient(90deg, var(--warn), #ff6b35)',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          )}

          {challenge.reward && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 10, letterSpacing: 1 }}>
              REWARD: {challenge.reward}
            </div>
          )}
        </div>

        {/* Calories/day needed to finish */}
        {prog && !done && daysLeft > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginBottom: 4 }}>NEEDED/DAY</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 32, color: 'var(--warn)', lineHeight: 1 }}>
              {Math.ceil((prog.target - prog.current) / daysLeft).toLocaleString()}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>{prog.unit}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckItem({ label, done, onClick, sub, highlight }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', gap: 12, alignItems: 'center',
      cursor: onClick ? 'pointer' : 'default',
      padding: '8px 10px',
      background: done ? 'rgba(198,255,61,0.06)' : 'var(--bg)',
      border: `1px solid ${done ? 'rgba(198,255,61,0.3)' : highlight ? 'rgba(255,176,32,0.4)' : 'var(--border)'}`,
      transition: 'all 0.15s',
    }}>
      {done
        ? <CheckCircle size={18} color="var(--accent)" />
        : <Circle size={18} color={highlight ? 'var(--warn)' : 'var(--text-mute)'} />
      }
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: done ? 'var(--text)' : 'var(--text-dim)' }}>{label}</div>
        {sub && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>{sub}</div>}
      </div>
      {highlight && !done && (
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--warn)', letterSpacing: 1 }}>TODAY</span>
      )}
    </div>
  );
}
