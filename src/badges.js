// Badge system
export const BADGES = [
  {
    id: 'first_workout',
    name: 'First Step',
    icon: '👟',
    desc: 'Log your first workout',
    check: (s) => s.totalWorkouts >= 1,
  },
  {
    id: 'week_streak',
    name: '7 Day Streak',
    icon: '🔥',
    desc: 'Work out 7 days in a row',
    check: (s) => s.longestStreak >= 7,
  },
  {
    id: 'two_week_streak',
    name: '14 Day Streak',
    icon: '🔥🔥',
    desc: 'Work out 14 days straight',
    check: (s) => s.longestStreak >= 14,
  },
  {
    id: 'month_streak',
    name: '30 Day Streak',
    icon: '💪',
    desc: 'Work out 30 days straight',
    check: (s) => s.longestStreak >= 30,
  },
  {
    id: 'ten_workouts',
    name: 'Double Digits',
    icon: '🔟',
    desc: 'Complete 10 workouts',
    check: (s) => s.totalWorkouts >= 10,
  },
  {
    id: 'fifty_workouts',
    name: 'Half Century',
    icon: '5️⃣0️⃣',
    desc: 'Complete 50 workouts',
    check: (s) => s.totalWorkouts >= 50,
  },
  {
    id: 'hundred_workouts',
    name: 'Centurion',
    icon: '💯',
    desc: 'Complete 100 workouts',
    check: (s) => s.totalWorkouts >= 100,
  },
  {
    id: 'cal_5k',
    name: '5K Burner',
    icon: '🔥',
    desc: 'Burn 5,000 total calories',
    check: (s) => s.totalCalories >= 5000,
  },
  {
    id: 'cal_25k',
    name: '25K Club',
    icon: '🚀',
    desc: 'Burn 25,000 total calories',
    check: (s) => s.totalCalories >= 25000,
  },
  {
    id: 'cal_100k',
    name: '100K Inferno',
    icon: '☄️',
    desc: 'Burn 100,000 total calories',
    check: (s) => s.totalCalories >= 100000,
  },
  {
    id: 'first_mile',
    name: 'First Mile',
    icon: '🏃',
    desc: 'Log your first mile',
    check: (s) => s.totalMiles >= 1,
  },
  {
    id: 'marathon',
    name: 'Marathon Total',
    icon: '🏅',
    desc: 'Run 26.2 cumulative miles',
    check: (s) => s.totalMiles >= 26.2,
  },
  {
    id: 'century_miles',
    name: 'Century',
    icon: '💯',
    desc: 'Run 100 cumulative miles',
    check: (s) => s.totalMiles >= 100,
  },
  {
    id: 'iron',
    name: 'Iron Lifter',
    icon: '🏋️',
    desc: 'Log 10 strength workouts',
    check: (s) => s.strengthWorkouts >= 10,
  },
  {
    id: 'cardio_king',
    name: 'Cardio King',
    icon: '👑',
    desc: 'Log 25 cardio workouts',
    check: (s) => s.cardioWorkouts >= 25,
  },
  {
    id: 'goal_hit',
    name: 'Goal Crusher',
    icon: '🎯',
    desc: 'Hit your daily calorie goal',
    check: (s) => s.daysAtGoal >= 1,
  },
  {
    id: 'goal_ten',
    name: 'Consistent',
    icon: '✅',
    desc: 'Hit daily goal 10 times',
    check: (s) => s.daysAtGoal >= 10,
  },
  {
    id: 'weight_logged',
    name: 'Weighing In',
    icon: '⚖️',
    desc: 'Log your first weight',
    check: (s) => s.weightEntries >= 1,
  },
  {
    id: 'first_pound',
    name: 'First Pound',
    icon: '📉',
    desc: 'Lose your first pound',
    check: (s) => s.poundsLost >= 1,
  },
  {
    id: 'ten_pounds',
    name: '10 Down',
    icon: '🎉',
    desc: 'Lose 10 pounds total',
    check: (s) => s.poundsLost >= 10,
  },
];

export const computeStats = (workouts, weights, dailyGoal) => {
  const totalWorkouts = workouts.length;
  const totalCalories = workouts.reduce((s, w) => s + (Number(w.calories) || 0), 0);
  const totalMiles = workouts.reduce((s, w) => s + (Number(w.miles) || 0), 0);
  const totalMinutes = workouts.reduce((s, w) => s + (Number(w.minutes) || 0), 0);
  const cardioWorkouts = workouts.filter((w) => w.type === 'cardio').length;
  const strengthWorkouts = workouts.filter((w) => w.type === 'strength').length;

  // Days at goal — group by date, sum calories, compare to daily goal
  const byDay = {};
  workouts.forEach((w) => {
    byDay[w.date] = (byDay[w.date] || 0) + (Number(w.calories) || 0);
  });
  const daysAtGoal = Object.values(byDay).filter((c) => c >= (dailyGoal || 300)).length;

  // Streak
  const dates = [...new Set(workouts.map((w) => w.date))].sort();
  let longestStreak = 0;
  let run = 0;
  let prev = null;
  for (const d of dates) {
    if (prev === null) {
      run = 1;
    } else {
      const dayDiff = Math.round(
        (new Date(d + 'T00:00:00') - new Date(prev + 'T00:00:00')) / 86400000
      );
      run = dayDiff === 1 ? run + 1 : 1;
    }
    if (run > longestStreak) longestStreak = run;
    prev = d;
  }

  const weightEntries = weights.length;
  const sortedW = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const poundsLost =
    sortedW.length >= 2
      ? Math.max(0, Number(sortedW[0].weight) - Number(sortedW[sortedW.length - 1].weight))
      : 0;

  return {
    totalWorkouts,
    totalCalories,
    totalMiles,
    totalMinutes,
    cardioWorkouts,
    strengthWorkouts,
    daysAtGoal,
    longestStreak,
    weightEntries,
    poundsLost,
  };
};
