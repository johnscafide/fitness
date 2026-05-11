import { useState, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { uid, todayISO, fmtDate } from '../storage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const INJECTION_SITES = ['Left Glute', 'Right Glute', 'Left Quad', 'Right Quad', 'Left Delt', 'Right Delt', 'Left VG', 'Right VG'];

export default function TRTTracker({ trtLogs, setTrtLogs, showToast }) {
  const [date, setDate] = useState(todayISO());
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState('mg');
  const [compound, setCompound] = useState('Testosterone Cypionate');
  const [site, setSite] = useState('Left Glute');
  const [notes, setNotes] = useState('');

  const save = () => {
    if (!dose) { showToast('Enter a dose'); return; }
    const entry = {
      id: uid(),
      date,
      dose: Number(dose),
      unit,
      compound,
      site,
      notes,
      createdAt: new Date().toISOString(),
    };
    setTrtLogs([...trtLogs, entry]);
    setDose(''); setNotes('');
    showToast('TRT injection logged');
  };

  const remove = (id) => {
    setTrtLogs(trtLogs.filter((t) => t.id !== id));
  };

  // Next injection estimate (every 7 days)
  const nextDate = useMemo(() => {
    if (!trtLogs.length) return null;
    const sorted = [...trtLogs].sort((a, b) => b.date.localeCompare(a.date));
    const last = new Date(sorted[0].date + 'T00:00:00');
    last.setDate(last.getDate() + 7);
    return last.toISOString().slice(0, 10);
  }, [trtLogs]);

  const daysUntilNext = useMemo(() => {
    if (!nextDate) return null;
    const today = new Date(todayISO() + 'T00:00:00');
    const next = new Date(nextDate + 'T00:00:00');
    return Math.round((next - today) / 86400000);
  }, [nextDate]);

  // Chart: doses over time
  const chartData = useMemo(() => {
    return [...trtLogs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) => ({
        date: t.date,
        short: new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        dose: t.dose,
      }));
  }, [trtLogs]);

  // Site rotation suggestions
  const lastSite = trtLogs.length ? [...trtLogs].sort((a, b) => b.date.localeCompare(a.date))[0].site : null;
  const suggestSite = () => {
    if (!lastSite) return INJECTION_SITES[0];
    const idx = INJECTION_SITES.indexOf(lastSite);
    return INJECTION_SITES[(idx + 1) % INJECTION_SITES.length];
  };

  const today = todayISO();
  const dayOfWeek = new Date().getDay();
  const isTrtDay = dayOfWeek === 4 || dayOfWeek === 3;
  const loggedToday = trtLogs.some((t) => t.date === today);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">TRT <span>TRACKER</span></div>
          <div className="page-sub">// Injection log & protocol management</div>
        </div>
      </div>

      {/* Status banner */}
      {isTrtDay && !loggedToday && (
        <div className="card" style={{
          marginBottom: 20,
          borderColor: 'var(--warn)',
          background: 'linear-gradient(135deg, var(--bg-2), rgba(255,176,32,0.07))',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 32 }}>💉</span>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: 'var(--warn)' }}>INJECTION DAY</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                Today is {dayOfWeek === 4 ? 'Thursday' : 'Wednesday'}. Don't forget your shot.
                {lastSite && ` Last site: ${lastSite}. Suggested: ${suggestSite()}.`}
              </div>
            </div>
          </div>
        </div>
      )}

      {loggedToday && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'var(--accent)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 28 }}>✅</span>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)' }}>
              Injection logged for today
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        {/* Log form */}
        <div className="card">
          <div className="section-title">Log Injection</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Compound</label>
              <select value={compound} onChange={(e) => setCompound(e.target.value)}>
                <option>Testosterone Cypionate</option>
                <option>Testosterone Enanthate</option>
                <option>Testosterone Propionate</option>
                <option>Testosterone Undecanoate</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Dose</label>
              <input type="number" step="0.01" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="100" />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="mg">mg</option>
                <option value="ml">ml (cc)</option>
                <option value="units">units</option>
              </select>
            </div>
            <div className="form-group">
              <label>Injection Site</label>
              <select value={site} onChange={(e) => setSite(e.target.value)}>
                {INJECTION_SITES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 10 }}>
            <label>Notes (how did it feel? pip? energy?)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Smooth injection, no PIP, felt great by day 3..." />
          </div>
          {lastSite && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)', marginTop: 10 }}>
              💡 Last site: {lastSite} → Suggested next: <strong style={{ color: 'var(--accent)' }}>{suggestSite()}</strong>
            </div>
          )}
          <button className="btn" style={{ marginTop: 14 }} onClick={save}>Log Injection</button>
        </div>

        {/* Stats */}
        <div className="card">
          <div className="section-title">Protocol Stats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="stat-card">
              <div className="stat-label">Total Injections Logged</div>
              <div><span className="stat-value accent">{trtLogs.length}</span></div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Next Estimated Shot</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, letterSpacing: 1, color: daysUntilNext === 0 ? 'var(--warn)' : 'var(--text)' }}>
                {nextDate ? fmtDate(nextDate) : '—'}
              </div>
              {daysUntilNext !== null && (
                <div className="stat-delta" style={{ color: daysUntilNext <= 1 ? 'var(--warn)' : 'var(--text-dim)' }}>
                  {daysUntilNext === 0 ? '⚡ Today' : daysUntilNext < 0 ? `${Math.abs(daysUntilNext)} day(s) overdue` : `In ${daysUntilNext} day(s)`}
                </div>
              )}
            </div>
            {trtLogs.length > 0 && (
              <div className="stat-card">
                <div className="stat-label">Last Dose</div>
                <div>
                  <span className="stat-value">{[...trtLogs].sort((a, b) => b.date.localeCompare(a.date))[0].dose}</span>
                  <span className="stat-unit"> {[...trtLogs].sort((a, b) => b.date.localeCompare(a.date))[0].unit}</span>
                </div>
                <div className="stat-delta">{[...trtLogs].sort((a, b) => b.date.localeCompare(a.date))[0].compound}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-title">Dose History</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#262626" vertical={false} />
              <XAxis dataKey="short" stroke="#6b6b6b" fontSize={10} />
              <YAxis stroke="#6b6b6b" fontSize={10} />
              <Tooltip contentStyle={{ background: '#131313', border: '1px solid #333', fontSize: 12 }} />
              <Line type="stepAfter" dataKey="dose" stroke="#ffb020" strokeWidth={2} dot={{ r: 4, fill: '#ffb020' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {trtLogs.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Compound</th>
                <th>Dose</th>
                <th>Site</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...trtLogs].sort((a, b) => b.date.localeCompare(a.date)).map((t) => (
                <tr key={t.id}>
                  <td>{fmtDate(t.date)}</td>
                  <td style={{ fontSize: 12 }}>{t.compound}</td>
                  <td style={{ color: 'var(--warn)', fontWeight: 700 }}>{t.dose} {t.unit}</td>
                  <td><span className="tag">{t.site}</span></td>
                  <td style={{ color: 'var(--text-dim)', fontSize: 11 }}>{t.notes || '—'}</td>
                  <td>
                    <button className="icon-btn danger" onClick={() => remove(t.id)}>
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
