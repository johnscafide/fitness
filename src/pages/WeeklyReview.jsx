import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fmtNum, fmtDate } from '../storage';

const getWeekStart = (dateStr) => {
  const d   = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date(d).setDate(diff)).toISOString().slice(0, 10);
};

const addDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const weekStats = (workouts, weights, supplements, startISO) => {
  const end   = addDays(startISO, 6);
  const ws    = workouts.filter((w) => w.date >= startISO && w.date <= end);
  const wts   = weights.filter((w) => w.date >= startISO && w.date <= end);
  const supps = supplements.filter((s) => s.date >= startISO && s.date <= end);

  const cals      = ws.reduce((s, w) => s + (Number(w.calories) || 0), 0);
  const mins      = ws.reduce((s, w) => s + (Number(w.minutes)  || 0), 0);
  const miles     = ws.reduce((s, w) => s + (Number(w.miles)    || 0), 0);
  const days      = new Set(ws.map((w) => w.date)).size;
  const cardio    = ws.filter((w) => w.type === 'cardio').length;
  const strength  = ws.filter((w) => w.type === 'strength').length;
  const suppDays  = new Set(supps.map((s) => s.date)).size;
  const weightAvg = wts.length
    ? wts.reduce((s, w) => s + Number(w.weight), 0) / wts.length
    : null;

  return { cals, mins, miles, days, cardio, strength, suppDays, weightAvg, workoutCount: ws.length };
};

export default function WeeklyReview({ workouts, weights, supplements, trtLogs, profile, challenge, setPage }) {
  const today     = new Date().toISOString().slice(0, 10);
  const thisWeekStart = getWeekStart(today);
  const lastWeekStart = addDays(thisWeekStart, -7);

  // Which week to show — default to last complete week if we're early in the week
  const dayOfWeek    = new Date().getDay(); // 0=Sun
  const showingWeek  = dayOfWeek <= 1 ? lastWeekStart : thisWeekStart; // Sun/Mon → show last week
  const prevWeekStart = addDays(showingWeek, -7);

  const curr = useMemo(() => weekStats(workouts, weights, supplements, showingWeek),  [workouts, weights, supplements, showingWeek]);
  const prev = useMemo(() => weekStats(workouts, weights, supplements, prevWeekStart), [workouts, weights, supplements, prevWeekStart]);

  // Last 8 weeks for the mini trend bars
  const weeklyTrend = useMemo(() => {
    const out = [];
    for (let i = 7; i >= 0; i--) {
      const start = addDays(thisWeekStart, -i * 7);
      const s = weekStats(workouts, weights, supplements, start);
      out.push({
        label: new Date(start + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        cals: s.cals,
        days: s.days,
      });
    }
    return out;
  }, [workouts, weights, supplements, thisWeekStart]);

  // Generate narrative insights
  const insights = useMemo(() => {
    const list = [];
    const calDiff  = curr.cals - prev.cals;
    const dayDiff  = curr.days - prev.days;

    if (curr.cals === 0) {
      list.push({ type: 'warn', text: 'No workouts logged this week yet. Still time to change that.' });
      return list;
    }

    if (calDiff > 0)
      list.push({ type: 'good', text: `Burned ${fmtNum(calDiff)} more calories than last week. That's momentum.` });
    else if (calDiff < 0)
      list.push({ type: 'warn', text: `Burned ${fmtNum(Math.abs(calDiff))} fewer calories than last week. Happens — what's the plan for next week?` });
    else
      list.push({ type: 'neutral', text: 'Calorie burn matched last week almost exactly. Consistent.' });

    if (dayDiff > 0)
      list.push({ type: 'good', text: `Showed up ${dayDiff} more day${dayDiff > 1 ? 's' : ''} than last week.` });
    else if (dayDiff < 0)
      list.push({ type: 'warn', text: `${Math.abs(dayDiff)} fewer active day${Math.abs(dayDiff) > 1 ? 's' : ''} than last week.` });

    if (curr.cardio > 0 && curr.strength > 0)
      list.push({ type: 'good', text: 'Mixed week — hit both cardio and strength. That\'s the combo.' });
    else if (curr.cardio === 0 && curr.strength > 0)
      list.push({ type: 'neutral', text: 'All strength this week. Consider adding a cardio session next week for heart health.' });
    else if (curr.strength === 0 && curr.cardio > 0)
      list.push({ type: 'neutral', text: 'All cardio this week. A strength session next week helps protect muscle.' });

    if (curr.suppDays >= 5)
      list.push({ type: 'good', text: `Supplement protocol solid — ${curr.suppDays}/7 days logged.` });
    else if (curr.suppDays > 0)
      list.push({ type: 'warn', text: `Supplements logged ${curr.suppDays}/7 days. Consistency matters for D3 and magnesium.` });

    if (curr.weightAvg && prev.weightAvg) {
      const wDiff = curr.weightAvg - prev.weightAvg;
      if (wDiff < -0.5)
        list.push({ type: 'good', text: `Weight trending down — avg ${Math.abs(wDiff).toFixed(1)} lbs lighter than last week.` });
      else if (wDiff > 0.5)
        list.push({ type: 'neutral', text: `Weight up about ${wDiff.toFixed(1)} lbs on average vs last week. Could be water, rest, or food timing.` });
    }

    // TRT check (Thursdays)
    const trtThisWeek = (trtLogs || []).filter(
      (t) => t.date >= showingWeek && t.date <= addDays(showingWeek, 6)
    );
    if (trtThisWeek.length === 0)
      list.push({ type: 'warn', text: 'No TRT injection logged this week. Make sure you didn\'t miss your Thursday shot.' });
    else
      list.push({ type: 'good', text: 'TRT injection logged this week. Protocol on track.' });

    return list;
  }, [curr, prev, trtLogs, showingWeek]);

  // Goal progress
  const goalCals = profile.dailyCalorieGoal ? profile.dailyCalorieGoal * 7 : 0;
  const goalPct  = goalCals ? Math.min(100, (curr.cals / goalCals) * 100) : 0;

  // Challenge progress
  const challengeActive = challenge.goalWeight && challenge.startDate;
  const challengeCals   = challengeActive
    ? workouts.filter((w) => w.date >= challenge.startDate && w.date <= today)
        .reduce((s, w) => s + (Number(w.calories) || 0), 0)
    : 0;
  const challengeTotal = challengeActive
    ? (Number(challenge.startWeight || 0) - Number(challenge.goalWeight)) * 3500
    : 0;
  const challengePct = challengeTotal ? Math.min(100, (challengeCals / challengeTotal) * 100) : 0;

  const weekLabel = new Date(showingWeek + 'T00:00:00')
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const weekEndLabel = new Date(addDays(showingWeek, 6) + 'T00:00:00')
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">WEEKLY<span> REVIEW</span></div>
          <div className="page-sub">// {weekLabel} – {weekEndLabel}</div>
        </div>
        <button className="btn secondary" onClick={() => setPage('today')}>← Back to Today</button>
      </div>

      {/* Week vs week headline stats */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <StatDelta label="Calories Burned" curr={curr.cals}   prev={prev.cals}   unit="cal" higherBetter />
        <StatDelta label="Active Days"     curr={curr.days}   prev={prev.days}   unit="days" higherBetter />
        <StatDelta label="Miles Logged"    curr={curr.miles}  prev={prev.miles}  unit="mi" decimals={1} higherBetter />
        <StatDelta label="Time"            curr={curr.mins}   prev={prev.mins}   unit="min" higherBetter />
      </div>

      {/* Insights */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">This Week's Debrief</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {insights.map((ins, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '10px 14px',
              background: ins.type === 'good' ? 'rgba(198,255,61,0.06)'
                : ins.type === 'warn' ? 'rgba(255,176,32,0.06)'
                : 'var(--bg)',
              border: `1px solid ${ins.type === 'good' ? 'rgba(198,255,61,0.25)'
                : ins.type === 'warn' ? 'rgba(255,176,32,0.25)'
                : 'var(--border)'}`,
              borderLeft: `3px solid ${ins.type === 'good' ? 'var(--accent)'
                : ins.type === 'warn' ? 'var(--warn)'
                : 'var(--border-2)'}`,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>
                {ins.type === 'good' ? '✓' : ins.type === 'warn' ? '⚠' : '→'}
              </span>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{ins.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 8-week trend */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">8-Week Calorie Trend</div>
        {weeklyTrend.some((w) => w.cals > 0) ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#262626" vertical={false} />
              <XAxis dataKey="label" stroke="#6b6b6b" fontSize={10} />
              <YAxis stroke="#6b6b6b" fontSize={10} />
              <Tooltip contentStyle={{ background: '#131313', border: '1px solid #333', fontSize: 12 }} />
              <Bar dataKey="cals" fill="#c6ff3d" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty">No workout data yet</div>
        )}
      </div>

      {/* Goal & challenge progress */}
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        {goalCals > 0 && (
          <div className="card">
            <div className="section-title">Weekly Calorie Goal</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: 'var(--mono)', fontSize: 11 }}>
                <span style={{ color: 'var(--text-dim)' }}>{fmtNum(curr.cals)} / {fmtNum(goalCals)} cal</span>
                <span style={{ color: 'var(--text-dim)' }}>{Math.round(goalPct)}%</span>
              </div>
              <ProgBar pct={goalPct} color={goalPct >= 100 ? 'var(--accent)' : 'var(--info)'} />
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>
              {goalPct >= 100 ? '🎯 Goal hit this week' : `${fmtNum(goalCals - curr.cals)} cal remaining`}
            </div>
          </div>
        )}

        {challengeActive && (
          <div className="card">
            <div className="section-title">Challenge Progress</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: 'var(--mono)', fontSize: 11 }}>
                <span style={{ color: 'var(--text-dim)' }}>{fmtNum(challengeCals)} / {fmtNum(challengeTotal)} cal</span>
                <span style={{ color: 'var(--text-dim)' }}>{Math.round(challengePct)}%</span>
              </div>
              <ProgBar pct={challengePct} color="var(--warn)" />
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>
              Goal weight: {challenge.goalWeight} lbs
            </div>
          </div>
        )}
      </div>

      {/* Breakdown */}
      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">This Week</div>
          <table style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 12 }}>
            <tbody>
              {[
                ['Workouts', curr.workoutCount],
                ['Active Days', curr.days],
                ['Cardio Sessions', curr.cardio],
                ['Strength Sessions', curr.strength],
                ['Supplement Days', `${curr.suppDays}/7`],
                ['Avg Weight', curr.weightAvg ? `${curr.weightAvg.toFixed(1)} lbs` : '—'],
              ].map(([label, val]) => (
                <tr key={label}>
                  <td style={{ padding: '6px 0', color: 'var(--text-dim)', borderBottom: '1px solid var(--border)' }}>{label}</td>
                  <td style={{ padding: '6px 0', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="section-title">vs Last Week</div>
          <table style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 12 }}>
            <tbody>
              {[
                ['Workouts', curr.workoutCount, prev.workoutCount],
                ['Active Days', curr.days, prev.days],
                ['Calories', curr.cals, prev.cals],
                ['Miles', curr.miles?.toFixed(1), prev.miles?.toFixed(1)],
                ['Minutes', curr.mins, prev.mins],
                ['Supp Days', curr.suppDays, prev.suppDays],
              ].map(([label, c, p]) => {
                const diff = Number(c) - Number(p);
                const color = diff > 0 ? 'var(--accent)' : diff < 0 ? 'var(--danger)' : 'var(--text-dim)';
                return (
                  <tr key={label}>
                    <td style={{ padding: '6px 0', color: 'var(--text-dim)', borderBottom: '1px solid var(--border)' }}>{label}</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', borderBottom: '1px solid var(--border)', color }}>
                      {diff > 0 ? '+' : ''}{diff !== 0 ? (Number.isInteger(diff) ? diff : diff.toFixed(1)) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatDelta({ label, curr, prev, unit, decimals = 0, higherBetter }) {
  const diff    = curr - prev;
  const better  = higherBetter ? diff > 0 : diff < 0;
  const neutral = Math.abs(diff) < 0.01;
  const color   = neutral ? 'var(--text-dim)' : better ? 'var(--accent)' : 'var(--warn)';
  const Icon    = neutral ? Minus : better ? TrendingUp : TrendingDown;

  return (
    <div className="card stat-card">
      <div className="stat-label">{label}</div>
      <div>
        <span className="stat-value" style={{ fontSize: 36 }}>{fmtNum(curr, decimals)}</span>
        <span className="stat-unit"> {unit}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--mono)', fontSize: 11, color, marginTop: 2 }}>
        <Icon size={12} />
        {neutral ? 'Same as last week' : `${diff > 0 ? '+' : ''}${fmtNum(diff, decimals)} vs last week`}
      </div>
    </div>
  );
}

function ProgBar({ pct, color }) {
  return (
    <div style={{ height: 8, background: 'var(--bg)', border: '1px solid var(--border-2)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, transition: 'width 0.4s' }} />
    </div>
  );
}
