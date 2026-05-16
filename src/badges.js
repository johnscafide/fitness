// ============================================================
// BADGE SYSTEM — 60+ badges including mystery ones
// mystery: true = shows as ??? until earned
// ============================================================

export const BADGES = [
  // ── FIRST STEPS ──────────────────────────────────────────
  {
    id: 'first_workout', name: 'First Step', icon: '👟', category: 'Milestones',
    desc: 'Log your very first workout.',
    check: (s) => s.totalWorkouts >= 1,
  },
  {
    id: 'first_mile', name: 'First Mile', icon: '🏃', category: 'Milestones',
    desc: 'Log your first mile.',
    check: (s) => s.totalMiles >= 1,
  },
  {
    id: 'weight_logged', name: 'Face the Scale', icon: '⚖️', category: 'Milestones',
    desc: 'Log your first weight entry.',
    check: (s) => s.weightEntries >= 1,
  },
  {
    id: 'first_strength', name: 'Iron Curious', icon: '🏋️', category: 'Milestones',
    desc: 'Log your first strength workout.',
    check: (s) => s.strengthWorkouts >= 1,
  },
  {
    id: 'first_supplement', name: 'Stack Attack', icon: '💊', category: 'Milestones',
    desc: 'Log your first supplement.',
    check: (s) => s.totalSupplementLogs >= 1,
  },
  {
    id: 'first_trt', name: 'Protocol Started', icon: '💉', category: 'Milestones',
    desc: 'Log your first TRT injection.',
    check: (s) => s.totalTrtLogs >= 1,
  },

  // ── WORKOUT COUNT ─────────────────────────────────────────
  {
    id: 'ten_workouts', name: 'Double Digits', icon: '🔟', category: 'Volume',
    desc: 'Complete 10 workouts.',
    check: (s) => s.totalWorkouts >= 10,
  },
  {
    id: 'twenty_five_workouts', name: 'Quarter Century', icon: '🥈', category: 'Volume',
    desc: 'Complete 25 workouts.',
    check: (s) => s.totalWorkouts >= 25,
  },
  {
    id: 'fifty_workouts', name: 'Half Century', icon: '🥇', category: 'Volume',
    desc: 'Complete 50 workouts.',
    check: (s) => s.totalWorkouts >= 50,
  },
  {
    id: 'hundred_workouts', name: 'Centurion', icon: '💯', category: 'Volume',
    desc: 'Complete 100 workouts.',
    check: (s) => s.totalWorkouts >= 100,
  },
  {
    id: 'two_fifty_workouts', name: 'Obsessed', icon: '🏆', category: 'Volume',
    desc: 'Complete 250 workouts.',
    check: (s) => s.totalWorkouts >= 250,
  },
  {
    id: 'five_hundred_workouts', name: 'Legend', icon: '👑', category: 'Volume',
    desc: 'Complete 500 workouts.',
    check: (s) => s.totalWorkouts >= 500,
  },

  // ── STREAKS ───────────────────────────────────────────────
  {
    id: 'three_streak', name: 'Three Peat', icon: '🔁', category: 'Streaks',
    desc: 'Work out 3 days in a row.',
    check: (s) => s.longestStreak >= 3,
  },
  {
    id: 'week_streak', name: 'Week Warrior', icon: '🔥', category: 'Streaks',
    desc: 'Work out 7 days in a row.',
    check: (s) => s.longestStreak >= 7,
  },
  {
    id: 'two_week_streak', name: 'Fortnight Fighter', icon: '🔥🔥', category: 'Streaks',
    desc: 'Work out 14 days straight.',
    check: (s) => s.longestStreak >= 14,
  },
  {
    id: 'three_week_streak', name: 'Three Week Machine', icon: '⚡', category: 'Streaks',
    desc: 'Work out 21 days straight.',
    check: (s) => s.longestStreak >= 21,
  },
  {
    id: 'month_streak', name: 'Monthly Monster', icon: '🌕', category: 'Streaks',
    desc: 'Work out 30 days straight.',
    check: (s) => s.longestStreak >= 30,
  },
  {
    id: 'sixty_streak', name: 'Two Month Terror', icon: '💀', category: 'Streaks',
    desc: 'Work out 60 days straight.',
    check: (s) => s.longestStreak >= 60,
  },
  {
    id: 'ninety_streak', name: 'Quarter Year Beast', icon: '🦁', category: 'Streaks',
    desc: 'Work out 90 days straight.',
    check: (s) => s.longestStreak >= 90,
  },

  // ── CALORIES BURNED ───────────────────────────────────────
  {
    id: 'cal_1k', name: 'Kindling', icon: '🕯️', category: 'Calories',
    desc: 'Burn 1,000 total calories.',
    check: (s) => s.totalCalories >= 1000,
  },
  {
    id: 'cal_5k', name: '5K Burner', icon: '🔥', category: 'Calories',
    desc: 'Burn 5,000 total calories.',
    check: (s) => s.totalCalories >= 5000,
  },
  {
    id: 'cal_10k', name: 'Five Figures', icon: '💸', category: 'Calories',
    desc: 'Burn 10,000 total calories.',
    check: (s) => s.totalCalories >= 10000,
  },
  {
    id: 'cal_25k', name: '25K Club', icon: '🚀', category: 'Calories',
    desc: 'Burn 25,000 total calories.',
    check: (s) => s.totalCalories >= 25000,
  },
  {
    id: 'cal_50k', name: 'Fifty K Furnace', icon: '🌋', category: 'Calories',
    desc: 'Burn 50,000 total calories.',
    check: (s) => s.totalCalories >= 50000,
  },
  {
    id: 'cal_100k', name: '100K Inferno', icon: '☄️', category: 'Calories',
    desc: 'Burn 100,000 total calories.',
    check: (s) => s.totalCalories >= 100000,
  },
  {
    id: 'cal_250k', name: 'Quarter Million', icon: '🌞', category: 'Calories',
    desc: 'Burn 250,000 total calories.',
    check: (s) => s.totalCalories >= 250000,
  },

  // ── DISTANCE ─────────────────────────────────────────────
  {
    id: 'five_miles', name: 'Around the Block', icon: '🚶', category: 'Distance',
    desc: 'Run/walk 5 cumulative miles.',
    check: (s) => s.totalMiles >= 5,
  },
  {
    id: 'half_marathon', name: 'Half There', icon: '🏅', category: 'Distance',
    desc: 'Log 13.1 cumulative miles.',
    check: (s) => s.totalMiles >= 13.1,
  },
  {
    id: 'marathon', name: 'Marathon Total', icon: '🎽', category: 'Distance',
    desc: 'Log 26.2 cumulative miles.',
    check: (s) => s.totalMiles >= 26.2,
  },
  {
    id: 'fifty_miles', name: 'Ultrarunner', icon: '🦅', category: 'Distance',
    desc: 'Log 50 cumulative miles.',
    check: (s) => s.totalMiles >= 50,
  },
  {
    id: 'century_miles', name: 'Century Rider', icon: '🚴', category: 'Distance',
    desc: 'Log 100 cumulative miles.',
    check: (s) => s.totalMiles >= 100,
  },
  {
    id: 'five_hundred_miles', name: 'Road Warrior', icon: '🛣️', category: 'Distance',
    desc: 'Log 500 cumulative miles.',
    check: (s) => s.totalMiles >= 500,
  },

  // ── STRENGTH ─────────────────────────────────────────────
  {
    id: 'iron', name: 'Iron Lifter', icon: '🏋️', category: 'Strength',
    desc: 'Log 10 strength workouts.',
    check: (s) => s.strengthWorkouts >= 10,
  },
  {
    id: 'iron_25', name: 'Iron Regular', icon: '💪', category: 'Strength',
    desc: 'Log 25 strength workouts.',
    check: (s) => s.strengthWorkouts >= 25,
  },
  {
    id: 'iron_50', name: 'Iron Veteran', icon: '🦾', category: 'Strength',
    desc: 'Log 50 strength workouts.',
    check: (s) => s.strengthWorkouts >= 50,
  },

  // ── CARDIO ───────────────────────────────────────────────
  {
    id: 'cardio_ten', name: 'Heart Starter', icon: '❤️', category: 'Cardio',
    desc: 'Log 10 cardio workouts.',
    check: (s) => s.cardioWorkouts >= 10,
  },
  {
    id: 'cardio_king', name: 'Cardio King', icon: '👑', category: 'Cardio',
    desc: 'Log 25 cardio workouts.',
    check: (s) => s.cardioWorkouts >= 25,
  },
  {
    id: 'cardio_fifty', name: 'Cardio Machine', icon: '🤖', category: 'Cardio',
    desc: 'Log 50 cardio workouts.',
    check: (s) => s.cardioWorkouts >= 50,
  },

  // ── GOALS ────────────────────────────────────────────────
  {
    id: 'goal_hit', name: 'Goal Crusher', icon: '🎯', category: 'Goals',
    desc: 'Hit your daily calorie burn goal for the first time.',
    check: (s) => s.daysAtGoal >= 1,
  },
  {
    id: 'goal_five', name: 'High Five', icon: '🖐️', category: 'Goals',
    desc: 'Hit your daily goal 5 times.',
    check: (s) => s.daysAtGoal >= 5,
  },
  {
    id: 'goal_ten', name: 'Consistent', icon: '✅', category: 'Goals',
    desc: 'Hit your daily goal 10 times.',
    check: (s) => s.daysAtGoal >= 10,
  },
  {
    id: 'goal_thirty', name: 'Unstoppable', icon: '🛡️', category: 'Goals',
    desc: 'Hit your daily goal 30 times.',
    check: (s) => s.daysAtGoal >= 30,
  },

  // ── WEIGHT LOSS ──────────────────────────────────────────
  {
    id: 'first_pound', name: 'First Pound', icon: '📉', category: 'Weight',
    desc: 'Lose your first pound.',
    check: (s) => s.poundsLost >= 1,
  },
  {
    id: 'five_pounds', name: 'Five Down', icon: '✌️', category: 'Weight',
    desc: 'Lose 5 pounds total.',
    check: (s) => s.poundsLost >= 5,
  },
  {
    id: 'ten_pounds', name: '10 Down', icon: '🎉', category: 'Weight',
    desc: 'Lose 10 pounds total.',
    check: (s) => s.poundsLost >= 10,
  },
  {
    id: 'twenty_pounds', name: 'Twenty Strong', icon: '🏔️', category: 'Weight',
    desc: 'Lose 20 pounds total.',
    check: (s) => s.poundsLost >= 20,
  },
  {
    id: 'fifty_pounds', name: 'Transformation', icon: '🦋', category: 'Weight',
    desc: 'Lose 50 pounds total.',
    check: (s) => s.poundsLost >= 50,
  },

  // ── SUPPLEMENTS & TRT ────────────────────────────────────
  {
    id: 'supp_seven', name: 'Week of Wins', icon: '📅', category: 'Protocol',
    desc: 'Log supplements 7 days in a row.',
    check: (s) => s.longestSuppStreak >= 7,
  },
  {
    id: 'supp_thirty', name: 'Protocol Master', icon: '🧬', category: 'Protocol',
    desc: 'Log supplements 30 days in a row.',
    check: (s) => s.longestSuppStreak >= 30,
  },
  {
    id: 'trt_month', name: 'On Schedule', icon: '🗓️', category: 'Protocol',
    desc: 'Log 4 TRT injections (1 month on protocol).',
    check: (s) => s.totalTrtLogs >= 4,
  },
  {
    id: 'trt_quarter', name: 'TRT Veteran', icon: '⚕️', category: 'Protocol',
    desc: 'Log 13 TRT injections (3 months on protocol).',
    check: (s) => s.totalTrtLogs >= 13,
  },
  {
    id: 'trt_halfyear', name: 'TRT Master', icon: '6️⃣', category: 'Protocol',
    desc: 'Log 26 TRT injections (6 months on protocol).',
    check: (s) => s.totalTrtLogs >= 26,
  },
  {
    id: 'trt_year', name: 'TRT Legend', icon: '🏅', category: 'Protocol',
    desc: 'Log 52 TRT injections (1 year on protocol).',
    check: (s) => s.totalTrtLogs >= 52,
  },
  

  // ── TIME ─────────────────────────────────────────────────
  {
    id: 'hour_workout', name: 'Full Hour', icon: '⏰', category: 'Time',
    desc: 'Log a single workout of 60+ minutes.',
    check: (s) => s.longestSingleWorkout >= 60,
  },
  {
    id: 'ninety_min', name: 'Hour and a Half', icon: '⌛', category: 'Time',
    desc: 'Log a single workout of 90+ minutes.',
    check: (s) => s.longestSingleWorkout >= 90,
  },
  {
    id: 'hundred_hours', name: '100 Hours In', icon: '🕰️', category: 'Time',
    desc: 'Log 6,000 total minutes (100 hours).',
    check: (s) => s.totalMinutes >= 6000,
  },

  // ── MYSTERY BADGES ───────────────────────────────────────
  {
    id: 'mystery_early_bird', name: '???', icon: '❓', category: 'Mystery',
    mystery: true, mysteryHint: 'Some people are morning people...',
    revealName: 'Early Bird', revealIcon: '🌅', revealDesc: 'Log a workout before 7am.',
    desc: 'Secret badge. Keep grinding.',
    check: (s) => s.hasEarlyWorkout,
  },
  {
    id: 'mystery_night_owl', name: '???', icon: '❓', category: 'Mystery',
    mystery: true, mysteryHint: 'Night shifts count.',
    revealName: 'Night Owl', revealIcon: '🦉', revealDesc: 'Log a workout after 9pm.',
    desc: 'Secret badge. Keep grinding.',
    check: (s) => s.hasLateWorkout,
  },
  {
    id: 'mystery_weekend_warrior', name: '???', icon: '❓', category: 'Mystery',
    mystery: true, mysteryHint: 'The weekend has something to do with it...',
    revealName: 'Weekend Warrior', revealIcon: '⚔️', revealDesc: 'Work out both Sat and Sun in the same weekend.',
    desc: 'Secret badge. Keep grinding.',
    check: (s) => s.hasWeekendDouble,
  },
  {
    id: 'mystery_monday', name: '???', icon: '❓', category: 'Mystery',
    mystery: true, mysteryHint: 'The most skipped day of the week...',
    revealName: 'No Excuses Monday', revealIcon: '📆', revealDesc: 'Work out on 10 Mondays.',
    desc: 'Secret badge. Keep grinding.',
    check: (s) => s.mondayWorkouts >= 10,
  },
  {
    id: 'mystery_comeback', name: '???', icon: '❓', category: 'Mystery',
    mystery: true, mysteryHint: 'Sometimes life happens.',
    revealName: 'Comeback Kid', revealIcon: '🔄', revealDesc: 'Come back and work out after a 14+ day gap.',
    desc: 'Secret badge. Keep grinding.',
    check: (s) => s.hasComebackAfterGap,
  },
  {
    id: 'mystery_double', name: '???', icon: '❓', category: 'Mystery',
    mystery: true, mysteryHint: 'More is sometimes more.',
    revealName: 'Double Session', revealIcon: '✌️', revealDesc: 'Log 2 workouts in one day.',
    desc: 'Secret badge. Keep grinding.',
    check: (s) => s.hasDoubleDay,
  },
  {
    id: 'mystery_balance', name: '???', icon: '❓', category: 'Mystery',
    mystery: true, mysteryHint: 'Variety is the spice of life.',
    revealName: 'Balanced', revealIcon: '⚖️', revealDesc: 'Log both cardio and strength in the same week.',
    desc: 'Secret badge. Keep grinding.',
    check: (s) => s.hasBalancedWeek,
  },
  {
    id: 'mystery_big_burn', name: '???', icon: '❓', category: 'Mystery',
    mystery: true, mysteryHint: 'One legendary session...',
    revealName: 'Inferno', revealIcon: '🌋', revealDesc: 'Burn 800+ calories in a single workout.',
    desc: 'Secret badge. Keep grinding.',
    check: (s) => s.maxSingleCalories >= 800,
  },
  {
    id: 'mystery_consistency', name: '???', icon: '❓', category: 'Mystery',
    mystery: true, mysteryHint: 'Robots are more consistent than humans.',
    revealName: 'The Machine', revealIcon: '🤖', revealDesc: 'Work out at least once every week for 12 straight weeks.',
    desc: 'Secret badge. Keep grinding.',
    check: (s) => s.longestWeeklyStreak >= 12,
  },
  {
    id: 'mystery_vitamin_d', name: '???', icon: '❓', category: 'Mystery',
    mystery: true, mysteryHint: 'Deficiency is the enemy.',
    revealName: 'D-fense', revealIcon: '☀️', revealDesc: 'Log Vitamin D3 for 30 days.',
    desc: 'Secret badge. Keep grinding.',
    check: (s) => s.vitaminDLogs >= 30,
  },
  {
    id: 'mystery_sleep_stack', name: '???', icon: '❓', category: 'Mystery',
    mystery: true, mysteryHint: "Recovery happens when you're not awake.",
    revealName: 'Recovery Protocol', revealIcon: '🌙', revealDesc: 'Log magnesium 20 nights in a row.',
    desc: 'Secret badge. Keep grinding.',
    check: (s) => s.longestMagnesiumStreak >= 20,
  },
  {
    id: 'mystery_grind', name: '???', icon: '❓', category: 'Mystery',
    mystery: true, mysteryHint: "Show up even when you don't feel like it.",
    revealName: 'The Grind', revealIcon: '⚙️', revealDesc: 'Log a workout under 200 calories burned (short session still counts).',
    desc: 'Secret badge. Keep grinding.',
    check: (s) => s.hasLowCalDay,
  },
];

// ============================================================
// COMPUTE STATS — called on every badge evaluation
// ============================================================
export const computeStats = (workouts, weights, supplements, trtLogs, dailyGoal) => {
  const safeArr = (a) => Array.isArray(a) ? a : [];
  const ws = safeArr(workouts);
  const wts = safeArr(weights);
  const supps = safeArr(supplements);
  const trts = safeArr(trtLogs);

  const totalWorkouts = ws.length;
  const totalCalories = ws.reduce((s, w) => s + (Number(w.calories) || 0), 0);
  const totalMiles = ws.reduce((s, w) => s + (Number(w.miles) || 0), 0);
  const totalMinutes = ws.reduce((s, w) => s + (Number(w.minutes) || 0), 0);
  const cardioWorkouts = ws.filter((w) => w.type === 'cardio').length;
  const strengthWorkouts = ws.filter((w) => w.type === 'strength').length;
  const maxSingleCalories = ws.length ? Math.max(...ws.map((w) => Number(w.calories) || 0)) : 0;
  const longestSingleWorkout = ws.length ? Math.max(...ws.map((w) => Number(w.minutes) || 0)) : 0;

  // Days at goal
  const byDay = {};
  ws.forEach((w) => { byDay[w.date] = (byDay[w.date] || 0) + (Number(w.calories) || 0); });
  const daysAtGoal = Object.values(byDay).filter((c) => c >= (dailyGoal || 300)).length;

  // Double day
  const workoutsPerDay = {};
  ws.forEach((w) => { workoutsPerDay[w.date] = (workoutsPerDay[w.date] || 0) + 1; });
  const hasDoubleDay = Object.values(workoutsPerDay).some((c) => c >= 2);
  const hasLowCalDay = ws.some((w) => Number(w.calories) > 0 && Number(w.calories) < 200);

  // Daily streak
  const dates = [...new Set(ws.map((w) => w.date))].sort();
  let longestStreak = 0, run = 0, prev = null;
  for (const d of dates) {
    if (prev === null) { run = 1; }
    else {
      const dd = Math.round((new Date(d + 'T00:00:00') - new Date(prev + 'T00:00:00')) / 86400000);
      run = dd === 1 ? run + 1 : 1;
    }
    if (run > longestStreak) longestStreak = run;
    prev = d;
  }

  // Weekly streak
  const getWeekStart = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(new Date(d).setDate(diff)).toISOString().slice(0, 10);
  };
  const weekSet = new Set(ws.map((w) => getWeekStart(w.date)));
  const weeks = [...weekSet].sort();
  let longestWeeklyStreak = 0, wRun = 0, wPrev = null;
  for (const w of weeks) {
    if (wPrev === null) { wRun = 1; }
    else {
      const d1 = new Date(wPrev + 'T00:00:00'), d2 = new Date(w + 'T00:00:00');
      const wDiff = Math.round((d2 - d1) / (86400000 * 7));
      wRun = wDiff === 1 ? wRun + 1 : 1;
    }
    if (wRun > longestWeeklyStreak) longestWeeklyStreak = wRun;
    wPrev = w;
  }

  // Comeback after gap
  let hasComebackAfterGap = false;
  for (let i = 1; i < dates.length; i++) {
    const gap = Math.round((new Date(dates[i] + 'T00:00:00') - new Date(dates[i - 1] + 'T00:00:00')) / 86400000);
    if (gap >= 14) { hasComebackAfterGap = true; break; }
  }

  const mondayWorkouts = ws.filter((w) => new Date(w.date + 'T00:00:00').getDay() === 1).length;

  // Weekend double
  const bySunday = {};
  ws.forEach((w) => {
    const d = new Date(w.date + 'T00:00:00'), day = d.getDay();
    if (day === 0 || day === 6) {
      const wk = getWeekStart(w.date);
      if (!bySunday[wk]) bySunday[wk] = new Set();
      bySunday[wk].add(day);
    }
  });
  const hasWeekendDouble = Object.values(bySunday).some((s) => s.has(6) && s.has(0));

  // Balanced week
  const byWeekTypes = {};
  ws.forEach((w) => {
    const wk = getWeekStart(w.date);
    if (!byWeekTypes[wk]) byWeekTypes[wk] = new Set();
    byWeekTypes[wk].add(w.type);
  });
  const hasBalancedWeek = Object.values(byWeekTypes).some((s) => s.has('cardio') && s.has('strength'));

  // Time of day
  const hasEarlyWorkout = ws.some((w) => w.createdAt && new Date(w.createdAt).getHours() < 7);
  const hasLateWorkout = ws.some((w) => w.createdAt && new Date(w.createdAt).getHours() >= 21);

  // Supplements
  const totalSupplementLogs = supps.length;
  const suppDates = [...new Set(supps.map((s) => s.date))].sort();
  let longestSuppStreak = 0, sRun = 0, sPrev = null;
  for (const d of suppDates) {
    if (sPrev === null) { sRun = 1; }
    else {
      const dd = Math.round((new Date(d + 'T00:00:00') - new Date(sPrev + 'T00:00:00')) / 86400000);
      sRun = dd === 1 ? sRun + 1 : 1;
    }
    if (sRun > longestSuppStreak) longestSuppStreak = sRun;
    sPrev = d;
  }
  const vitaminDLogs = supps.filter((s) => (s.name || '').toLowerCase().includes('vitamin d')).length;
  const magDates = [...new Set(supps.filter((s) => (s.name || '').toLowerCase().includes('magnesium')).map((s) => s.date))].sort();
  let longestMagnesiumStreak = 0, mRun = 0, mPrev = null;
  for (const d of magDates) {
    if (mPrev === null) { mRun = 1; }
    else {
      const dd = Math.round((new Date(d + 'T00:00:00') - new Date(mPrev + 'T00:00:00')) / 86400000);
      mRun = dd === 1 ? mRun + 1 : 1;
    }
    if (mRun > longestMagnesiumStreak) longestMagnesiumStreak = mRun;
    mPrev = d;
  }

  const totalTrtLogs = trts.length;
  const weightEntries = wts.length;
  const sortedW = [...wts].sort((a, b) => a.date.localeCompare(b.date));
  const poundsLost = sortedW.length >= 2
    ? Math.max(0, Number(sortedW[0].weight) - Number(sortedW[sortedW.length - 1].weight))
    : 0;

  return {
    totalWorkouts, totalCalories, totalMiles, totalMinutes,
    cardioWorkouts, strengthWorkouts, maxSingleCalories, longestSingleWorkout,
    daysAtGoal, longestStreak, longestWeeklyStreak, weightEntries, poundsLost,
    hasDoubleDay, hasLowCalDay, hasComebackAfterGap, mondayWorkouts,
    hasWeekendDouble, hasBalancedWeek, hasEarlyWorkout, hasLateWorkout,
    totalSupplementLogs, longestSuppStreak, vitaminDLogs, longestMagnesiumStreak,
    totalTrtLogs,
  };
};
