import { useState, useMemo } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { uid, todayISO, fmtDate } from '../storage';

const DEFAULT_SUPPLEMENTS = [
  { name: 'Vitamin D3+K2', time: 'morning', dose: '5000 IU D3 / 100mcg K2', icon: '☀️' },
  { name: 'Magnesium Glycinate', time: 'night', dose: '400mg', icon: '🌙' },
];

export default function Supplements({ supplements, setSupplements, showToast }) {
  const [date, setDate] = useState(todayISO());
  const [selected, setSelected] = useState({});
  const [customName, setCustomName] = useState('');
  const [customDose, setCustomDose] = useState('');
  const [customTime, setCustomTime] = useState('morning');
  const [customNotes, setCustomNotes] = useState('');
  const [view, setView] = useState('log');

  const todayLogs = useMemo(() => supplements.filter((s) => s.date === date), [supplements, date]);

  const toggleDefault = (supp) => {
    setSelected((prev) => ({ ...prev, [supp.name]: !prev[supp.name] }));
  };

  const saveSelected = () => {
    const toAdd = DEFAULT_SUPPLEMENTS.filter((s) => selected[s.name] && !todayLogs.some((l) => l.name === s.name));
    if (!toAdd.length) { showToast('Nothing new to log'); return; }
    const newLogs = toAdd.map((s) => ({ id: uid(), date, name: s.name, dose: s.dose, time: s.time, notes: '', createdAt: new Date().toISOString() }));
    setSupplements([...supplements, ...newLogs]);
    setSelected({});
    showToast(`Logged ${newLogs.length} supplement${newLogs.length > 1 ? 's' : ''}`);
  };

  const saveCustom = () => {
    if (!customName.trim()) { showToast('Enter a supplement name'); return; }
    const entry = { id: uid(), date, name: customName.trim(), dose: customDose, time: customTime, notes: customNotes, createdAt: new Date().toISOString() };
    setSupplements([...supplements, entry]);
    setCustomName(''); setCustomDose(''); setCustomNotes('');
    showToast('Supplement logged');
  };

  const remove = (id) => {
    setSupplements(supplements.filter((s) => s.id !== id));
    showToast('Removed');
  };

  // Streak per supplement
  const streaks = useMemo(() => {
    const names = [...new Set(supplements.map((s) => s.name))];
    return names.map((name) => {
      const dates = [...new Set(supplements.filter((s) => s.name === name).map((s) => s.date))].sort().reverse();
      const today = todayISO();
      let streak = 0;
      if (dates[0] === today || (dates[0] && Math.round((new Date(today + 'T00:00:00') - new Date(dates[0] + 'T00:00:00')) / 86400000) <= 1)) {
        streak = 1;
        for (let i = 1; i < dates.length; i++) {
          const gap = Math.round((new Date(dates[i - 1] + 'T00:00:00') - new Date(dates[i] + 'T00:00:00')) / 86400000);
          if (gap === 1) streak++;
          else break;
        }
      }
      return { name, streak, total: supplements.filter((s) => s.name === name).length };
    });
  }, [supplements]);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">SUPPLE<span>MENTS</span></div>
          <div className="page-sub">// Daily stack tracking</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn small ${view === 'log' ? '' : 'secondary'}`} onClick={() => setView('log')}>Log</button>
          <button className={`btn small ${view === 'history' ? '' : 'secondary'}`} onClick={() => setView('history')}>History</button>
          <button className={`btn small ${view === 'stats' ? '' : 'secondary'}`} onClick={() => setView('stats')}>Streaks</button>
        </div>
      </div>

      {view === 'log' && (
        <>
          <div className="form-group" style={{ maxWidth: 220, marginBottom: 20 }}>
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-title">Your Stack</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {DEFAULT_SUPPLEMENTS.map((s) => {
                const logged = todayLogs.some((l) => l.name === s.name);
                const pending = selected[s.name];
                return (
                  <div
                    key={s.name}
                    onClick={() => !logged && toggleDefault(s)}
                    style={{
                      display: 'flex', gap: 14, alignItems: 'center',
                      padding: '12px 16px',
                      background: logged ? 'rgba(198,255,61,0.07)' : pending ? 'rgba(77,159,255,0.07)' : 'var(--bg)',
                      border: `1px solid ${logged ? 'rgba(198,255,61,0.4)' : pending ? 'rgba(77,159,255,0.4)' : 'var(--border)'}`,
                      cursor: logged ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>
                        {s.dose} · {s.time}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: logged ? 'var(--accent)' : pending ? 'var(--info)' : 'var(--text-mute)' }}>
                      {logged ? '✓ LOGGED' : pending ? '+ PENDING' : 'TAP TO ADD'}
                    </div>
                  </div>
                );
              })}
            </div>
            {Object.values(selected).some(Boolean) && (
              <button className="btn" onClick={saveSelected}>
                Log Selected Supplements
              </button>
            )}
          </div>

          <div className="card">
            <div className="section-title">Log Custom Supplement</div>
            <div className="form-grid">
              <div className="form-group">
                <label>Name</label>
                <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Fish Oil, Zinc, etc." />
              </div>
              <div className="form-group">
                <label>Dose (optional)</label>
                <input value={customDose} onChange={(e) => setCustomDose(e.target.value)} placeholder="1000mg" />
              </div>
              <div className="form-group">
                <label>Time</label>
                <select value={customTime} onChange={(e) => setCustomTime(e.target.value)}>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="night">Night</option>
                  <option value="pre-workout">Pre-Workout</option>
                  <option value="post-workout">Post-Workout</option>
                  <option value="with meal">With Meal</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 10 }}>
              <label>Notes (optional)</label>
              <input value={customNotes} onChange={(e) => setCustomNotes(e.target.value)} placeholder="With food, felt good, etc." />
            </div>
            <button className="btn" style={{ marginTop: 14 }} onClick={saveCustom}>
              <Plus size={14} /> Log Supplement
            </button>
          </div>
        </>
      )}

      {view === 'history' && (
        <div>
          {supplements.length === 0 ? (
            <div className="card"><div className="empty">No supplements logged yet</div></div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Supplement</th>
                    <th>Dose</th>
                    <th>Time</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {[...supplements].sort((a, b) => b.date.localeCompare(a.date)).map((s) => (
                    <tr key={s.id}>
                      <td>{fmtDate(s.date)}</td>
                      <td>{s.name}</td>
                      <td style={{ color: 'var(--text-dim)' }}>{s.dose || '—'}</td>
                      <td><span className="tag">{s.time}</span></td>
                      <td style={{ color: 'var(--text-dim)', fontSize: 11 }}>{s.notes || '—'}</td>
                      <td>
                        <button className="icon-btn danger" onClick={() => remove(s.id)}>
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
      )}

      {view === 'stats' && (
        <div className="grid grid-3">
          {streaks.map((s) => (
            <div key={s.name} className="card stat-card">
              <div className="stat-label">{s.name}</div>
              <div><span className="stat-value accent">{s.streak}</span><span className="stat-unit">day streak</span></div>
              <div className="stat-delta">{s.total} total logs</div>
            </div>
          ))}
          {streaks.length === 0 && <div className="card"><div className="empty">No supplement data yet</div></div>}
        </div>
      )}
    </div>
  );
}
