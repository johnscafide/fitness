import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { fmtNum, fmtDate, fmtPace } from '../storage';

export default function Records({ workouts }) {
  const records = useMemo(() => {
    if (!workouts.length) return null;

    const cardio = workouts.filter((w) => w.type === 'cardio');
    const strength = workouts.filter((w) => w.type === 'strength');

    // Best single workout values
    const mostCalories = [...workouts].sort((a, b) => (b.calories || 0) - (a.calories || 0))[0];
    const longestTime = [...workouts].sort((a, b) => (b.minutes || 0) - (a.minutes || 0))[0];
    const longestRun = [...cardio].sort((a, b) => (b.miles || 0) - (a.miles || 0))[0];

    // Best pace (cardio with miles > 0.1)
    const bestPace = [...cardio]
      .filter((w) => w.miles > 0.1 && w.minutes > 0)
      .sort((a, b) => (a.minutes / a.miles) - (b.minutes / b.miles))[0];

    // Best HR
    const highestAvgHR = [...workouts].filter((w) => w.avgHR).sort((a, b) => b.avgHR - a.avgHR)[0];
    const highestMaxHR = [...workouts].filter((w) => w.maxHR).sort((a, b) => b.maxHR - a.maxHR)[0];

    // Best day by calories
    const byDay = {};
    workouts.forEach((w) => {
      byDay[w.date] = (byDay[w.date] || 0) + (Number(w.calories) || 0);
    });
    const bestDayEntry = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
    const bestDay = bestDayEntry ? { date: bestDayEntry[0], calories: bestDayEntry[1] } : null;

    // Best week
    const byWeek = {};
    workouts.forEach((w) => {
      const d = new Date(w.date + 'T00:00:00');
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(d.setDate(diff)).toISOString().slice(0, 10);
      byWeek[weekStart] = (byWeek[weekStart] || 0) + (Number(w.calories) || 0);
    });
    const bestWeekEntry = Object.entries(byWeek).sort((a, b) => b[1] - a[1])[0];
    const bestWeek = bestWeekEntry ? { date: bestWeekEntry[0], calories: bestWeekEntry[1] } : null;

    // Strength PRs (highest weight per exercise)
    const exercisePRs = {};
    strength.forEach((w) => {
      (w.exercises || []).forEach((ex) => {
        const name = (ex.name || '').trim().toLowerCase();
        if (!name) return;
        const weight = Number(ex.weight) || 0;
        if (!exercisePRs[name] || weight > exercisePRs[name].weight) {
          exercisePRs[name] = {
            name: ex.name,
            weight,
            reps: ex.reps,
            sets: ex.sets,
            date: w.date,
          };
        }
      });
    });
    const strengthPRs = Object.values(exercisePRs)
      .filter((p) => p.weight > 0)
      .sort((a, b) => b.weight - a.weight);

    return {
      mostCalories,
      longestTime,
      longestRun,
      bestPace,
      highestAvgHR,
      highestMaxHR,
      bestDay,
      bestWeek,
      strengthPRs,
    };
  }, [workouts]);

  if (!records) {
    return (
      <div>
        <div className="page-head">
          <div>
            <div className="page-title">RECO<span>RDS</span></div>
            <div className="page-sub">// Your personal bests</div>
          </div>
        </div>
        <div className="card">
          <div className="empty">Log some workouts to see your records</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">RECO<span>RDS</span></div>
          <div className="page-sub">// Your personal bests</div>
        </div>
      </div>

      <div className="section-title">Single Workout Records</div>
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <RecordCard
          label="Most Calories"
          value={records.mostCalories?.calories}
          unit="cal"
          sub={records.mostCalories ? `${records.mostCalories.equipment} • ${fmtDate(records.mostCalories.date)}` : null}
        />
        <RecordCard
          label="Longest Time"
          value={records.longestTime?.minutes}
          unit="min"
          sub={records.longestTime ? `${records.longestTime.equipment} • ${fmtDate(records.longestTime.date)}` : null}
        />
        <RecordCard
          label="Longest Distance"
          value={records.longestRun?.miles}
          unit="miles"
          decimals={2}
          sub={records.longestRun ? `${records.longestRun.equipment} • ${fmtDate(records.longestRun.date)}` : null}
        />
      </div>

      <div className="section-title">Performance Records</div>
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <RecordCard
          label="Best Pace"
          customValue={records.bestPace ? fmtPace(records.bestPace.minutes, records.bestPace.miles) : null}
          unit="/mile"
          sub={records.bestPace ? `${records.bestPace.equipment} • ${fmtDate(records.bestPace.date)}` : null}
        />
        <RecordCard
          label="Highest Avg HR"
          value={records.highestAvgHR?.avgHR}
          unit="bpm"
          sub={records.highestAvgHR ? `${records.highestAvgHR.equipment} • ${fmtDate(records.highestAvgHR.date)}` : null}
        />
        <RecordCard
          label="Highest Max HR"
          value={records.highestMaxHR?.maxHR}
          unit="bpm"
          sub={records.highestMaxHR ? `${records.highestMaxHR.equipment} • ${fmtDate(records.highestMaxHR.date)}` : null}
        />
      </div>

      <div className="section-title">Aggregate Records</div>
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <RecordCard
          label="Best Single Day"
          value={records.bestDay?.calories}
          unit="cal"
          sub={records.bestDay ? fmtDate(records.bestDay.date) : null}
        />
        <RecordCard
          label="Best Week"
          value={records.bestWeek?.calories}
          unit="cal"
          sub={records.bestWeek ? `Week of ${fmtDate(records.bestWeek.date)}` : null}
        />
      </div>

      {records.strengthPRs.length > 0 && (
        <>
          <div className="section-title">Strength PRs</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Exercise</th>
                  <th>Weight</th>
                  <th>Sets × Reps</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {records.strengthPRs.map((p, i) => (
                  <tr key={i}>
                    <td style={{ textTransform: 'capitalize' }}>{p.name}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{fmtNum(p.weight)} lb</td>
                    <td>{p.sets || '?'} × {p.reps || '?'}</td>
                    <td>{fmtDate(p.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function RecordCard({ label, value, customValue, unit, sub, decimals = 0 }) {
  return (
    <div className="card stat-card">
      <div className="stat-label">
        <Trophy size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4, color: 'var(--accent)' }} />
        {label}
      </div>
      <div>
        <span className="stat-value accent">
          {customValue !== undefined ? (customValue || '—') : (value ? fmtNum(value, decimals) : '—')}
        </span>
        {(value || customValue) && <span className="stat-unit">{unit}</span>}
      </div>
      {sub && <div className="stat-delta">{sub}</div>}
    </div>
  );
}
