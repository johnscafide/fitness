// Mifflin-St Jeor BMR formula (most accurate for overweight individuals)
// Returns BMR in kcal/day
export const calcBMR = (profile) => {
  const { weight, heightFt, heightIn, age, sex } = profile;
  if (!weight || !heightFt || !age) return null;

  const totalInches = (Number(heightFt) * 12) + Number(heightIn || 0);
  const heightCm = totalInches * 2.54;
  const weightKg = Number(weight) * 0.453592;

  if (sex === 'male') {
    return Math.round((10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5);
  } else {
    return Math.round((10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161);
  }
};

// Activity multipliers (TDEE)
export const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', sub: 'Desk job, little/no exercise', multiplier: 1.2 },
  { id: 'light', label: 'Lightly Active', sub: '1-3 workouts/week', multiplier: 1.375 },
  { id: 'moderate', label: 'Moderately Active', sub: '3-5 workouts/week', multiplier: 1.55 },
  { id: 'active', label: 'Very Active', sub: '6-7 workouts/week', multiplier: 1.725 },
  { id: 'athlete', label: 'Athlete', sub: '2x/day training', multiplier: 1.9 },
];

export const calcTDEE = (bmr, activityLevel) => {
  const level = ACTIVITY_LEVELS.find((l) => l.id === activityLevel) || ACTIVITY_LEVELS[1];
  return Math.round(bmr * level.multiplier);
};

// Recommended intake for fat loss without muscle loss
// Standard: 500 cal/day deficit = ~1 lb/week loss
// Aggressive: 750 cal/day = ~1.5 lb/week
// Very aggressive: 1000 cal/day = ~2 lbs/week (not recommended long-term)
export const calcIntakeGoals = (tdee) => {
  return {
    maintenance: tdee,
    mild: tdee - 250,       // 0.5 lb/week
    moderate: tdee - 500,   // 1 lb/week (sweet spot)
    aggressive: tdee - 750, // 1.5 lbs/week
    veryAggressive: tdee - 1000, // 2 lbs/week
  };
};

// Macro split recommendations (protein priority for body recomposition)
// Based on current weight in lbs
export const calcMacros = (calories, weightLbs) => {
  const protein = Math.round(weightLbs * 0.7); // 0.7g per lb bodyweight (conservative but evidence-based)
  const proteinCals = protein * 4;
  const fatCals = Math.round(calories * 0.30);
  const fat = Math.round(fatCals / 9);
  const carbCals = Math.max(0, calories - proteinCals - fatCals);
  const carbs = Math.round(carbCals / 4);
  return { protein, fat, carbs, proteinCals, fatCals, carbCals };
};

// BMI
export const calcBMI = (weightLbs, heightFt, heightIn) => {
  const totalInches = (Number(heightFt) * 12) + Number(heightIn || 0);
  if (!totalInches) return null;
  return ((Number(weightLbs) / (totalInches * totalInches)) * 703).toFixed(1);
};

export const bmiCategory = (bmi) => {
  if (bmi < 18.5) return { label: 'Underweight', color: 'var(--info)' };
  if (bmi < 25) return { label: 'Normal', color: 'var(--accent)' };
  if (bmi < 30) return { label: 'Overweight', color: 'var(--warn)' };
  return { label: 'Obese', color: 'var(--danger)' };
};

// IBW (Ideal Body Weight) — Hamwi method
export const calcIBW = (heightFt, heightIn, sex) => {
  const totalInches = (Number(heightFt) * 12) + Number(heightIn || 0);
  const base = sex === 'male' ? 106 : 100;
  const extra = Math.max(0, totalInches - 60) * (sex === 'male' ? 6 : 5);
  return base + extra;
};

// Days to goal at a given daily calorie deficit through exercise
export const daysToGoal = (lbsToLose, dailyCalBurn) => {
  if (!dailyCalBurn || !lbsToLose) return null;
  return Math.ceil((lbsToLose * 3500) / dailyCalBurn);
};
