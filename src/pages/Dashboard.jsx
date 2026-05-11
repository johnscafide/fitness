import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';
import { Flame, TrendingDown, Activity, Calendar } from 'lucide-react';
import { fmtNum, fmtDate, todayISO, calcStreak } from '../storage';

export default function Dashboard({ workouts, weights, profile, challenge, currentWeight, setPage }) {
  const today = todayISO();

  // Today's stats
  const todaysWorkouts = workouts.filter((w) => w.date === today);
  const todayCals = todaysWorkouts.reduce((s, w) => s + (Number(w.calories) || 0), 0);
  const todayMins = todaysWorkouts.reduce((s, w) => s + (Number(w.minutes) || 0), 0);
  const goalPct = profile.dailyCalorieGoal ? (todayCals / profile.dailyCalorieGoal) * 100 : 0;

  // Streaks
  const { current: currentStreak, longest: longestStreak } = useMemo(
    () => calcStreak(workouts),
    [workouts]
  );

  // Last 30 days calorie chart
  const last30 = useMemo(() => {
    const out = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const cals = workouts
        .filter((w) => w.date === iso)
        .reduce((s, w) => s + (Number(w.calories) || 0), 0);
      out.push({
        date: iso,
        short: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        cals,
        goal: profile.dailyCalorieGoal,
      });
    }
    return out;
  }, [workouts, profile.dailyCalorieGoal]);

  // Weekly totals
  const weekly = useMemo(() => {
    const buckets = {};
    workouts.forEach((w) => {
      const d = new Date(w.date + 'T00:00:00');
      // Get week start (Monday)
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(d.setDate(diff)).toISOString().slice(0, 10);
      if (!buckets[weekStart]) buckets[weekStart] = { week: weekStart, cals: 0, mins: 0, count: 0 };
      buckets[weekStart].cals += Number(w.calories) || 0;
      buckets[weekStart].mins += Number(w.minutes) || 0;
      buckets[weekStart].count++;
    });
    return Object.values(buckets)
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8)
      .map((b) => ({
        ...b,
        label: new Date(b.week + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
      }));
  }, [workouts]);

  // Weight trend
  const weightTrend = useMemo(() => {
    return [...weights]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((w) => ({
        date: w.date,
        short: new Date(w.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        weight: Number(w.weight),
      }));
  }, [weights]);

  // Lifetime totals
  const totals = useMemo(() => ({
    workouts: workouts.length,
    cals: workouts.reduce((s, w) => s + (Number(w.calories) || 0), 0),
    miles: workouts.reduce((s, w) => s + (Number(w.miles) || 0), 0),
    minutes: workouts.reduce((s, w) => s + (Number(w.minutes) || 0), 0),
  }), [workouts]);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">DASH<span>BOARD</span></div>
          <div className="page-sub">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>
        <button className="btn" onClick={() => setPage('log')}>
          + Log Workout
        </button>
      </div>

      {/* Top stats */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="card accent-corner stat-card">
          <div className="stat-label">Today's Burn</div>
          <div>
            <span className="stat-value accent">{fmtNum(todayCals)}</span>
            <span className="stat-unit">cal</span>
          </div>
          <div className="stat-delta">
            <Flame size={12} /> {fmtNum(goalPct)}% of goal ({profile.dailyCalorieGoal})
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-label">Today's Time</div>
          <div>
            <span className="stat-value">{fmtNum(todayMins)}</span>
            <span className="stat-unit">min</span>
          </div>
          <div className="stat-delta">
            <Activity size={12} /> {todaysWorkouts.length} workout{todaysWorkouts.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-label">Current Streak</div>
          <div>
            <span className="stat-value warn">{currentStreak}</span>
            <span className="stat-unit">days</span>
          </div>
          <div className="stat-delta">
            🔥 Longest: {longestStreak} days
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-label">Current Weight</div>
          <div>
            <span className="stat-value">{currentWeight ? fmtNum(currentWeight, 1) : '—'}</span>
            <span className="stat-unit">lbs</span>
          </div>
          <div className="stat-delta">
            <Scale size={12} />
            {challenge.goalWeight ? `Goal: ${challenge.goalWeight} lbs` : 'No goal set'}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-title">30 Day Calorie Burn</div>
          {last30.some((d) => d.cals > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={last30} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="calG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c6ff3d" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#c6ff3d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#262626" vertical={false} />
                <XAxis dataKey="short" stroke="#6b6b6b" fontSize={10} interval={4} />
                <YAxis stroke="#6b6b6b" fontSize={10} />
                <Tooltip
                  contentStyle={{ background: '#131313', border: '1px solid #333', fontSize: 12 }}
                  labelStyle={{ color: '#a1a1a1' }}
                />
                <ReferenceLine y={profile.dailyCalorieGoal} stroke="#ff4444" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="cals" stroke="#c6ff3d" strokeWidth={2} fill="url(#calG)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty">No workouts logged yet</div>
          )}
        </div>

        <div className="card">
          <div className="section-title">Weight Over Time</div>
          {weightTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={weightTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#262626" vertical={false} />
                <XAxis dataKey="short" stroke="#6b6b6b" fontSize={10} />
                <YAxis stroke="#6b6b6b" fontSize={10} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip
                  contentStyle={{ background: '#131313', border: '1px solid #333', fontSize: 12 }}
                  labelStyle={{ color: '#a1a1a1' }}
                />
                {challenge.goalWeight && (
                  <ReferenceLine y={challenge.goalWeight} stroke="#c6ff3d" strokeDasharray="3 3" label={{ value: 'Goal', position: 'right', fill: '#c6ff3d', fontSize: 10 }} />
                )}
                <Line type="monotone" dataKey="weight" stroke="#4d9fff" strokeWidth={2} dot={{ r: 3, fill: '#4d9fff' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty">Log a weight to see your trend</div>
          )}
        </div>
      </div>

      {/* Weekly bar */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">Last 8 Weeks</div>
        {weekly.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#262626" vertical={false} />
              <XAxis dataKey="label" stroke="#6b6b6b" fontSize={10} />
              <YAxis stroke="#6b6b6b" fontSize={10} />
              <Tooltip
                contentStyle={{ background: '#131313', border: '1px solid #333', fontSize: 12 }}
                labelStyle={{ color: '#a1a1a1' }}
              />
              <Bar dataKey="cals" fill="#c6ff3d" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty">No weekly data yet</div>
        )}
      </div>

      {/* Lifetime totals */}
      <div className="section-title">Lifetime Totals</div>
      <div className="grid grid-4">
        <div className="card stat-card">
          <div className="stat-label">Workouts</div>
          <div className="stat-value">{fmtNum(totals.workouts)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Calories Burned</div>
          <div className="stat-value accent">{fmtNum(totals.cals)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Miles</div>
          <div className="stat-value">{fmtNum(totals.miles, 1)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Minutes</div>
          <div className="stat-value">{fmtNum(totals.minutes)}</div>
        </div>
      </div>
    </div>
  );
}

function Scale({ size }) {
  return <span style={{ fontSize: size }}>⚖</span>;
}
