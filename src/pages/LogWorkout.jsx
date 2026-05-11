import { useState } from 'react';
import { uid, todayISO } from '../storage';

const EQUIPMENT_CARDIO = [
  'Treadmill', 'Elliptical', 'Stationary Bike', 'Rowing Machine',
  'Stair Climber', 'Outdoor Run', 'Outdoor Walk', 'Outdoor Bike',
  'Swimming', 'Jump Rope', 'Other',
];

const EQUIPMENT_STRENGTH = [
  'Barbell', 'Dumbbells', 'Kettlebell', 'Machine', 'Cables',
  'Bodyweight', 'Resistance Bands', 'Smith Machine', 'Other',
];

export default function LogWorkout({ workouts, setWorkouts, showToast, setPage }) {
  const [type, setType] = useState('cardio');

  // Shared fields
  const [date, setDate] = useState(todayISO());
  const [equipment, setEquipment] = useState('Treadmill');
  const [calories, setCalories] = useState('');
  const [minutes, setMinutes] = useState('');
  const [avgHR, setAvgHR] = useState('');
  const [notes, setNotes] = useState('');

  // Cardio fields
  const [miles, setMiles] = useState('');
  const [maxHR, setMaxHR] = useState('');

  // Strength fields
  const [exercises, setExercises] = useState([
    { name: '', sets: '', reps: '', weight: '' },
  ]);

  const reset = () => {
    setCalories(''); setMinutes(''); setAvgHR(''); setMaxHR('');
    setMiles(''); setNotes('');
    setExercises([{ name: '', sets: '', reps: '', weight: '' }]);
  };

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: '', reps: '', weight: '' }]);
  };

  const updateExercise = (i, field, val) => {
    const next = [...exercises];
    next[i] = { ...next[i], [field]: val };
    setExercises(next);
  };

  const removeExercise = (i) => {
    setExercises(exercises.filter((_, idx) => idx !== i));
  };

  const save = () => {
    if (!calories && !minutes) {
      showToast('Need at least calories or minutes');
      return;
    }

    const base = {
      id: uid(),
      date,
      type,
      equipment,
      calories: Number(calories) || 0,
      minutes: Number(minutes) || 0,
      avgHR: Number(avgHR) || null,
      notes,
      createdAt: new Date().toISOString(),
    };

    let entry;
    if (type === 'cardio') {
      entry = {
        ...base,
        miles: Number(miles) || 0,
        maxHR: Number(maxHR) || null,
      };
    } else {
      const filteredEx = exercises.filter((e) => e.name.trim());
      entry = {
        ...base,
        exercises: filteredEx,
      };
    }

    setWorkouts([entry, ...workouts]);
    showToast('Workout saved');
    reset();
  };

  const equipList = type === 'cardio' ? EQUIPMENT_CARDIO : EQUIPMENT_STRENGTH;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">LOG <span>WORKOUT</span></div>
          <div className="page-sub">// Track what you did</div>
        </div>
      </div>

      {/* Type toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          className={`btn ${type === 'cardio' ? '' : 'secondary'}`}
          onClick={() => { setType('cardio'); setEquipment('Treadmill'); }}
        >
          Cardio
        </button>
        <button
          className={`btn ${type === 'strength' ? '' : 'secondary'}`}
          onClick={() => { setType('strength'); setEquipment('Barbell'); }}
        >
          Strength
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title">Workout Details</div>

        <div className="form-grid" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Equipment</label>
            <select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
              {equipList.map((eq) => <option key={eq}>{eq}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Calories Burned</label>
            <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="0" />
          </div>
          <div className="form-group">
            <label>Total Time (min)</label>
            <input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="0" />
          </div>

          {type === 'cardio' && (
            <>
              <div className="form-group">
                <label>Miles</label>
                <input type="number" step="0.01" value={miles} onChange={(e) => setMiles(e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Avg HR (bpm)</label>
                <input type="number" value={avgHR} onChange={(e) => setAvgHR(e.target.value)} placeholder="0" />
              </div>
              <div className="form-group">
                <label>Max HR (bpm)</label>
                <input type="number" value={maxHR} onChange={(e) => setMaxHR(e.target.value)} placeholder="0" />
              </div>
            </>
          )}

          {type === 'strength' && (
            <div className="form-group">
              <label>Avg HR (bpm)</label>
              <input type="number" value={avgHR} onChange={(e) => setAvgHR(e.target.value)} placeholder="0" />
            </div>
          )}
        </div>

        {type === 'strength' && (
          <>
            <div className="section-title" style={{ marginTop: 24 }}>Exercises</div>
            {exercises.map((ex, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                gap: 10,
                marginBottom: 10,
                alignItems: 'end'
              }}>
                <div className="form-group">
                  {i === 0 && <label>Exercise</label>}
                  <input
                    value={ex.name}
                    onChange={(e) => updateExercise(i, 'name', e.target.value)}
                    placeholder="Bench press"
                  />
                </div>
                <div className="form-group">
                  {i === 0 && <label>Sets</label>}
                  <input
                    type="number"
                    value={ex.sets}
                    onChange={(e) => updateExercise(i, 'sets', e.target.value)}
                    placeholder="3"
                  />
                </div>
                <div className="form-group">
                  {i === 0 && <label>Reps</label>}
                  <input
                    type="number"
                    value={ex.reps}
                    onChange={(e) => updateExercise(i, 'reps', e.target.value)}
                    placeholder="10"
                  />
                </div>
                <div className="form-group">
                  {i === 0 && <label>Weight (lb)</label>}
                  <input
                    type="number"
                    value={ex.weight}
                    onChange={(e) => updateExercise(i, 'weight', e.target.value)}
                    placeholder="135"
                  />
                </div>
                <button
                  className="icon-btn danger"
                  onClick={() => removeExercise(i)}
                  disabled={exercises.length === 1}
                  style={{ marginBottom: 0 }}
                >×</button>
              </div>
            ))}
            <button className="btn secondary small" onClick={addExercise}>+ Add Exercise</button>
          </>
        )}

        <div className="form-group" style={{ marginTop: 16 }}>
          <label>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Anything to remember?"
            rows={3}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn" onClick={save}>Save Workout</button>
          <button className="btn secondary" onClick={() => setPage('dashboard')}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
