import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fmtNum } from '../storage';

const PRESETS = [
  { label: 'This month vs last',  a: 'this_month',  b: 'last_month' },
  { label: 'Last 30 vs prior 30', a: 'last30',       b: 'prior30' },
  { label: 'Last 7 vs prior 7',   a: 'last7',        b: 'prior7' },
  { label: 'This year vs last',   a: 'this_year',    b: 'last_year' },
  { label: 'Custom',              a: 'custom',       b: 'custom' },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

const resolvePeriod = (preset, customA, customB) => {
  const today = new Date();
  const iso   = (d) => d.toISOString().slice(0, 10);
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  switch (preset) {
    case 'last7': {
      const end = today; const start = addDays(today, -6);
      const pEnd = addDays(today, -7); const pStart = addDays(today, -13);
      return { aStart: iso(start), aEnd: iso(end), bStart: iso(pStart), bEnd: iso(pEnd) };
    }
    case 'last30': {
      const end = today; const start = addDays(today, -29);
      const pEnd = addDays(today, -30); const pStart = addDays(today, -59);
      return { aStart: iso(start), aEnd: iso(end), bStart: iso(pStart), bEnd: iso(pEnd) };
    }
    case 'this_month': {
      const aStart = iso(new Date(today.getFullYear(), today.getMonth(), 1));
      const bEnd   = iso(new Date(today.getFullYear(), today.getMonth(), 0));
      const bStart = iso(new Date(today.getFullYear(), today.getMonth() - 1, 1));
      return { aStart, aEnd: iso(today), bStart, bEnd };
    }
    case 'last_month': {
      const bStart = iso(new Date(today.getFullYear(), today.getMonth() - 2, 1));
      const bEnd   = iso(new Date(today.getFullYear(), today.getMonth() - 1, 0));
      const aStart = iso(new Date(today.getFullYear(), today.getMonth() - 1, 1));
      const aEnd   = iso(new Date(today.getFullYear(), today.getMonth(), 0));
      return { aStart, aEnd, bStart, bEnd };
    }
    case 'this_year': {
      const aStart = `${today.getFullYear()}-01-01`;
      const bStart = `${today.getFullYear() - 1}-01-01`;
      const bEnd   = `${today.getFullYear() - 1}-12-31`;
      return { aStart, aEnd: iso(today), bStart, bEnd };
    }
    case 'custom':
      return { aStart: customA.start, aEnd: customA.end, bStart: customB.start, bEnd: customB.end };
    default:
      return { aStart: iso(addDays(today, -29)), aEnd: iso(today), bStart: iso(addDays(today, -59)), bEnd: iso(addDays(today, -30)) };
  }
};

const periodStats = (workouts, weights, { start, end }) => {
  const ws  = workouts.filter((w) => w.date >= start && w.date <= end);
  const wts = weights.filter((w) => w.date >= start && w.date <= end);

  const cals      = ws.reduce((s, w) => s + (Number(w.calories) || 0), 0);
  const mins      = ws.reduce((s, w) => s + (Number(w.minutes)  || 0), 0);
  const miles     = ws.reduce((s, w) => s + (Number(w.miles)    || 0), 0);
  const days      = new Set(ws.map((w) => w.date)).size;
  const cardio    = ws.filter((w) => w.type === 'cardio').length;
  const strength  = ws.filter((w) => w.type === 'strength').length;
  const avgCals   = ws.length ? cals / ws.length : 0;
  const weightStart = wts.length ? Number(wts[0].weight) : null;
  const weightEnd   = wts.length ? Number(wts[wts.length - 1].weight) : null;
  const weightLoss  = weightStart && weightEnd ? weightStart - weightEnd : null;

  return { cals, mins, miles, days, cardio, strength, avgCals, weightLoss, workouts: ws.length };
};

const METRICS = [
  { key: 'cals',     label: 'Calories Burned', unit: 'cal', higherBetter: true },
  { key: 'days',     label: 'Active Days',      unit: 'days', higherBetter: true },
  { key: 'workouts', label: 'Workouts',         unit: '', higherBetter: true },
  { key: 'miles',    label: 'Miles',            unit: 'mi', decimals: 1, higherBetter: true },
  { key: 'mins',     label: 'Minutes',          unit: 'min', higherBetter: true },
  { key: 'avgCals',  label: 'Avg Cal/Workout',  unit: 'cal', higherBetter: true },
  { key: 'weightLoss', label: 'Weight Lost',    unit: 'lbs', decimals: 1, higherBetter: true },
];

export default function ProgressComparison({ workouts, weights }) {
  const [preset, setPreset]   = useState('last30');
  const [customA, setCustomA] = useState({ start: '', end: '' });
  const [customB, setCustomB] = useState({ start: '', end: '' });
  const [labelA, setLabelA]   = useState('Period A');
  const [labelB, setLabelB]   = useState('Period B');

  const periods = useMemo(() => {
    const p = resolvePeriod(preset, customA, customB);
    return {
      a: { start: p.aStart, end: p.aEnd },
      b: { start: p.bStart, end: p.bEnd },
    };
  }, [preset, customA, customB]);

  const statsA = useMemo(() => periodStats(workouts, weights, periods.a), [workouts, weights, periods.a]);
  const statsB = useMemo(() => periodStats(workouts, weights, periods.b), [workouts, weights, periods.b]);

  // Bar chart data
  const barData = METRICS.filter((m) => m.key !== 'weightLoss').map((m) => ({
    name: m.label.split(' ')[0],
    [labelA || 'A']: Number((statsA[m.key] || 0).toFixed(m.decimals || 0)),
    [labelB || 'B']: Number((statsB[m.key] || 0).toFixed(m.decimals || 0)),
  }));

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">COM<span>PARE</span></div>
          <div className="page-sub">// How far you've come</div>
        </div>
      </div>

      {/* Period selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">Compare Periods</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {PRESETS.map((p) => (
            <button key={p.a + p.b}
              className={`btn small ${preset === p.a && p.a !== 'custom' ? '' : preset === 'custom' && p.a === 'custom' ? '' : 'secondary'}`}
              onClick={() => setPreset(p.a === 'custom' ? 'custom' : p.a)}
            >{p.label}</button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="grid grid-2" style={{ gap: 20 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: 1, marginBottom: 8 }}>PERIOD A</div>
              <div className="form-grid">
                <div className="form-group"><label>Label</label><input value={labelA} onChange={(e) => setLabelA(e.target.value)} placeholder="This Period" /></div>
                <div className="form-group"><label>Start</label><input type="date" value={customA.start} onChange={(e) => setCustomA({ ...customA, start: e.target.value })} /></div>
                <div className="form-group"><label>End</label><input type="date" value={customA.end} onChange={(e) => setCustomA({ ...customA, end: e.target.value })} /></div>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--info)', letterSpacing: 1, marginBottom: 8 }}>PERIOD B</div>
              <div className="form-grid">
                <div className="form-group"><label>Label</label><input value={labelB} onChange={(e) => setLabelB(e.target.value)} placeholder="Prior Period" /></div>
                <div className="form-group"><label>Start</label><input type="date" value={customB.start} onChange={(e) => setCustomB({ ...customB, start: e.target.value })} /></div>
                <div className="form-group"><label>End</label><input type="date" value={customB.end} onChange={(e) => setCustomB({ ...customB, end: e.target.value })} /></div>
              </div>
            </div>
          </div>
        )}

        {preset !== 'custom' && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>
            <span style={{ color: 'var(--accent)' }}>■ Period A:</span> {periods.a.start} → {periods.a.end}
            <span style={{ margin: '0 16px', color: 'var(--info)' }}>■ Period B:</span> {periods.b.start} → {periods.b.end}
          </div>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {METRICS.map((m) => {
          const vA = statsA[m.key] ?? null;
          const vB = statsB[m.key] ?? null;
          if (vA === null && vB === null) return null;
          const diff   = (vA || 0) - (vB || 0);
          const better = m.higherBetter ? diff > 0 : diff < 0;
          const neutral = Math.abs(diff) < 0.01;
          const color  = neutral ? 'var(--text-dim)' : better ? 'var(--accent)' : 'var(--warn)';
          const Icon   = neutral ? Minus : better ? TrendingUp : TrendingDown;
          return (
            <div key={m.key} className="card stat-card">
              <div className="stat-label">{m.label}</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontFamily: 'var(--display)', fontSize: 28, color: 'var(--accent)' }}>
                    {fmtNum(vA || 0, m.decimals || 0)}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-mute)', marginLeft: 3 }}>{m.unit}</span>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>vs</span>
                <div>
                  <span style={{ fontFamily: 'var(--display)', fontSize: 22, color: 'var(--info)' }}>
                    {fmtNum(vB || 0, m.decimals || 0)}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-mute)', marginLeft: 3 }}>{m.unit}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--mono)', fontSize: 11, color }}>
                <Icon size={12} />
                {neutral ? 'Same' : `${diff > 0 ? '+' : ''}${fmtNum(diff, m.decimals || 0)} ${m.unit}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bar chart comparison */}
      <div className="card">
        <div className="section-title">Side-by-Side</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#262626" vertical={false} />
            <XAxis dataKey="name" stroke="#6b6b6b" fontSize={10} />
            <YAxis stroke="#6b6b6b" fontSize={10} />
            <Tooltip contentStyle={{ background: '#131313', border: '1px solid #333', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontFamily: 'var(--mono)', fontSize: 11 }} />
            <Bar dataKey={labelA || 'A'} fill="#c6ff3d" radius={[2, 2, 0, 0]} />
            <Bar dataKey={labelB || 'B'} fill="#4d9fff" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
