import { useMemo, useState } from 'react';
import { BADGES, computeStats } from '../badges';

export default function Badges({ workouts, weights, supplements, trtLogs, profile }) {
  const [filter, setFilter] = useState('All');

  const stats = useMemo(
    () => computeStats(workouts, weights, supplements || [], trtLogs || [], profile.dailyCalorieGoal),
    [workouts, weights, supplements, trtLogs, profile.dailyCalorieGoal]
  );

  const evaluated = BADGES.map((b) => ({ ...b, earned: b.check(stats) }));
  const earnedCount = evaluated.filter((b) => b.earned).length;

  const categories = ['All', ...new Set(BADGES.map((b) => b.category))];
  const filtered = filter === 'All' ? evaluated : evaluated.filter((b) => b.category === filter);
  const filteredEarned = filtered.filter((b) => b.earned).length;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">BAD<span>GES</span></div>
          <div className="page-sub">// {earnedCount} / {BADGES.length} earned</div>
        </div>
      </div>

      {/* Overall progress */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Overall Progress</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 32, color: 'var(--accent)' }}>
            {Math.round((earnedCount / BADGES.length) * 100)}%
          </div>
        </div>
        <div style={{ height: 12, background: 'var(--bg)', border: '1px solid var(--border-2)', overflow: 'hidden', position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: 0,
            width: `${(earnedCount / BADGES.length) * 100}%`,
            background: 'linear-gradient(90deg, var(--accent-2), var(--accent))',
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)', marginTop: 8 }}>
          {earnedCount} earned · {BADGES.length - earnedCount} remaining
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`btn small ${filter === cat ? '' : 'secondary'}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {filter !== 'All' && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)', marginBottom: 16 }}>
          {filteredEarned} / {filtered.length} earned in this category
        </div>
      )}

      <div className="badges-grid">
        {filtered.map((b) => (
          <BadgeCard key={b.id} badge={b} />
        ))}
      </div>
    </div>
  );
}

function BadgeCard({ badge }) {
  const { earned, mystery, revealName, revealIcon, revealDesc, mysteryHint } = badge;
  const showMystery = mystery && !earned;

  return (
    <div
      className={`badge ${earned ? 'earned' : ''}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {earned && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 1,
          color: 'var(--accent)', border: '1px solid rgba(198,255,61,0.4)',
          padding: '2px 5px',
        }}>✓</div>
      )}

      <div className="badge-icon">
        {earned && mystery ? revealIcon : (showMystery ? '🔒' : badge.icon)}
      </div>

      <div className="badge-name">
        {earned && mystery ? revealName : (showMystery ? '???' : badge.name)}
      </div>

      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-mute)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4, marginBottom: 4 }}>
        {badge.category}
      </div>

      <div className="badge-desc">
        {earned && mystery ? revealDesc : showMystery ? mysteryHint : badge.desc}
      </div>
    </div>
  );
}
