import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Trash2, Download } from 'lucide-react';
import { uid, todayISO, fmtDate, fmtNum, toCSV, downloadFile } from '../storage';

export default function WeightTracker({ weights, setWeights, syncWeight, deleteWeight, profile, challenge, showToast }) {
  const [date, setDate]     = useState(todayISO());
  const [weight, setWeight] = useState('');
  const [waist, setWaist]   = useState('');
  const [notes, setNotes]   = useState('');

  const save = () => {
    if (!weight) { showToast('Enter a weight'); return; }
    const exists = weights.find((w) => w.date === date);
    let next;
    if (exists) {
      if (!confirm('Already have a weight for this date. Replace it?')) return;
      const updated = { ...exists, weight: Number(weight), waist: Number(waist) || null, notes };
      next = weights.map((w) => w.date === date ? updated : w);
      syncWeight(updated);
    } else {
      const entry = { id: uid(), date, weight: Number(weight), waist: Number(waist) || null, notes };
      next = [...weights, entry];
      syncWeight(entry);
    }
    setWeights(next);
    setWeight(''); setWaist(''); setNotes('');
    showToast('Weight saved');
  };

  const remove = (id) => {
    if (!confirm('Delete this entry?')) return;
    setWeights(weights.filter((w) => w.id !== id));
    deleteWeight(id);
  };

  const sorted = useMemo(() => [...weights].sort((a, b) => a.date.localeCompare(b.date)), [weights]);

  const chartData = sorted.map((w) => ({
    short: new Date(w.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
    weight: Number(w.weight),
  }));

  const stats = useMemo(() => {
    if (!sorted.length) return null;
    const first = Number(sorted[0].weight);
    const last  = Number(sorted[sorted.length - 1].weight);
    const min   = Math.min(...sorted.map((w) => Number(w.weight)));
    const max   = Math.max(...sorted.map((w) => Number(w.weight)));
    return { first, last, min, max, change: last - first };
  }, [sorted]);

  const exportCSV = () => {
    const headers = [
      { key: 'date', label: 'Date' }, { key: 'weight', label: 'Weight (lbs)' },
      { key: 'waist', label: 'Waist (in)' }, { key: 'notes', label: 'Notes' },
    ];
    downloadFile(`weights-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(sorted, headers));
    showToast('CSV exported');
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">WEIG<span>HT</span></div>
          <div className="page-sub">// Track your progress over time</div>
        </div>
        {weights.length > 0 && (
          <button className="btn secondary" onClick={exportCSV}><Download size={14} /> Export</button>
        )}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-title">Log Weight</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Weight (lbs)</label>
              <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.0" />
            </div>
            <div className="form-group">
              <label>Waist (in, optional)</label>
              <input type="number" step="0.1" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="0.0" />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="How are you feeling?" />
          </div>
          <button className="btn" onClick={save} style={{ marginTop: 16 }}>Save Weight</button>
        </div>

        <div className="card">
          <div className="section-title">Summary</div>
          {stats ? (
            <div className="grid grid-2" style={{ gap: 12 }}>
              <div className="stat-card">
                <div className="stat-label">Current</div>
                <div><span className="stat-value">{fmtNum(stats.last, 1)}</span><span className="stat-unit">lbs</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Change</div>
                <div>
                  <span className={`stat-value ${stats.change < 0 ? 'accent' : 'danger'}`}>
                    {stats.change > 0 ? '+' : ''}{fmtNum(stats.change, 1)}
                  </span>
                  <span className="stat-unit">lbs</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Highest</div>
                <div><span className="stat-value">{fmtNum(stats.max, 1)}</span><span className="stat-unit">lbs</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Lowest</div>
                <div><span className="stat-value">{fmtNum(stats.min, 1)}</span><span className="stat-unit">lbs</span></div>
              </div>
            </div>
          ) : <div className="empty">Log your first weight to see stats</div>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">Trend</div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#262626" vertical={false} />
              <XAxis dataKey="short" stroke="#6b6b6b" fontSize={10} />
              <YAxis stroke="#6b6b6b" fontSize={10} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip contentStyle={{ background: '#131313', border: '1px solid #333', fontSize: 12 }} />
              {challenge.goalWeight && (
                <ReferenceLine y={challenge.goalWeight} stroke="#c6ff3d" strokeDasharray="3 3"
                  label={{ value: `Goal: ${challenge.goalWeight}`, position: 'right', fill: '#c6ff3d', fontSize: 10 }} />
              )}
              <Line type="monotone" dataKey="weight" stroke="#4d9fff" strokeWidth={2} dot={{ r: 4, fill: '#4d9fff' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="empty">Add a weight entry to see your trend</div>}
      </div>

      {weights.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Weight</th><th>Waist</th><th>Notes</th><th></th></tr>
            </thead>
            <tbody>
              {[...weights].sort((a, b) => b.date.localeCompare(a.date)).map((w) => (
                <tr key={w.id}>
                  <td>{fmtDate(w.date)}</td>
                  <td>{fmtNum(w.weight, 1)} lbs</td>
                  <td>{w.waist ? fmtNum(w.waist, 1) + ' in' : '—'}</td>
                  <td style={{ color: 'var(--text-dim)', fontSize: 11 }}>{w.notes || '—'}</td>
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
