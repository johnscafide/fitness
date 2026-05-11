import { useMemo } from 'react';
import { BADGES, computeStats } from '../badges';

export default function Badges({ workouts, weights, profile }) {
  const stats = useMemo(
    () => computeStats(workouts, weights, profile.dailyCalorieGoal),
    [workouts, weights, profile.dailyCalorieGoal]
  );

  const evaluated = BADGES.map((b) => ({
    ...b,
    earned: b.check(stats),
  }));

  const earnedCount = evaluated.filter((b) => b.earned).length;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">BAD<span>GES</span></div>
          <div className="page-sub">// {earnedCount} / {BADGES.length} earned</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">Progress</div>
        <div style={{
          height: 12,
          background: 'var(--bg)',
          border: '1px solid var(--border-2)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 8,
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            width: `${(earnedCount / BADGES.length) * 100}%`,
            background: 'linear-gradient(90deg, var(--accent-2), var(--accent))',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>
          {Math.round((earnedCount / BADGES.length) * 100)}% complete
        </div>
      </div>

      <div className="badges-grid">
        {evaluated.map((b) => (
          <div key={b.id} className={`badge ${b.earned ? 'earned' : ''}`}>
            <div className="badge-icon">{b.icon}</div>
            <div className="badge-name">{b.name}</div>
            <div className="badge-desc">{b.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
