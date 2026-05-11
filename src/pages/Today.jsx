import { useMemo } from 'react';
import { CheckCircle, Circle, Plus, Syringe, Pill, Flame } from 'lucide-react';
import { todayISO, fmtNum } from '../storage';
import { getTodayChallenges, getWeeklyChallenges, getMonthlyChallenges, computeChallengeStats } from '../challenges';

export default function Today({ workouts, weights, supplements, trtLogs, profile, setPage, showToast }) {
  const today = todayISO();
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const todayWorkouts = workouts.filter((w) => w.date === today);
  const todayCals = todayWorkouts.reduce((s, w) => s + (Number(w.calories) || 0), 0);
  const todayMins = todayWorkouts.reduce((s, w) => s + (Number(w.minutes) || 0), 0);
  const hitGoal = todayCals >= (profile.dailyCalorieGoal || 300);

  const todaySupps = useMemo(() => supplements.filter((s) => s.date === today), [supplements, today]);
  const loggedWeightToday = weights.some((w) => w.date === today);

  // Is today a TRT day? (Thursday = 4, Wednesday = 3)
  const dayOfWeek = new Date().getDay();
  const isTrtDay = dayOfWeek === 4 || dayOfWeek === 3;
  const trtLoggedToday = (trtLogs || []).some((t) => t.date === today);

  // Default supplement checklist
  const DEFAULT_SUPPS = ['Vitamin D3+K2', 'Magnesium'];
  const suppChecked = (name) => todaySupps.some((s) => s.name === name);

  // Challenges
  const cStats = useMemo(
    () => computeChallengeStats(workouts, weights, supplements, trtLogs, profile),
    [workouts, weights, supplements, trtLogs, profile]
  );
  const dailyChallenges = getTodayChallenges();
  const weeklyChallenges = getWeeklyChallenges();
  const monthlyChallenges = getMonthlyChallenges();

  const goalPct = Math.min(100, profile.dailyCalorieGoal ? (todayCals / profile.dailyCalorieGoal) * 100 : 0);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">{dayName.toUpperCase().slice(0, 4)}<span>{dayName.toUpperCase().slice(4)}</span></div>
          <div className="page-sub">// {dateStr}</div>
        </div>
        <button className="btn" onClick={() => setPage('log')}>+ Log Workout</button>
      </div>

      {/* Today status bar */}
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

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        {/* Daily Checklist */}
        <div className="card">
          <div className="section-title">Daily Checklist</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <CheckItem
              label="Logged a workout"
              done={todayWorkouts.length > 0}
              onClick={() => setPage('log')}
            />
            <CheckItem
              label="Hit calorie burn goal"
              done={hitGoal}
              sub={`${fmtNum(todayCals)} / ${profile.dailyCalorieGoal} cal`}
            />
            <CheckItem
              label="Weighed in today"
              done={loggedWeightToday}
              onClick={() => setPage('weight')}
            />
            {DEFAULT_SUPPS.map((name) => (
              <CheckItem
                key={name}
                label={name}
                done={suppChecked(name)}
                onClick={() => setPage('supplements')}
              />
            ))}
            {isTrtDay && (
              <CheckItem
                label="TRT Injection"
                done={trtLoggedToday}
                onClick={() => setPage('trt')}
                highlight
              />
            )}
          </div>
        </div>

        {/* Today's Workouts */}
        <div className="card">
          <div className="section-title">Today's Workouts</div>
          {todayWorkouts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💤</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-mute)', marginBottom: 16 }}>
                Nothing logged yet
              </div>
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
                    {fmtNum(w.calories)}
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}> cal</span>
                  </div>
                </div>
              ))}
              <button className="btn secondary small" onClick={() => setPage('log')}>+ Add Another</button>
            </div>
          )}
        </div>
      </div>

      {/* Challenges */}
      <div className="section-title">Today's Challenges</div>
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        {dailyChallenges.map((c) => (
          <ChallengeCard key={c.id} challenge={c} done={c.check(cStats)} period="Daily" />
        ))}
      </div>

      <div className="section-title">This Week's Challenges</div>
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        {weeklyChallenges.map((c) => (
          <ChallengeCard key={c.id} challenge={c} done={c.check(cStats)} period="Weekly" />
        ))}
      </div>

      <div className="section-title">This Month's Challenges</div>
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        {monthlyChallenges.map((c) => (
          <ChallengeCard key={c.id} challenge={c} done={c.check(cStats)} period="Monthly" />
        ))}
      </div>
    </div>
  );
}

function CheckItem({ label, done, onClick, sub, highlight }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', gap: 12, alignItems: 'center',
        cursor: onClick ? 'pointer' : 'default',
        padding: '8px 10px',
        background: done ? 'rgba(198,255,61,0.06)' : 'var(--bg)',
        border: `1px solid ${done ? 'rgba(198,255,61,0.3)' : highlight ? 'rgba(255,176,32,0.4)' : 'var(--border)'}`,
        transition: 'all 0.15s',
      }}
    >
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

function ChallengeCard({ challenge, done, period }) {
  return (
    <div className="card" style={{
      borderColor: done ? 'var(--accent)' : 'var(--border)',
      background: done ? 'linear-gradient(135deg, var(--bg-2), rgba(198,255,61,0.06))' : 'var(--bg-2)',
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: 28 }}>{challenge.icon}</span>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 2,
          color: done ? 'var(--accent)' : 'var(--text-mute)',
          textTransform: 'uppercase',
          border: `1px solid ${done ? 'rgba(198,255,61,0.4)' : 'var(--border)'}`,
          padding: '2px 6px',
        }}>
          {done ? '✓ Done' : period}
        </span>
      </div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 20, letterSpacing: 1, marginBottom: 4 }}>
        {challenge.name}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4 }}>
        {challenge.desc}
      </div>
    </div>
  );
}
