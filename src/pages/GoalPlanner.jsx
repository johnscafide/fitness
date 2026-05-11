import { useState, useMemo, useEffect } from 'react';
import { Target, Calendar, TrendingDown, Flame } from 'lucide-react';
import { todayISO, addDays, fmtDate, fmtNum, daysBetween } from '../storage';

// 1 lb of fat ≈ 3500 calories (rule of thumb)
const CAL_PER_LB = 3500;

export default function GoalPlanner({ challenge, setChallenge, currentWeight, workouts, weights, showToast }) {
  const [startDate, setStartDate] = useState(challenge.startDate || todayISO());
  const [months, setMonths] = useState(challenge.months || 3);
  const [startWeight, setStartWeight] = useState(challenge.startWeight || currentWeight || '');
  const [goalWeight, setGoalWeight] = useState(challenge.goalWeight || '');

  useEffect(() => {
    if (!startWeight && currentWeight) setStartWeight(currentWeight);
  }, [currentWeight]);

  const totalDays = months * 30;
  const endDate = useMemo(() => addDays(startDate, totalDays), [startDate, totalDays]);

  const plan = useMemo(() => {
    if (!startWeight || !goalWeight) return null;
    const sw = Number(startWeight);
    const gw = Number(goalWeight);
    const lbsToLose = sw - gw;
    if (lbsToLose <= 0) return null;

    const totalCalsNeeded = lbsToLose * CAL_PER_LB;
    const calsPerWeek = totalCalsNeeded / (totalDays / 7);
    const calsPerDay = totalCalsNeeded / totalDays;
    const lbsPerWeek = lbsToLose / (totalDays / 7);

    // Sanity check — losing more than 2 lbs/week is aggressive
    let warning = null;
    if (lbsPerWeek > 2) {
      warning = `That's ${lbsPerWeek.toFixed(1)} lbs/week through exercise alone. Most health guidelines recommend 1-2 lbs/week. Consider extending the timeline or combining with diet changes.`;
    } else if (calsPerDay > 1000) {
      warning = `Burning ${Math.round(calsPerDay)} calories per day every day is intense. Make sure you're getting enough rest and recovery.`;
    }

    return {
      lbsToLose,
      totalCalsNeeded,
      calsPerDay: Math.round(calsPerDay),
      calsPerWeek: Math.round(calsPerWeek),
      lbsPerWeek: lbsPerWeek.toFixed(2),
      warning,
    };
  }, [startWeight, goalWeight, totalDays]);

  // Progress calculations based on actual workouts in challenge window
  const progress = useMemo(() => {
    if (!plan) return null;
    const inWindow = workouts.filter((w) => w.date >= startDate && w.date <= endDate);
    const burned = inWindow.reduce((s, w) => s + (Number(w.calories) || 0), 0);
    const elapsedDays = Math.max(0, Math.min(totalDays, daysBetween(startDate, todayISO())));
    const expectedByNow = plan.calsPerDay * elapsedDays;
    const pctBurned = (burned / plan.totalCalsNeeded) * 100;
    const onTrack = burned >= expectedByNow * 0.9; // 90% threshold

    // Weight progress
    const weightsInWindow = weights.filter((w) => w.date >= startDate && w.date <= endDate);
    let lbsLostActual = 0;
    if (weightsInWindow.length > 0 && startWeight) {
      const latest = [...weightsInWindow].sort((a, b) => b.date.localeCompare(a.date))[0];
      lbsLostActual = Number(startWeight) - Number(latest.weight);
    }

    return {
      burned,
      pctBurned,
      onTrack,
      expectedByNow,
      elapsedDays,
      remainingDays: totalDays - elapsedDays,
      lbsLostActual,
      pctLost: plan.lbsToLose ? (lbsLostActual / plan.lbsToLose) * 100 : 0,
    };
  }, [plan, workouts, weights, startDate, endDate, totalDays, startWeight]);

  const saveChallenge = () => {
    setChallenge({
      startDate,
      months: Number(months),
      startWeight: Number(startWeight),
      goalWeight: Number(goalWeight),
    });
    showToast('Challenge saved');
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">GOAL <span>PLANNER</span></div>
          <div className="page-sub">// Build a plan from where you are to where you want to be</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Set Your Challenge</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Duration (months)</label>
            <input type="number" min="1" max="24" value={months} onChange={(e) => setMonths(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Start Weight (lbs)</label>
            <input type="number" step="0.1" value={startWeight} onChange={(e) => setStartWeight(e.target.value)} placeholder={currentWeight || ''} />
          </div>
          <div className="form-group">
            <label>Goal Weight (lbs)</label>
            <input type="number" step="0.1" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} />
          </div>
        </div>
        <button className="btn" onClick={saveChallenge} style={{ marginTop: 16 }}>Save Plan</button>
      </div>

      {plan && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            <div className="card stat-card accent-corner">
              <div className="stat-label">Pounds to Lose</div>
              <div><span className="stat-value">{fmtNum(plan.lbsToLose, 1)}</span><span className="stat-unit">lbs</span></div>
              <div className="stat-delta">in {months} month{months > 1 ? 's' : ''}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Calories to Burn</div>
              <div><span className="stat-value accent">{fmtNum(plan.totalCalsNeeded)}</span></div>
              <div className="stat-delta">total over {totalDays} days</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Daily Target</div>
              <div><span className="stat-value">{fmtNum(plan.calsPerDay)}</span><span className="stat-unit">cal/day</span></div>
              <div className="stat-delta">every single day</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Weekly Target</div>
              <div><span className="stat-value">{fmtNum(plan.calsPerWeek)}</span><span className="stat-unit">cal/wk</span></div>
              <div className="stat-delta">{plan.lbsPerWeek} lbs/week</div>
            </div>
          </div>

          {plan.warning && (
            <div className="card" style={{
              marginBottom: 20,
              borderColor: 'var(--warn)',
              background: 'linear-gradient(135deg, var(--bg-2), rgba(255, 176, 32, 0.05))'
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 24 }}>⚠️</div>
                <div>
                  <div className="section-title" style={{ marginBottom: 6 }}>Heads up</div>
                  <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                    {plan.warning}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="section-title">Timeline</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, fontFamily: 'var(--mono)' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Starts</div>
                <div style={{ fontSize: 18 }}>{fmtDate(startDate)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>30 Day Check</div>
                <div style={{ fontSize: 18 }}>{fmtDate(addDays(startDate, 30))}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>60 Day Check</div>
                <div style={{ fontSize: 18 }}>{fmtDate(addDays(startDate, 60))}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>End</div>
                <div style={{ fontSize: 18, color: 'var(--accent)' }}>{fmtDate(endDate)}</div>
              </div>
            </div>
          </div>

          {progress && (
            <div className="card">
              <div className="section-title">Current Progress</div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontFamily: 'var(--mono)' }}>
                  <span style={{ color: 'var(--text-dim)' }}>CALORIES BURNED</span>
                  <span>{fmtNum(progress.burned)} / {fmtNum(plan.totalCalsNeeded)}</span>
                </div>
                <ProgressBar pct={progress.pctBurned} color="accent" />
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontFamily: 'var(--mono)' }}>
                  <span style={{ color: 'var(--text-dim)' }}>POUNDS LOST</span>
                  <span>{fmtNum(progress.lbsLostActual, 1)} / {fmtNum(plan.lbsToLose, 1)}</span>
                </div>
                <ProgressBar pct={Math.max(0, progress.pctLost)} color="info" />
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontFamily: 'var(--mono)' }}>
                  <span style={{ color: 'var(--text-dim)' }}>TIME ELAPSED</span>
                  <span>Day {progress.elapsedDays} of {totalDays}</span>
                </div>
                <ProgressBar pct={(progress.elapsedDays / totalDays) * 100} color="warn" />
              </div>

              <div className="grid grid-3" style={{ marginTop: 24 }}>
                <div className="stat-card">
                  <div className="stat-label">Expected by Now</div>
                  <div><span className="stat-value">{fmtNum(progress.expectedByNow)}</span><span className="stat-unit">cal</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Days Remaining</div>
                  <div><span className="stat-value">{progress.remainingDays}</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Status</div>
                  <div>
                    <span className={`stat-value ${progress.onTrack ? 'accent' : 'danger'}`}>
                      {progress.onTrack ? 'ON TRACK' : 'BEHIND'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!plan && startWeight && goalWeight && Number(goalWeight) >= Number(startWeight) && (
        <div className="card">
          <div className="empty">Your goal weight needs to be lower than your start weight</div>
        </div>
      )}

      <div className="card" style={{ marginTop: 20, background: 'var(--bg-3)' }}>
        <div className="section-title">How this works</div>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          One pound of body fat is roughly 3,500 calories. So losing 10 lbs through exercise means burning about 35,000 extra calories over your timeline. The plan divides that across your days and weeks. This only tracks calories <em>out</em>, not what you eat. Real results depend on both. Big picture: pair this with sensible eating and you're set.
        </p>
      </div>
    </div>
  );
}

function ProgressBar({ pct, color = 'accent' }) {
  const colors = {
    accent: 'var(--accent)',
    info: 'var(--info)',
    warn: 'var(--warn)',
  };
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div style={{ height: 8, background: 'var(--bg)', border: '1px solid var(--border-2)', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: `${clamped}%`,
        background: colors[color],
        transition: 'width 0.4s ease',
      }} />
    </div>
  );
}
