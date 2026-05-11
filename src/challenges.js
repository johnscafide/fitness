import { todayISO } from './storage';

// ============================================================
// CHALLENGE ENGINE
// Challenges reset daily/weekly/monthly and are seeded by date
// so the same day always gives the same challenge
// ============================================================

const DAILY_CHALLENGES = [
  { id: 'd_burn300', name: 'Burn 300 Calories', desc: 'Hit 300+ calories burned today.', icon: '🔥', check: (s) => s.todayCals >= 300 },
  { id: 'd_burn400', name: 'Burn 400 Calories', desc: 'Hit 400+ calories burned today.', icon: '🔥', check: (s) => s.todayCals >= 400 },
  { id: 'd_burn500', name: 'Inferno Day', desc: 'Burn 500+ calories in a single day.', icon: '🌋', check: (s) => s.todayCals >= 500 },
  { id: 'd_30min', name: '30 Minute Session', desc: 'Work out for at least 30 minutes today.', icon: '⏱️', check: (s) => s.todayMins >= 30 },
  { id: 'd_45min', name: '45 Minute Grind', desc: 'Get in 45+ minutes today.', icon: '⌚', check: (s) => s.todayMins >= 45 },
  { id: 'd_60min', name: 'Full Hour', desc: 'Log 60+ minutes of exercise today.', icon: '⏰', check: (s) => s.todayMins >= 60 },
  { id: 'd_cardio', name: 'Cardio Day', desc: 'Log at least one cardio workout today.', icon: '❤️', check: (s) => s.todayCardio >= 1 },
  { id: 'd_strength', name: 'Iron Day', desc: 'Log at least one strength workout today.', icon: '💪', check: (s) => s.todayStrength >= 1 },
  { id: 'd_double', name: 'Double Session', desc: 'Log two workouts today.', icon: '✌️', check: (s) => s.todayWorkouts >= 2 },
  { id: 'd_mile', name: 'Log a Mile', desc: 'Run or walk at least 1 mile today.', icon: '🏃', check: (s) => s.todayMiles >= 1 },
  { id: 'd_two_miles', name: 'Two Mile Day', desc: 'Log 2+ miles today.', icon: '🛤️', check: (s) => s.todayMiles >= 2 },
  { id: 'd_supplements', name: 'Stack Up', desc: 'Log all your supplements today.', icon: '💊', check: (s) => s.todaySupps >= 2 },
  { id: 'd_log_weight', name: 'Weigh In', desc: 'Log your weight today.', icon: '⚖️', check: (s) => s.loggedWeightToday },
  { id: 'd_goal', name: 'Hit Your Goal', desc: 'Exceed your daily calorie burn goal.', icon: '🎯', check: (s) => s.hitGoalToday },
];

const WEEKLY_CHALLENGES = [
  { id: 'w_3workouts', name: '3 This Week', desc: 'Work out at least 3 times this week.', icon: '📅', check: (s) => s.weekWorkouts >= 3 },
  { id: 'w_5workouts', name: '5 Day Week', desc: 'Hit 5 workouts this week.', icon: '🗓️', check: (s) => s.weekWorkouts >= 5 },
  { id: 'w_1500cals', name: '1,500 Cal Week', desc: 'Burn 1,500+ calories this week.', icon: '🔥', check: (s) => s.weekCals >= 1500 },
  { id: 'w_2500cals', name: '2,500 Cal Week', desc: 'Burn 2,500+ calories this week.', icon: '💥', check: (s) => s.weekCals >= 2500 },
  { id: 'w_mix', name: 'Mix It Up', desc: 'Do both cardio and strength this week.', icon: '⚖️', check: (s) => s.weekCardio >= 1 && s.weekStrength >= 1 },
  { id: 'w_miles', name: '5 Miles This Week', desc: 'Log 5+ miles this week.', icon: '🏃', check: (s) => s.weekMiles >= 5 },
  { id: 'w_240min', name: '4 Hours of Work', desc: 'Log 240+ minutes of exercise this week.', icon: '⏱️', check: (s) => s.weekMins >= 240 },
  { id: 'w_supplements', name: 'Perfect Protocol Week', desc: 'Log supplements every day this week.', icon: '💊', check: (s) => s.weekSuppDays >= 7 },
  { id: 'w_hit_goal', name: 'Goal 5x This Week', desc: 'Hit your daily calorie goal 5 days this week.', icon: '🎯', check: (s) => s.weekGoalDays >= 5 },
];

const MONTHLY_CHALLENGES = [
  { id: 'm_20workouts', name: '20 This Month', desc: 'Complete 20 workouts this month.', icon: '📅', check: (s) => s.monthWorkouts >= 20 },
  { id: 'm_25workouts', name: 'Grind Month', desc: 'Hit 25 workouts in a single month.', icon: '🏆', check: (s) => s.monthWorkouts >= 25 },
  { id: 'm_10k_cals', name: '10K Calorie Month', desc: 'Burn 10,000+ calories this month.', icon: '🔥', check: (s) => s.monthCals >= 10000 },
  { id: 'm_streak14', name: '14 Day Streak', desc: 'Build a 14-day streak this month.', icon: '⚡', check: (s) => s.currentStreak >= 14 },
  { id: 'm_20miles', name: '20 Miles This Month', desc: 'Log 20+ miles this month.', icon: '🛣️', check: (s) => s.monthMiles >= 20 },
  { id: 'm_weight_check', name: 'Monthly Weigh-In', desc: 'Log your weight at least 4 times this month.', icon: '⚖️', check: (s) => s.monthWeightLogs >= 4 },
  { id: 'm_protocol', name: 'Full Month Protocol', desc: 'Log supplements 25+ days this month.', icon: '🧬', check: (s) => s.monthSuppDays >= 25 },
  { id: 'm_lose2lbs', name: 'Lose 2 This Month', desc: 'Lose 2 pounds in this calendar month.', icon: '📉', check: (s) => s.monthWeightLoss >= 2 },
  { id: 'm_balance', name: 'Balanced Month', desc: 'Log at least 8 cardio and 8 strength workouts.', icon: '⚔️', check: (s) => s.monthCardio >= 8 && s.monthStrength >= 8 },
];

// Pick challenges using a date-based seed (same day = same challenges)
const seededPick = (arr, n, seed) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    h = (Math.imul(1664525, h) + 1013904223) | 0;
    const j = Math.abs(h) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
};

export const getWeekStart = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date(d).setDate(diff)).toISOString().slice(0, 10);
};

export const getMonthStart = (dateStr) => dateStr.slice(0, 7) + '-01';

export const getTodayChallenges = () => {
  const today = todayISO();
  return seededPick(DAILY_CHALLENGES, 3, 'daily-' + today);
};

export const getWeeklyChallenges = () => {
  const weekStart = getWeekStart(todayISO());
  return seededPick(WEEKLY_CHALLENGES, 3, 'weekly-' + weekStart);
};

export const getMonthlyChallenges = () => {
  const monthStart = getMonthStart(todayISO());
  return seededPick(MONTHLY_CHALLENGES, 3, 'monthly-' + monthStart);
};

// ── Compute live stats for challenges ──────────────────────
export const computeChallengeStats = (workouts, weights, supplements, trtLogs, profile) => {
  const today = todayISO();
  const weekStart = getWeekStart(today);
  const monthStart = getMonthStart(today);

  const todayW = workouts.filter((w) => w.date === today);
  const weekW = workouts.filter((w) => w.date >= weekStart && w.date <= today);
  const monthW = workouts.filter((w) => w.date >= monthStart && w.date <= today);

  const todayCals = todayW.reduce((s, w) => s + (Number(w.calories) || 0), 0);
  const todayMins = todayW.reduce((s, w) => s + (Number(w.minutes) || 0), 0);
  const todayMiles = todayW.reduce((s, w) => s + (Number(w.miles) || 0), 0);
  const todayCardio = todayW.filter((w) => w.type === 'cardio').length;
  const todayStrength = todayW.filter((w) => w.type === 'strength').length;
  const todayWorkouts = todayW.length;

  const todaySupps = (supplements || []).filter((s) => s.date === today).length;
  const loggedWeightToday = (weights || []).some((w) => w.date === today);
  const hitGoalToday = todayCals >= (profile?.dailyCalorieGoal || 300);

  const weekCals = weekW.reduce((s, w) => s + (Number(w.calories) || 0), 0);
  const weekMins = weekW.reduce((s, w) => s + (Number(w.minutes) || 0), 0);
  const weekMiles = weekW.reduce((s, w) => s + (Number(w.miles) || 0), 0);
  const weekWorkouts = new Set(weekW.map((w) => w.date)).size;
  const weekCardio = weekW.filter((w) => w.type === 'cardio').length;
  const weekStrength = weekW.filter((w) => w.type === 'strength').length;
  const weekSuppDays = new Set((supplements || []).filter((s) => s.date >= weekStart && s.date <= today).map((s) => s.date)).size;
  const byDayGoal = {};
  weekW.forEach((w) => { byDayGoal[w.date] = (byDayGoal[w.date] || 0) + (Number(w.calories) || 0); });
  const weekGoalDays = Object.values(byDayGoal).filter((c) => c >= (profile?.dailyCalorieGoal || 300)).length;

  const monthCals = monthW.reduce((s, w) => s + (Number(w.calories) || 0), 0);
  const monthMiles = monthW.reduce((s, w) => s + (Number(w.miles) || 0), 0);
  const monthWorkouts = monthW.length;
  const monthCardio = monthW.filter((w) => w.type === 'cardio').length;
  const monthStrength = monthW.filter((w) => w.type === 'strength').length;
  const monthSuppDays = new Set((supplements || []).filter((s) => s.date >= monthStart && s.date <= today).map((s) => s.date)).size;
  const monthWeightLogs = (weights || []).filter((w) => w.date >= monthStart && w.date <= today).length;

  // Monthly weight loss
  const monthWeights = [...(weights || [])].filter((w) => w.date >= monthStart && w.date <= today).sort((a, b) => a.date.localeCompare(b.date));
  const monthWeightLoss = monthWeights.length >= 2
    ? Math.max(0, Number(monthWeights[0].weight) - Number(monthWeights[monthWeights.length - 1].weight))
    : 0;

  // Current streak
  const dates = [...new Set(workouts.map((w) => w.date))].sort().reverse();
  let currentStreak = 0;
  if (dates[0] === today || (dates[0] && Math.round((new Date(today + 'T00:00:00') - new Date(dates[0] + 'T00:00:00')) / 86400000) <= 1)) {
    currentStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const gap = Math.round((new Date(dates[i - 1] + 'T00:00:00') - new Date(dates[i] + 'T00:00:00')) / 86400000);
      if (gap === 1) currentStreak++;
      else break;
    }
  }

  return {
    todayCals, todayMins, todayMiles, todayCardio, todayStrength, todayWorkouts,
    todaySupps, loggedWeightToday, hitGoalToday,
    weekCals, weekMins, weekMiles, weekWorkouts, weekCardio, weekStrength, weekSuppDays, weekGoalDays,
    monthCals, monthMiles, monthWorkouts, monthCardio, monthStrength, monthSuppDays, monthWeightLogs, monthWeightLoss,
    currentStreak,
  };
};
