import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Trash2, Plus } from 'lucide-react';
import { uid, fmtDate, storage } from '../storage';

// Standard lab markers for TRT patients with reference ranges
// ref: { low, high, unit, optimal?: { low, high } }
const PANEL_MARKERS = [
  // Testosterone
  { id: 'total_t',    name: 'Total Testosterone',    unit: 'ng/dL',  ref: { low: 300, high: 1000 }, optimal: { low: 600, high: 900 },  category: 'Testosterone' },
  { id: 'free_t',     name: 'Free Testosterone',     unit: 'pg/mL',  ref: { low: 8.7, high: 25.1 }, optimal: { low: 15, high: 25 },    category: 'Testosterone' },
  { id: 'shbg',       name: 'SHBG',                  unit: 'nmol/L', ref: { low: 10,  high: 57 },   optimal: { low: 20, high: 40 },   category: 'Testosterone' },
  { id: 'lh',         name: 'LH',                    unit: 'mIU/mL', ref: { low: 1.7, high: 8.6 },  category: 'Testosterone' },
  { id: 'fsh',        name: 'FSH',                   unit: 'mIU/mL', ref: { low: 1.5, high: 12.4 }, category: 'Testosterone' },
  // Estrogen
  { id: 'estradiol',  name: 'Estradiol (E2)',         unit: 'pg/mL',  ref: { low: 7.6, high: 42.6 }, optimal: { low: 20, high: 35 },  category: 'Estrogen' },
  // Blood / CBC
  { id: 'hematocrit', name: 'Hematocrit',             unit: '%',      ref: { low: 38.3, high: 48.6 }, optimal: { low: 40, high: 50 }, category: 'Blood' },
  { id: 'hemoglobin', name: 'Hemoglobin',             unit: 'g/dL',   ref: { low: 13.5, high: 17.5 }, category: 'Blood' },
  { id: 'rbc',        name: 'RBC',                   unit: 'M/µL',   ref: { low: 4.5,  high: 5.9 },  category: 'Blood' },
  // Metabolic
  { id: 'vitamin_d',  name: 'Vitamin D (25-OH)',      unit: 'ng/mL',  ref: { low: 30,  high: 100 },  optimal: { low: 60, high: 80 },  category: 'Vitamins' },
  { id: 'zinc',       name: 'Zinc',                  unit: 'µg/dL',  ref: { low: 60,  high: 120 },  category: 'Vitamins' },
  { id: 'magnesium',  name: 'Magnesium',             unit: 'mg/dL',  ref: { low: 1.7, high: 2.4 },  category: 'Vitamins' },
  // Prostate
  { id: 'psa',        name: 'PSA',                   unit: 'ng/mL',  ref: { low: 0,   high: 4.0 },  category: 'Prostate' },
  // Liver / Metabolic
  { id: 'alt',        name: 'ALT',                   unit: 'U/L',    ref: { low: 7,   high: 56 },   category: 'Metabolic' },
  { id: 'ast',        name: 'AST',                   unit: 'U/L',    ref: { low: 10,  high: 40 },   category: 'Metabolic' },
  { id: 'cholesterol',name: 'Total Cholesterol',     unit: 'mg/dL',  ref: { low: 0,   high: 200 },  category: 'Metabolic' },
  { id: 'hdl',        name: 'HDL',                   unit: 'mg/dL',  ref: { low: 40,  high: 999 },  category: 'Metabolic' },
  { id: 'ldl',        name: 'LDL',                   unit: 'mg/dL',  ref: { low: 0,   high: 100 },  category: 'Metabolic' },
  { id: 'glucose',    name: 'Fasting Glucose',       unit: 'mg/dL',  ref: { low: 70,  high: 99 },   category: 'Metabolic' },
  { id: 'tsh',        name: 'TSH',                   unit: 'mIU/L',  ref: { low: 0.4, high: 4.0 },  category: 'Thyroid' },
];

const CATEGORIES = [...new Set(PANEL_MARKERS.map((m) => m.category))];

const LAB_KEY = 'lab_results';
export const getLabResults  = ()   => storage.get(LAB_KEY, []);
export const saveLabResults = (r)  => storage.set(LAB_KEY, r);

const statusColor = (value, marker) => {
  if (!marker?.ref) return 'var(--text-dim)';
  const v = Number(value);
  if (v < marker.ref.low || v > marker.ref.high) return 'var(--danger)';
  if (marker.optimal) {
    if (v >= marker.optimal.low && v <= marker.optimal.high) return 'var(--accent)';
    return 'var(--warn)';
  }
  return 'var(--accent)';
};

const statusLabel = (value, marker) => {
  if (!marker?.ref) return '';
  const v = Number(value);
  if (v < marker.ref.low) return 'LOW';
  if (v > marker.ref.high) return 'HIGH';
  if (marker.optimal) {
    if (v >= marker.optimal.low && v <= marker.optimal.high) return 'OPTIMAL';
    return 'IN RANGE';
  }
  return 'NORMAL';
};

export default function LabResults({ showToast }) {
  const [results, setResults] = useState(() => getLabResults());
  const [view, setView]       = useState('panels');
  const [selectedMarker, setSelectedMarker] = useState(null);

  // Panel entry state
  const [panelDate, setPanelDate] = useState(new Date().toISOString().slice(0, 10));
  const [panelValues, setPanelValues] = useState({});
  const [panelNotes, setPanelNotes]   = useState('');
  const [activeCat, setActiveCat]     = useState('Testosterone');

  const updateVal = (id, val) => setPanelValues((prev) => ({ ...prev, [id]: val }));

  const savePanel = () => {
    const filled = Object.entries(panelValues).filter(([, v]) => v !== '' && v !== undefined);
    if (!filled.length) { showToast('Enter at least one value'); return; }
    const entries = filled.map(([markerId, value]) => ({
      id: uid(), date: panelDate, markerId, value: Number(value),
      notes: panelNotes, createdAt: new Date().toISOString(),
    }));
    const next = [...results, ...entries];
    setResults(next);
    saveLabResults(next);
    setPanelValues({}); setPanelNotes('');
    showToast(`Saved ${entries.length} lab values`);
  };

  const remove = (id) => {
    const next = results.filter((r) => r.id !== id);
    setResults(next);
    saveLabResults(next);
  };

  // Group results by marker for trending
  const byMarker = useMemo(() => {
    const map = {};
    results.forEach((r) => {
      if (!map[r.markerId]) map[r.markerId] = [];
      map[r.markerId].push(r);
    });
    Object.keys(map).forEach((k) => map[k].sort((a, b) => a.date.localeCompare(b.date)));
    return map;
  }, [results]);

  // Most recent value per marker
  const latestByMarker = useMemo(() => {
    const map = {};
    Object.entries(byMarker).forEach(([k, arr]) => { map[k] = arr[arr.length - 1]; });
    return map;
  }, [byMarker]);

  // Chart data for selected marker
  const chartData = selectedMarker
    ? (byMarker[selectedMarker] || []).map((r) => ({
        short: new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }),
        value: r.value,
      }))
    : [];
  const selMarkerDef = PANEL_MARKERS.find((m) => m.id === selectedMarker);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">LAB <span>RESULTS</span></div>
          <div className="page-sub">// Track your bloodwork over time</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['panels', 'trends', 'history'].map((v) => (
            <button key={v} className={`btn small ${view === v ? '' : 'secondary'}`} onClick={() => setView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── PANEL ENTRY ── */}
      {view === 'panels' && (
        <>
          {/* Latest snapshot */}
          {Object.keys(latestByMarker).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div className="section-title">Latest Values</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {PANEL_MARKERS.filter((m) => latestByMarker[m.id]).map((m) => {
                  const latest = latestByMarker[m.id];
                  const color  = statusColor(latest.value, m);
                  const label  = statusLabel(latest.value, m);
                  return (
                    <div key={m.id}
                      onClick={() => { setSelectedMarker(m.id); setView('trends'); }}
                      style={{
                        padding: '10px 14px', background: 'var(--bg-2)',
                        border: `1px solid ${color === 'var(--accent)' ? 'rgba(198,255,61,0.3)' : color === 'var(--danger)' ? 'rgba(255,68,68,0.4)' : 'rgba(255,176,32,0.3)'}`,
                        cursor: 'pointer', minWidth: 130,
                      }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginBottom: 4 }}>{m.name}</div>
                      <div style={{ fontFamily: 'var(--display)', fontSize: 24, color, lineHeight: 1 }}>
                        {latest.value}<span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginLeft: 3 }}>{m.unit}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 1, color, marginTop: 4 }}>{label}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-mute)', marginTop: 2 }}>{fmtDate(latest.date)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card">
            <div className="section-title">Log Lab Results</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              <div className="form-group" style={{ minWidth: 160 }}>
                <label>Lab Date</label>
                <input type="date" value={panelDate} onChange={(e) => setPanelDate(e.target.value)} />
              </div>
            </div>

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {CATEGORIES.map((cat) => (
                <button key={cat}
                  className={`btn small ${activeCat === cat ? '' : 'secondary'}`}
                  onClick={() => setActiveCat(cat)}
                >{cat}</button>
              ))}
            </div>

            <div className="form-grid">
              {PANEL_MARKERS.filter((m) => m.category === activeCat).map((m) => (
                <div key={m.id} className="form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{m.name}</span>
                    <span style={{ color: 'var(--text-mute)', fontWeight: 400 }}>{m.unit}</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={panelValues[m.id] || ''}
                    onChange={(e) => updateVal(m.id, e.target.value)}
                    placeholder={`${m.ref.low}–${m.ref.high}`}
                    style={{
                      borderColor: panelValues[m.id]
                        ? statusColor(panelValues[m.id], m)
                        : undefined,
                    }}
                  />
                  {panelValues[m.id] && (
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 1, marginTop: 3, color: statusColor(panelValues[m.id], m) }}>
                      {statusLabel(panelValues[m.id], m)}
                      {m.optimal && ` · optimal: ${m.optimal.low}–${m.optimal.high}`}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Notes (dose changes, symptoms, anything notable)</label>
              <textarea value={panelNotes} onChange={(e) => setPanelNotes(e.target.value)} rows={2} placeholder="e.g. Dr. Mathews adjusted dose to 120mg. E2 was trending high." />
            </div>

            <button className="btn" style={{ marginTop: 16 }} onClick={savePanel}>Save Results</button>
          </div>
        </>
      )}

      {/* ── TRENDS ── */}
      {view === 'trends' && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {PANEL_MARKERS.filter((m) => byMarker[m.id]?.length > 0).map((m) => (
              <button key={m.id}
                className={`btn small ${selectedMarker === m.id ? '' : 'secondary'}`}
                onClick={() => setSelectedMarker(m.id)}
              >{m.name}</button>
            ))}
          </div>

          {selectedMarker && chartData.length > 0 ? (
            <div className="card">
              <div className="section-title">{selMarkerDef?.name} Trend</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)', marginBottom: 16 }}>
                Reference range: {selMarkerDef?.ref.low}–{selMarkerDef?.ref.high} {selMarkerDef?.unit}
                {selMarkerDef?.optimal && ` · optimal: ${selMarkerDef.optimal.low}–${selMarkerDef.optimal.high}`}
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#262626" vertical={false} />
                  <XAxis dataKey="short" stroke="#6b6b6b" fontSize={10} />
                  <YAxis stroke="#6b6b6b" fontSize={10}
                    domain={[
                      (d) => Math.min(d, selMarkerDef?.ref.low * 0.9 || d * 0.9),
                      (d) => Math.max(d, selMarkerDef?.ref.high * 1.1 || d * 1.1),
                    ]}
                  />
                  <Tooltip contentStyle={{ background: '#131313', border: '1px solid #333', fontSize: 12 }}
                    formatter={(v) => [`${v} ${selMarkerDef?.unit}`, selMarkerDef?.name]} />
                  {selMarkerDef?.ref && (
                    <>
                      <ReferenceLine y={selMarkerDef.ref.low}  stroke="#ff4444" strokeDasharray="3 3" label={{ value: 'Low',  position: 'right', fill: '#ff4444', fontSize: 9 }} />
                      <ReferenceLine y={selMarkerDef.ref.high} stroke="#ff4444" strokeDasharray="3 3" label={{ value: 'High', position: 'right', fill: '#ff4444', fontSize: 9 }} />
                    </>
                  )}
                  {selMarkerDef?.optimal && (
                    <>
                      <ReferenceLine y={selMarkerDef.optimal.low}  stroke="#c6ff3d" strokeDasharray="2 4" label={{ value: 'Opt low',  position: 'right', fill: '#c6ff3d', fontSize: 9 }} />
                      <ReferenceLine y={selMarkerDef.optimal.high} stroke="#c6ff3d" strokeDasharray="2 4" label={{ value: 'Opt high', position: 'right', fill: '#c6ff3d', fontSize: 9 }} />
                    </>
                  )}
                  <Line type="monotone" dataKey="value" stroke="#4d9fff" strokeWidth={2} dot={{ r: 5, fill: '#4d9fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card"><div className="empty">Select a marker above to see its trend, or log some results first.</div></div>
          )}
        </>
      )}

      {/* ── HISTORY ── */}
      {view === 'history' && (
        results.length === 0 ? (
          <div className="card"><div className="empty">No lab results logged yet</div></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Marker</th><th>Value</th><th>Status</th><th>Notes</th><th></th></tr>
              </thead>
              <tbody>
                {[...results].sort((a, b) => b.date.localeCompare(a.date)).map((r) => {
                  const marker = PANEL_MARKERS.find((m) => m.id === r.markerId);
                  const color  = statusColor(r.value, marker);
                  const label  = statusLabel(r.value, marker);
                  return (
                    <tr key={r.id}>
                      <td>{fmtDate(r.date)}</td>
                      <td>{marker?.name || r.markerId}</td>
                      <td style={{ color, fontWeight: 700 }}>{r.value} {marker?.unit}</td>
                      <td><span style={{ fontFamily: 'var(--mono)', fontSize: 10, color, letterSpacing: 1 }}>{label}</span></td>
                      <td style={{ color: 'var(--text-dim)', fontSize: 11 }}>{r.notes || '—'}</td>
                      <td><button className="icon-btn danger" onClick={() => remove(r.id)}><Trash2 size={14} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
