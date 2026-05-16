import { todayISO } from './storage';

// ── Rest Day Intelligence ─────────────────────────────────
// Analyzes workout patterns and returns a recommendation object

export const getRestAdvice = (workouts) => {
  const today = todayISO();

  if (!workouts.length) return null;

  const sorted = [...new Set(workouts.map((w) => w.date))].sort().reverse();
  const todayWorkedOut = sorted[0] === today;

  // Count consecutive days worked out ending today (or yesterday)
  let streak = 0;
  let cursor = todayWorkedOut ? today : null;
  if (!cursor) {
    // Check if yesterday has a workout
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yISO = yesterday.toISOString().slice(0, 10);
    if (sorted[0] === yISO) cursor = yISO;
  }

  if (cursor) {
    for (const date of sorted) {
      const expected = new Date(cursor + 'T00:00:00');
      expected.setDate(expected.getDate() - streak);
      const expISO = expected.toISOString().slice(0, 10);
      if (date === expISO) streak++;
      else break;
    }
  }

  // Days since last workout
  const lastDate = sorted[0];
  const daysSince = Math.round(
    (new Date(today + 'T00:00:00') - new Date(lastDate + 'T00:00:00')) / 86400000
  );

  // Last 7 days workout types
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenISO = sevenDaysAgo.toISOString().slice(0, 10);
  const recentWorkouts = workouts.filter((w) => w.date >= sevenISO);
  const recentDays     = new Set(recentWorkouts.map((w) => w.date)).size;
  const hasStrength    = recentWorkouts.some((w) => w.type === 'strength');

  // Avg calories last 7 days active
  const recentCals = recentWorkouts.reduce((s, w) => s + (Number(w.calories) || 0), 0);

  // Build recommendation
  if (daysSince === 0 && streak >= 6) {
    return {
      type: 'rest',
      icon: '🧘',
      title: 'Rest Day Recommended',
      message: `${streak} days straight. Your body rebuilds during rest — take it or go light today. Active recovery (walk, stretch) counts.`,
      color: 'var(--warn)',
    };
  }

  if (daysSince === 0 && streak >= 3) {
    return {
      type: 'monitor',
      icon: '👀',
      title: `${streak}-Day Streak`,
      message: 'Solid run. Consider whether today should be a lighter session or active recovery. ${streak >= 5 ? "Rest day coming soon." : "Keep it going."}',
      color: 'var(--info)',
    };
  }

  if (daysSince === 1 && !todayWorkedOut) {
    return {
      type: 'go',
      icon: '💪',
      title: 'Rested and Ready',
      message: "Yesterday was your last session. Today's a great day to get after it.",
      color: 'var(--accent)',
    };
  }

  if (daysSince >= 3 && !todayWorkedOut) {
    return {
      type: 'nudge',
      icon: '⚡',
      title: `${daysSince} Days Without a Workout`,
      message: daysSince >= 7
        ? "It's been a week. One session today gets everything moving again — doesn't have to be perfect."
        : 'Body is recovered. Time to move. Even a short session breaks the gap.',
      color: 'var(--danger)',
    };
  }

  if (daysSince >= 2 && !todayWorkedOut) {
    return {
      type: 'nudge',
      icon: '🔔',
      title: '2-Day Break',
      message: 'Two days off. A good session today keeps your momentum going.',
      color: 'var(--warn)',
    };
  }

  if (todayWorkedOut && streak >= 4 && recentDays >= 5) {
    return {
      type: 'monitor',
      icon: '🔥',
      title: `${streak}-Day Streak — Listening to Your Body?`,
      message: 'High output week. Make sure sleep and recovery are dialed in. A rest day in the next day or two is smart.',
      color: 'var(--warn)',
    };
  }

  if (todayWorkedOut) {
    return {
      type: 'good',
      icon: '✓',
      title: 'Workout Logged Today',
      message: streak > 1
        ? `${streak}-day streak. Stay consistent.`
        : 'Good work today.',
      color: 'var(--accent)',
    };
  }

  return null;
};
