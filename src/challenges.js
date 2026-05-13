import { todayISO, storage } from './storage';

// ============================================================
// CHALLENGE ENGINE v2 — DLC-ready
//
// Challenge shape:
// {
//   id:       string          — unique, namespaced by pack
//   name:     string
//   desc:     string
//   icon:     string
//   type:     'daily' | 'weekly' | 'monthly' | 'event'
//   period?:  { start, end }  — event challenges only
//   check:    (stats) => boolean
//   progress: (stats) => { current, target, unit, format? }
//                              — drives the mini progress bar
//   dlc?:     string           — pack name this came from
//   seasonal? bool
// }
// ============================================================

// ── Progress helpers ─────────────────────────────────────
// These are reusable builders so every challenge has a consistent tracker shape

const prog = (current, target, unit, format) => ({ current, target, unit, format });

// ── Built-in Daily Challenges ─────────────────────────────
export const DAILY_CHALLENGES = [
  {
    id: 'd_burn300', name: 'Burn 300 Calories', icon: '🔥',
    desc: 'Hit 300+ calories burned today.',
    check: (s) => s.todayCals >= 300,
    progress: (s) => prog(s.todayCals, 300, 'cal'),
  },
  {
    id: 'd_burn400', name: 'Burn 400 Calories', icon: '🔥',
    desc: 'Hit 400+ calories burned today.',
    check: (s) => s.todayCals >= 400,
    progress: (s) => prog(s.todayCals, 400, 'cal'),
  },
  {
    id: 'd_burn500', name: 'Inferno Day', icon: '🌋',
    desc: 'Burn 500+ calories in a single day.',
    check: (s) => s.todayCals >= 500,
    progress: (s) => prog(s.todayCals, 500, 'cal'),
  },
  {
    id: 'd_30min', name: '30 Minute Session', icon: '⏱️',
    desc: 'Work out for at least 30 minutes today.',
    check: (s) => s.todayMins >= 30,
    progress: (s) => prog(s.todayMins, 30, 'min'),
  },
  {
    id: 'd_45min', name: '45 Minute Grind', icon: '⌚',
    desc: 'Get in 45+ minutes today.',
    check: (s) => s.todayMins >= 45,
    progress: (s) => prog(s.todayMins, 45, 'min'),
  },
  {
    id: 'd_60min', name: 'Full Hour', icon: '⏰',
    desc: 'Log 60+ minutes of exercise today.',
    check: (s) => s.todayMins >= 60,
    progress: (s) => prog(s.todayMins, 60, 'min'),
  },
  {
    id: 'd_cardio', name: 'Cardio Day', icon: '❤️',
    desc: 'Log at least one cardio workout today.',
    check: (s) => s.todayCardio >= 1,
    progress: (s) => prog(s.todayCardio, 1, 'session'),
  },
  {
    id: 'd_strength', name: 'Iron Day', icon: '💪',
    desc: 'Log at least one strength workout today.',
    check: (s) => s.todayStrength >= 1,
    progress: (s) => prog(s.todayStrength, 1, 'session'),
  },
  {
    id: 'd_double', name: 'Double Session', icon: '✌️',
    desc: 'Log two workouts today.',
    check: (s) => s.todayWorkouts >= 2,
    progress: (s) => prog(s.todayWorkouts, 2, 'workouts'),
  },
  {
    id: 'd_mile', name: 'Log a Mile', icon: '🏃',
    desc: 'Run or walk at least 1 mile today.',
    check: (s) => s.todayMiles >= 1,
    progress: (s) => prog(s.todayMiles, 1, 'mi', '0.00'),
  },
  {
    id: 'd_two_miles', name: 'Two Mile Day', icon: '🛤️',
    desc: 'Log 2+ miles today.',
    check: (s) => s.todayMiles >= 2,
    progress: (s) => prog(s.todayMiles, 2, 'mi', '0.00'),
  },
  {
    id: 'd_supplements', name: 'Stack Up', icon: '💊',
    desc: 'Log all your supplements today.',
    check: (s) => s.todaySupps >= 2,
    progress: (s) => prog(s.todaySupps, 2, 'supps'),
  },
  {
    id: 'd_log_weight', name: 'Weigh In', icon: '⚖️',
    desc: 'Log your weight today.',
    check: (s) => s.loggedWeightToday,
    progress: (s) => prog(s.loggedWeightToday ? 1 : 0, 1, 'entry'),
  },
  {
    id: 'd_goal', name: 'Hit Your Goal', icon: '🎯',
    desc: 'Exceed your daily calorie burn goal.',
    check: (s) => s.hitGoalToday,
    progress: (s) => prog(s.todayCals, s.dailyGoal, 'cal'),
  },
];

// ── Built-in Weekly Challenges ────────────────────────────
export const WEEKLY_CHALLENGES = [
  {
    id: 'w_3workouts', name: '3 This Week', icon: '📅',
    desc: 'Work out at least 3 times this week.',
    check: (s) => s.weekWorkouts >= 3,
    progress: (s) => prog(s.weekWorkouts, 3, 'workouts'),
  },
  {
    id: 'w_5workouts', name: '5 Day Week', icon: '🗓️',
    desc: 'Hit 5 workouts this week.',
    check: (s) => s.weekWorkouts >= 5,
    progress: (s) => prog(s.weekWorkouts, 5, 'workouts'),
  },
  {
    id: 'w_1500cals', name: '1,500 Cal Week', icon: '🔥',
    desc: 'Burn 1,500+ calories this week.',
    check: (s) => s.weekCals >= 1500,
    progress: (s) => prog(s.weekCals, 1500, 'cal'),
  },
  {
    id: 'w_2500cals', name: '2,500 Cal Week', icon: '💥',
    desc: 'Burn 2,500+ calories this week.',
    check: (s) => s.weekCals >= 2500,
    progress: (s) => prog(s.weekCals, 2500, 'cal'),
  },
  {
    id: 'w_mix', name: 'Mix It Up', icon: '⚖️',
    desc: 'Do both cardio and strength this week.',
    check: (s) => s.weekCardio >= 1 && s.weekStrength >= 1,
    progress: (s) => prog(Math.min(s.weekCardio, 1) + Math.min(s.weekStrength, 1), 2, 'types'),
  },
  {
    id: 'w_miles', name: '5 Miles This Week', icon: '🏃',
    desc: 'Log 5+ miles this week.',
    check: (s) => s.weekMiles >= 5,
    progress: (s) => prog(s.weekMiles, 5, 'mi', '0.1'),
  },
  {
    id: 'w_240min', name: '4 Hours of Work', icon: '⏱️',
    desc: 'Log 240+ minutes of exercise this week.',
    check: (s) => s.weekMins >= 240,
    progress: (s) => prog(s.weekMins, 240, 'min'),
  },
  {
    id: 'w_supplements', name: 'Perfect Protocol Week', icon: '💊',
    desc: 'Log supplements every day this week.',
    check: (s) => s.weekSuppDays >= 7,
    progress: (s) => prog(s.weekSuppDays, 7, 'days'),
  },
  {
    id: 'w_hit_goal', name: 'Goal 5x This Week', icon: '🎯',
    desc: 'Hit your daily calorie goal 5 days this week.',
    check: (s) => s.weekGoalDays >= 5,
    progress: (s) => prog(s.weekGoalDays, 5, 'days'),
  },
];

// ── Built-in Monthly Challenges ───────────────────────────
export const MONTHLY_CHALLENGES = [
  {
    id: 'm_20workouts', name: '20 This Month', icon: '📅',
    desc: 'Complete 20 workouts this month.',
    check: (s) => s.monthWorkouts >= 20,
    progress: (s) => prog(s.monthWorkouts, 20, 'workouts'),
  },
  {
    id: 'm_25workouts', name: 'Grind Month', icon: '🏆',
    desc: 'Hit 25 workouts in a single month.',
    check: (s) => s.monthWorkouts >= 25,
    progress: (s) => prog(s.monthWorkouts, 25, 'workouts'),
  },
  {
    id: 'm_10k_cals', name: '10K Calorie Month', icon: '🔥',
    desc: 'Burn 10,000+ calories this month.',
    check: (s) => s.monthCals >= 10000,
    progress: (s) => prog(s.monthCals, 10000, 'cal'),
  },
  {
    id: 'm_streak14', name: '14 Day Streak', icon: '⚡',
    desc: 'Build a 14-day streak this month.',
    check: (s) => s.currentStreak >= 14,
    progress: (s) => prog(s.currentStreak, 14, 'days'),
  },
  {
    id: 'm_20miles', name: '20 Miles This Month', icon: '🛣️',
    desc: 'Log 20+ miles this month.',
    check: (s) => s.monthMiles >= 20,
    progress: (s) => prog(s.monthMiles, 20, 'mi', '0.1'),
  },
  {
    id: 'm_weight_check', name: 'Monthly Weigh-In', icon: '⚖️',
    desc: 'Log your weight at least 4 times this month.',
    check: (s) => s.monthWeightLogs >= 4,
    progress: (s) => prog(s.monthWeightLogs, 4, 'entries'),
  },
  {
    id: 'm_protocol', name: 'Full Month Protocol', icon: '🧬',
    desc: 'Log supplements 25+ days this month.',
    check: (s) => s.monthSuppDays >= 25,
    progress: (s) => prog(s.monthSuppDays, 25, 'days'),
  },
  {
    id: 'm_lose2lbs', name: 'Lose 2 This Month', icon: '📉',
    desc: 'Lose 2 pounds in this calendar month.',
    check: (s) => s.monthWeightLoss >= 2,
    progress: (s) => prog(s.monthWeightLoss, 2, 'lbs', '0.1'),
  },
  {
    id: 'm_balance', name: 'Balanced Month', icon: '⚔️',
    desc: 'Log at least 8 cardio and 8 strength workouts.',
    check: (s) => s.monthCardio >= 8 && s.monthStrength >= 8,
    progress: (s) => prog(Math.min(s.monthCardio, 8) + Math.min(s.monthStrength, 8), 16, 'sessions'),
  },
];

// ── Built-in Event Challenges ─────────────────────────────
// These are "always installed" — DLC events get added on top
export const BUILTIN_EVENTS = [
  {
    id: 'event_sprint_summer_2026',
    name: 'Sprint to Summer',
    icon: '☀️',
    type: 'event',
    dlc: 'Season: Summer 2026',
    seasonal: true,
    period: { start: '2026-05-01', end: '2026-06-21' },
    desc: 'Burn 15,000 calories between May 1 and June 21. Summer is coming — earn it.',
    check: (s) => s.sprintToSummerCals >= 15000,
    progress: (s) => prog(s.sprintToSummerCals, 15000, 'cal'),
    reward: '🏖️ Summer Warrior Badge',
  },
];

// ── DLC Storage key ───────────────────────────────────────
const DLC_KEY = 'dlc_packs';

export const getDLCPacks = () => storage.get(DLC_KEY, []);

export const importDLCPack = (pack) => {
  const existing = getDLCPacks();
  const withoutOld = existing.filter((p) => p.id !== pack.id);
  storage.set(DLC_KEY, [...withoutOld, pack]);
};

export const removeDLCPack = (packId) => {
  storage.set(DLC_KEY, getDLCPacks().filter((p) => p.id !== packId));
};

// Flatten DLC challenges into typed arrays
const getDLCChallenges = () => {
  const packs = getDLCPacks();
  const daily = [], weekly = [], monthly = [], events = [];
  packs.forEach((pack) => {
    (pack.challenges || []).forEach((c) => {
      const tagged = { ...c, dlc: pack.name };
      if (c.type === 'daily')   daily.push(tagged);
      if (c.type === 'weekly')  weekly.push(tagged);
      if (c.type === 'monthly') monthly.push(tagged);
      if (c.type === 'event')   events.push(tagged);
    });
  });
  return { daily, weekly, monthly, events };
};

// ── History of completed challenges (lifetime) ─────────────
const HISTORY_KEY = 'challenge_history';

export const getChallengeHistory = () => storage.get(HISTORY_KEY, []);

export const recordChallengeComplete = (challengeId, challengeName, date) => {
  const history = getChallengeHistory();
  const alreadyRecorded = history.some(
    (h) => h.id === challengeId && h.date === date
  );
  if (alreadyRecorded) return;
  storage.set(HISTORY_KEY, [
    ...history,
    { id: challengeId, name: challengeName, date, completedAt: new Date().toISOString() },
  ]);
};

// ── Seeded picker ─────────────────────────────────────────
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

// ── Active challenges getters ─────────────────────────────
export const getTodayChallenges = () => {
  const { daily: dlcDaily } = getDLCChallenges();
  const pool = [...DAILY_CHALLENGES, ...dlcDaily];
  return seededPick(pool, 3, 'daily-' + todayISO());
};

export const getWeeklyChallenges = () => {
  const { weekly: dlcWeekly } = getDLCChallenges();
  const pool = [...WEEKLY_CHALLENGES, ...dlcWeekly];
  return seededPick(pool, 3, 'weekly-' + getWeekStart(todayISO()));
};

export const getMonthlyChallenges = () => {
  const { monthly: dlcMonthly } = getDLCChallenges();
  const pool = [...MONTHLY_CHALLENGES, ...dlcMonthly];
  return seededPick(pool, 3, 'monthly-' + getMonthStart(todayISO()));
};

export const getActiveEventChallenges = () => {
  const { events: dlcEvents } = getDLCChallenges();
  const today = todayISO();
  return [...BUILTIN_EVENTS, ...dlcEvents].filter((e) => {
    if (!e.period) return true;
    return today >= e.period.start && today <= e.period.end;
  });
};

// ── Challenge stats (drives both check and progress) ──────
export const computeChallengeStats = (workouts, weights, supplements, trtLogs, profile) => {
  const today      = todayISO();
  const weekStart  = getWeekStart(today);
  const monthStart = getMonthStart(today);

  const todayW  = workouts.filter((w) => w.date === today);
  const weekW   = workouts.filter((w) => w.date >= weekStart  && w.date <= today);
  const monthW  = workouts.filter((w) => w.date >= monthStart && w.date <= today);
  // Sprint to Summer window
  const sprintW = workouts.filter((w) => w.date >= '2026-05-01' && w.date <= '2026-06-21');

  const todayCals     = todayW.reduce((s, w) => s + (Number(w.calories) || 0), 0);
  const todayMins     = todayW.reduce((s, w) => s + (Number(w.minutes)  || 0), 0);
  const todayMiles    = todayW.reduce((s, w) => s + (Number(w.miles)    || 0), 0);
  const todayCardio   = todayW.filter((w) => w.type === 'cardio').length;
  const todayStrength = todayW.filter((w) => w.type === 'strength').length;
  const todayWorkouts = todayW.length;
  const todaySupps    = (supplements || []).filter((s) => s.date === today).length;
  const loggedWeightToday = (weights || []).some((w) => w.date === today);
  const dailyGoal     = profile?.dailyCalorieGoal || 300;
  const hitGoalToday  = todayCals >= dailyGoal;

  const weekCals     = weekW.reduce((s, w) => s + (Number(w.calories) || 0), 0);
  const weekMins     = weekW.reduce((s, w) => s + (Number(w.minutes)  || 0), 0);
  const weekMiles    = weekW.reduce((s, w) => s + (Number(w.miles)    || 0), 0);
  const weekWorkouts = new Set(weekW.map((w) => w.date)).size;
  const weekCardio   = weekW.filter((w) => w.type === 'cardio').length;
  const weekStrength = weekW.filter((w) => w.type === 'strength').length;
  const weekSuppDays = new Set((supplements || []).filter((s) => s.date >= weekStart && s.date <= today).map((s) => s.date)).size;
  const byDayGoal    = {};
  weekW.forEach((w) => { byDayGoal[w.date] = (byDayGoal[w.date] || 0) + (Number(w.calories) || 0); });
  const weekGoalDays = Object.values(byDayGoal).filter((c) => c >= dailyGoal).length;

  const monthCals      = monthW.reduce((s, w) => s + (Number(w.calories) || 0), 0);
  const monthMiles     = monthW.reduce((s, w) => s + (Number(w.miles)    || 0), 0);
  const monthWorkouts  = monthW.length;
  const monthCardio    = monthW.filter((w) => w.type === 'cardio').length;
  const monthStrength  = monthW.filter((w) => w.type === 'strength').length;
  const monthSuppDays  = new Set((supplements || []).filter((s) => s.date >= monthStart && s.date <= today).map((s) => s.date)).size;
  const monthWeightLogs = (weights || []).filter((w) => w.date >= monthStart && w.date <= today).length;
  const monthWeights   = [...(weights || [])].filter((w) => w.date >= monthStart && w.date <= today).sort((a, b) => a.date.localeCompare(b.date));
  const monthWeightLoss = monthWeights.length >= 2
    ? Math.max(0, Number(monthWeights[0].weight) - Number(monthWeights[monthWeights.length - 1].weight))
    : 0;

  const sprintToSummerCals = sprintW.reduce((s, w) => s + (Number(w.calories) || 0), 0);

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
    todaySupps, loggedWeightToday, hitGoalToday, dailyGoal,
    weekCals, weekMins, weekMiles, weekWorkouts, weekCardio, weekStrength, weekSuppDays, weekGoalDays,
    monthCals, monthMiles, monthWorkouts, monthCardio, monthStrength, monthSuppDays, monthWeightLogs, monthWeightLoss,
    sprintToSummerCals,
    currentStreak,
  };
};

// ── DLC Pack validator (for import) ──────────────────────
export const validateDLCPack = (raw) => {
  const errors = [];
  if (!raw.id)   errors.push('Missing pack id');
  if (!raw.name) errors.push('Missing pack name');
  if (!Array.isArray(raw.challenges)) errors.push('Missing challenges array');
  else {
    raw.challenges.forEach((c, i) => {
      if (!c.id)   errors.push(`Challenge ${i}: missing id`);
      if (!c.name) errors.push(`Challenge ${i}: missing name`);
      if (!['daily','weekly','monthly','event'].includes(c.type))
        errors.push(`Challenge ${i}: type must be daily/weekly/monthly/event`);
    });
  }
  return errors;
};

// ── Sample DLC pack (for "download" demo) ─────────────────
export const SAMPLE_DLC_PACK = {
  id: 'dlc_holiday_2026',
  name: 'Holiday Hustle 2026',
  version: '1.0',
  author: 'Hybrid Hustler',
  description: 'Seasonal challenges for the holiday season. Stay on track through November and December.',
  challenges: [
    {
      id: 'dlc_hh26_d_turkey', name: 'Turkey Burner', icon: '🦃', type: 'daily',
      desc: 'Burn 500+ calories the day before Thanksgiving.',
      check: { type: 'gte', stat: 'todayCals', value: 500 },
      progress: { stat: 'todayCals', target: 500, unit: 'cal' },
    },
    {
      id: 'dlc_hh26_w_dec', name: 'December Grind', icon: '❄️', type: 'weekly',
      desc: 'Work out 4 times this week during December.',
      check: { type: 'gte', stat: 'weekWorkouts', value: 4 },
      progress: { stat: 'weekWorkouts', target: 4, unit: 'workouts' },
    },
    {
      id: 'dlc_hh26_event_nye', name: 'New Year Ready', icon: '🎆', type: 'event',
      period: { start: '2026-12-01', end: '2026-12-31' },
      desc: 'Burn 12,000 calories in December.',
      check: { type: 'gte', stat: 'monthCals', value: 12000 },
      progress: { stat: 'monthCals', target: 12000, unit: 'cal' },
    },
  ],
};
