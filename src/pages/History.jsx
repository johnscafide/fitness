import { useState, useMemo } from 'react';
import { Trash2, Search, Download } from 'lucide-react';
import { fmtDate, fmtNum, toCSV, downloadFile, fmtPace } from '../storage';

export default function History({ workouts, setWorkouts, showToast }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return workouts
      .filter((w) => filter === 'all' ? true : w.type === filter)
      .filter((w) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          (w.equipment || '').toLowerCase().includes(q) ||
          (w.notes || '').toLowerCase().includes(q) ||
          (w.exercises || []).some((e) => (e.name || '').toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [workouts, filter, search]);

  const remove = (id) => {
    if (!confirm('Delete this workout?')) return;
    setWorkouts(workouts.filter((w) => w.id !== id));
    showToast('Deleted');
  };

  const exportCSV = () => {
    const rows = filtered.map((w) => ({
      date: w.date,
      type: w.type,
      equipment: w.equipment,
      calories: w.calories,
      minutes: w.minutes,
      miles: w.miles || '',
      avgHR: w.avgHR || '',
      maxHR: w.maxHR || '',
      exercises: (w.exercises || []).map((e) => `${e.name}: ${e.sets}x${e.reps}@${e.weight}lb`).join(' | '),
      notes: w.notes || '',
    }));
    const headers = [
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' },
      { key: 'equipment', label: 'Equipment' },
      { key: 'calories', label: 'Calories' },
      { key: 'minutes', label: 'Minutes' },
      { key: 'miles', label: 'Miles' },
      { key: 'avgHR', label: 'Avg HR' },
      { key: 'maxHR', label: 'Max HR' },
      { key: 'exercises', label: 'Exercises' },
      { key: 'notes', label: 'Notes' },
    ];
    downloadFile(`workouts-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows, headers));
    showToast('CSV exported');
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">HISTO<span>RY</span></div>
          <div className="page-sub">// {workouts.length} total workouts logged</div>
        </div>
        <button className="btn" onClick={exportCSV}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          className={`btn small ${filter === 'all' ? '' : 'secondary'}`}
          onClick={() => setFilter('all')}
        >All</button>
        <button
          className={`btn small ${filter === 'cardio' ? '' : 'secondary'}`}
          onClick={() => setFilter('cardio')}
        >Cardio</button>
        <button
          className={`btn small ${filter === 'strength' ? '' : 'secondary'}`}
          onClick={() => setFilter('strength')}
        >Strength</button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-2)',
          border: '1px solid var(--border-2)',
          padding: '0 12px',
          flex: 1,
          minWidth: 200,
        }}>
          <Search size={14} color="var(--text-mute)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search equipment, exercises, notes..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '10px 0',
              flex: 1,
              color: 'var(--text)',
              fontSize: 13,
            }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty">No workouts found</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Equipment</th>
                <th>Time</th>
                <th>Calories</th>
                <th>Miles</th>
                <th>Pace</th>
                <th>Avg HR</th>
                <th>Details</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <tr key={w.id}>
                  <td>{fmtDate(w.date)}</td>
                  <td>
                    <span className={`tag ${w.type}`}>{w.type}</span>
                  </td>
                  <td>{w.equipment}</td>
                  <td>{fmtNum(w.minutes)} min</td>
                  <td>{fmtNum(w.calories)}</td>
                  <td>{w.miles ? fmtNum(w.miles, 2) : '—'}</td>
                  <td>{w.type === 'cardio' && w.miles ? fmtPace(w.minutes, w.miles) : '—'}</td>
                  <td>{w.avgHR || '—'}</td>
                  <td style={{ maxWidth: 250, fontSize: 11, color: 'var(--text-dim)' }}>
                    {w.exercises && w.exercises.length > 0
                      ? w.exercises.map((e) => `${e.name} ${e.sets}×${e.reps}${e.weight ? `@${e.weight}` : ''}`).join(', ')
                      : w.notes || '—'}
                  </td>
                  <td>
                    <button className="icon-btn danger" onClick={() => remove(w.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
