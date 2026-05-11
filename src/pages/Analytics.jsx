import { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { calcBMR, calcTDEE, calcIntakeGoals, calcMacros, calcBMI, bmiCategory, calcIBW, ACTIVITY_LEVELS } from '../nutrition';
import { fmtNum, todayISO } from '../storage';

export default function Analytics({ workouts, weights, profile, setProfile, challenge }) {
  const [activityLevel, setActivityLevel] = useState(profile.activityLevel || 'light');

  const currentWeight = useMemo(() => {
    if (!weights.length) return null;
    const sorted = [...weights].sort((a, b) => b.date.localeCompare(a.date));
    return Number(sorted[0].weight);
  }, [weights]);

  const bmr = useMemo(() => {
    if (!currentWeight) return null;
    return calcBMR({ ...profile, weight: currentWeight });
  }, [profile, currentWeight]);

  const tdee = useMemo(() => bmr ? calcTDEE(bmr, activityLevel) : null, [bmr, activityLevel]);
  const intake = useMemo(() => tdee ? calcIntakeGoals(tdee) : null, [tdee]);
  const macros = useMemo(() => intake && currentWeight ? calcMacros(intake.moderate, currentWeight) : null, [intake, currentWeight]);
  const bmi = useMemo(() => currentWeight ? calcBMI(currentWeight, profile.heightFt, profile.heightIn) : null, [currentWeight, profile]);
  const bmiCat = bmi ? bmiCategory(Number(bmi)) : null;
  const ibw = calcIBW(profile.heightFt, profile.heightIn, profile.sex);

  const saveActivity = (level) => {
    setActivityLevel(level);
    setProfile({ ...profile, activityLevel: level });
  };

  // ── Calorie burn breakdown by day of week ──
  const byDow = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = Array(7).fill(0);
    const cals = Array(7).fill(0);
    workouts.forEach((w) => {
      const dow = new Date(w.date + 'T00:00:00').getDay();
      const idx = dow === 0 ? 6 : dow - 1;
      counts[idx]++;
      cals[idx] += Number(w.calories) || 0;
    });
    return days.map((d, i) => ({ day: d, workouts: counts[i], avgCals: counts[i] ? Math.round(cals[i] / counts[i]) : 0, totalCals: cals[i] }));
  }, [workouts]);

  // ── Monthly volume trend ──
  const monthlyTrend = useMemo(() => {
    const buckets = {};
    workouts.forEach((w) => {
      const key = w.date.slice(0, 7);
      if (!buckets[key]) buckets[key] = { month: key, cals: 0, workouts: 0, miles: 0, mins: 0 };
      buckets[key].cals += Number(w.calories) || 0;
      buckets[key].workouts++;
      buckets[key].miles += Number(w.miles) || 0;
      buckets[key].mins += Number(w.minutes) || 0;
    });
    return Object.values(buckets).sort((a, b) => a.month.localeCompare(b.month)).map((b) => ({
      ...b,
      label: new Date(b.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    }));
  }, [workouts]);

  // ── Consistency score (% of days with a workout in past 90 days) ──
  const consistency = useMemo(() => {
    const today = new Date();
    let active = 0;
    const workoutDates = new Set(workouts.map((w) => w.date));
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (workoutDates.has(d.toISOString().slice(0, 10))) active++;
    }
    return Math.round((active / 90) * 100);
  }, [workouts]);

  // ── Avg calories per workout day ──
  const avgDailyBurn = useMemo(() => {
    const byDay = {};
    workouts.forEach((w) => { byDay[w.date] = (byDay[w.date] || 0) + (Number(w.calories) || 0); });
    const vals = Object.values(byDay);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }, [workouts]);

  // ── Projected goal date based on avg daily burn ──
  const projectedGoalDate = useMemo(() => {
    if (!challenge.goalWeight || !currentWeight || !avgDailyBurn) return null;
    const lbsLeft = currentWeight - challenge.goalWeight;
    if (lbsLeft <= 0) return null;
    const days = Math.ceil((lbsLeft * 3500) / avgDailyBurn);
    const d = new Date();
    d.setDate(d.getDate() + days);
    return { date: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), days };
  }, [challenge, currentWeight, avgDailyBurn]);

  // ── Radar: fitness profile ──
  const radarData = useMemo(() => {
    const total = workouts.length || 1;
    const calAvg = workouts.reduce((s, w) => s + (Number(w.calories) || 0), 0) / total;
    const minAvg = workouts.reduce((s, w) => s + (Number(w.minutes) || 0), 0) / total;
    return [
      { subject: 'Consistency', value: Math.min(100, consistency) },
      { subject: 'Intensity', value: Math.min(100, (calAvg / 600) * 100) },
      { subject: 'Duration', value: Math.min(100, (minAvg / 75) * 100) },
      { subject: 'Cardio', value: Math.min(100, (workouts.filter((w) => w.type === 'cardio').length / total) * 100) },
      { subject: 'Strength', value: Math.min(100, (workouts.filter((w) => w.type === 'strength').length / total) * 100) },
    ];
  }, [workouts, consistency]);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">ANALY<span>TICS</span></div>
          <div className="page-sub">// Your data, deep</div>
        </div>
      </div>

      {/* BMR / TDEE Section */}
      <div className="section-title">Body Stats & Metabolism</div>

      {!currentWeight ? (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="empty">Log a weight entry to unlock metabolic calculations</div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>Activity Level</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {ACTIVITY_LEVELS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => saveActivity(l.id)}
                  className={`btn small ${activityLevel === l.id ? '' : 'secondary'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            <div className="card stat-card accent-corner">
              <div className="stat-label">BMR</div>
              <div><span className="stat-value accent">{fmtNum(bmr)}</span><span className="stat-unit">cal/day</span></div>
              <div className="stat-delta">Calories burned at rest</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">TDEE</div>
              <div><span className="stat-value">{fmtNum(tdee)}</span><span className="stat-unit">cal/day</span></div>
              <div className="stat-delta">With your activity level</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">BMI</div>
              <div><span className="stat-value" style={{ color: bmiCat?.color, fontSize: 36 }}>{bmi}</span></div>
              <div className="stat-delta" style={{ color: bmiCat?.color }}>{bmiCat?.label}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Ideal Body Weight</div>
              <div><span className="stat-value">{fmtNum(ibw)}</span><span className="stat-unit">lbs</span></div>
              <div className="stat-delta">Hamwi method estimate</div>
            </div>
          </div>

          {intake && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="section-title">Daily Calorie Intake Targets (Even Though You're Not Tracking Food)</div>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 16 }}>
                You're tracking calories OUT, not in. But knowing these numbers gives you the full picture. Your TDEE is what you burn daily with your activity level. If you eat below it, you lose weight. If you exceed it, you gain. Here's where your targets fall:
              </p>
              <div className="grid grid-4" style={{ gap: 12 }}>
                <IntakeCard label="Maintenance" cal={intake.maintenance} sub="Stay at current weight" color="var(--text)" />
                <IntakeCard label="Mild Deficit" cal={intake.mild} sub="Lose ~0.5 lb/week" color="var(--info)" />
                <IntakeCard label="Moderate Deficit" cal={intake.moderate} sub="Lose ~1 lb/week ✓ Sweet spot" color="var(--accent)" highlight />
                <IntakeCard label="Aggressive" cal={intake.aggressive} sub="Lose ~1.5 lbs/week" color="var(--warn)" />
              </div>
            </div>
          )}

          {macros && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="section-title">Suggested Macro Split (at Moderate Deficit)</div>
              <p style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 16, fontFamily: 'var(--mono)' }}>
                Based on 0.7g protein per lb of bodyweight. Protein is prioritized to protect muscle during fat loss.
              </p>
              <div className="grid grid-3" style={{ gap: 12 }}>
                <MacroCard label="Protein" grams={macros.protein} cals={macros.proteinCals} color="#4d9fff" icon="🥩" />
                <MacroCard label="Carbs" grams={macros.carbs} cals={macros.carbCals} color="#c6ff3d" icon="🍚" />
                <MacroCard label="Fat" grams={macros.fat} cals={macros.fatCals} color="#ffb020" icon="🥑" />
              </div>
            </div>
          )}
        </>
      )}

      {/* Performance Stats */}
      <div className="section-title">Performance Analysis</div>
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-label">Consistency (90 days)</div>
          <div><span className="stat-value" style={{ color: consistency >= 50 ? 'var(--accent)' : consistency >= 25 ? 'var(--warn)' : 'var(--danger)' }}>{consistency}</span><span className="stat-unit">%</span></div>
          <div className="stat-delta">Days active / 90 days</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Avg Burn (per active day)</div>
          <div><span className="stat-value">{fmtNum(avgDailyBurn)}</span><span className="stat-unit">cal</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Avg Workout Length</div>
          <div>
            <span className="stat-value">
              {workouts.length ? fmtNum(workouts.reduce((s, w) => s + (Number(w.minutes) || 0), 0) / workouts.length, 0) : '—'}
            </span>
            <span className="stat-unit">min</span>
          </div>
        </div>
        <div className="card stat-card" style={{ borderColor: projectedGoalDate ? 'var(--accent)' : 'var(--border)' }}>
          <div className="stat-label">Projected Goal Date</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, letterSpacing: 1, lineHeight: 1.2, color: 'var(--accent)', marginTop: 4 }}>
            {projectedGoalDate ? projectedGoalDate.date : '—'}
          </div>
          {projectedGoalDate && <div className="stat-delta">{projectedGoalDate.days} days at current pace</div>}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-title">Most Active Day of the Week</div>
          {workouts.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byDow} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#262626" vertical={false} />
                <XAxis dataKey="day" stroke="#6b6b6b" fontSize={11} />
                <YAxis stroke="#6b6b6b" fontSize={10} />
                <Tooltip
                  contentStyle={{ background: '#131313', border: '1px solid #333', fontSize: 12 }}
                  formatter={(v, n) => [v, n === 'avgCals' ? 'Avg Cal' : 'Workouts']}
                />
                <Bar dataKey="avgCals" radius={[2, 2, 0, 0]}>
                  {byDow.map((entry, i) => (
                    <Cell key={i} fill={entry.totalCals === Math.max(...byDow.map((d) => d.totalCals)) ? '#c6ff3d' : '#333'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty">No data yet</div>}
        </div>

        <div className="card">
          <div className="section-title">Fitness Profile</div>
          {workouts.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b6b6b', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="You" dataKey="value" stroke="#c6ff3d" fill="#c6ff3d" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <div className="empty">No data yet</div>}
        </div>
      </div>

      {/* Monthly trend */}
      {monthlyTrend.length > 1 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-title">Monthly Calorie Burn Trend</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#262626" vertical={false} />
              <XAxis dataKey="label" stroke="#6b6b6b" fontSize={11} />
              <YAxis stroke="#6b6b6b" fontSize={10} />
              <Tooltip contentStyle={{ background: '#131313', border: '1px solid #333', fontSize: 12 }} />
              <Line type="monotone" dataKey="cals" stroke="#c6ff3d" strokeWidth={2} dot={{ r: 4, fill: '#c6ff3d' }} name="Calories" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card" style={{ background: 'var(--bg-3)' }}>
        <div className="section-title">How These Numbers Work</div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text)' }}>BMR (Basal Metabolic Rate)</strong> — calories your body burns just staying alive. Calculated with the Mifflin-St Jeor formula, which is currently the most accurate for most people including those who are overweight.<br /><br />
          <strong style={{ color: 'var(--text)' }}>TDEE (Total Daily Energy Expenditure)</strong> — BMR × your activity multiplier. This is your real daily burn including exercise.<br /><br />
          <strong style={{ color: 'var(--text)' }}>Ideal Body Weight</strong> — the Hamwi method estimate. It's a starting point, not gospel. Your goal weight matters more than a formula.<br /><br />
          <strong style={{ color: 'var(--text)' }}>Projected goal date</strong> — based on your average calorie burn per active day over all logged workouts. It assumes you keep burning at the same rate. The more consistent you are, the more accurate this gets.
        </div>
      </div>
    </div>
  );
}

function IntakeCard({ label, cal, sub, color, highlight }) {
  return (
    <div className="card stat-card" style={{ borderColor: highlight ? 'var(--accent)' : 'var(--border)' }}>
      <div className="stat-label">{label}</div>
      <div><span className="stat-value" style={{ color, fontSize: 34 }}>{fmtNum(cal)}</span><span className="stat-unit">cal</span></div>
      <div className="stat-delta">{sub}</div>
    </div>
  );
}

function MacroCard({ label, grams, cals, color, icon }) {
  return (
    <div className="card" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="stat-label">{label}</div>
        <span style={{ fontSize: 24 }}>{icon}</span>
      </div>
      <div><span style={{ fontFamily: 'var(--display)', fontSize: 36, color }}>{fmtNum(grams)}</span><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', marginLeft: 4 }}>g</span></div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)', marginTop: 4 }}>{fmtNum(cals)} calories</div>
    </div>
  );
}
