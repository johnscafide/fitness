import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { fmtDate, fmtNum } from '../storage';
import { getJournal } from './Journal';
import { getLabResults } from './LabResults';

const DAYS  = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const isoToDate = (iso) => new Date(iso + 'T00:00:00');
const dateToISO = (d)   => d.toISOString().slice(0, 10);

// Build 52 weeks of dates ending today
const buildCalendar = () => {
  const today   = new Date();
  // Start on the Monday 52 weeks ago
  const start   = new Date(today);
  start.setDate(start.getDate() - 364);
  // Adjust to previous Monday
  const dow = start.getDay();
  start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));

  const weeks = [];
  let current = new Date(start);
  while (current <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(dateToISO(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
};

const calColor = (intensity) => {
  if (intensity === 0) return 'var(--bg-3)';
  if (intensity < 300) return 'rgba(198,255,61,0.25)';
  if (intensity < 600) return 'rgba(198,255,61,0.5)';
  if (intensity < 900) return 'rgba(198,255,61,0.75)';
  return '#c6ff3d';
};

export default function ActivityCalendar({ workouts, weights, supplements, trtLogs }) {
  const [selected, setSelected] = useState(null);
  const weeks = useMemo(() => buildCalendar(), []);

  // Build daily calorie map
  const dailyCals = useMemo(() => {
    const map = {};
    workouts.forEach((w) => {
      map[w.date] = (map[w.date] || 0) + (Number(w.calories) || 0);
    });
    return map;
  }, [workouts]);

  // Lazy-load journal & lab data for modal
  const journal    = useMemo(() => getJournal(),    [selected]);
  const labResults = useMemo(() => getLabResults(), [selected]);

  // Data for selected day
  const dayData = useMemo(() => {
    if (!selected) return null;
    const ws   = workouts.filter((w) => w.date === selected);
    const wt   = weights.find((w) => w.date === selected);
    const supp = supplements.filter((s) => s.date === selected);
    const trt  = (trtLogs || []).filter((t) => t.date === selected);
    const jrn  = journal.filter((e) => e.date === selected);
    const labs = labResults.filter((r) => r.date === selected);
    return { ws, wt, supp, trt, jrn, labs };
  }, [selected, workouts, weights, supplements, trtLogs, journal, labResults]);

  // Month labels — find first week of each month
  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const d = isoToDate(week[0]);
      if (d.getMonth() !== lastMonth) {
        labels.push({ wi, label: MONTHS[d.getMonth()] });
        lastMonth = d.getMonth();
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">CALEN<span>DAR</span></div>
          <div className="page-sub">// Click any day to see full activity log</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24, overflowX: 'auto' }}>
        {/* Month labels */}
        <div style={{ display: 'flex', gap: 0, paddingLeft: 24, marginBottom: 4 }}>
          {monthLabels.map(({ wi, label }) => (
            <div key={wi} style={{
              position: 'absolute',
              left: wi * 16 + 24,
              fontFamily: 'var(--mono)', fontSize: 9,
              color: 'var(--text-mute)', letterSpacing: 1,
            }}>{label}</div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 0, marginTop: 20, position: 'relative' }}>
          {/* Day labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 6 }}>
            {DAYS.map((d, i) => (
              <div key={i} style={{
                height: 13, fontFamily: 'var(--mono)', fontSize: 9,
                color: i % 2 === 0 ? 'var(--text-mute)' : 'transparent', lineHeight: '13px',
              }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'flex', gap: 2 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {week.map((date) => {
                  const cals  = dailyCals[date] || 0;
                  const color = calColor(cals);
                  const today = dateToISO(new Date());
                  const future = date > today;
                  return (
                    <div
                      key={date}
                      onClick={() => !future && setSelected(date)}
                      title={future ? '' : `${fmtDate(date)}${cals ? ` · ${fmtNum(cals)} cal` : ''}`}
                      style={{
                        width: 13, height: 13,
                        background: future ? 'transparent' : color,
                        border: date === selected ? '1px solid var(--accent)' : '1px solid transparent',
                        cursor: future ? 'default' : 'pointer',
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={(e) => { if (!future) e.currentTarget.style.transform = 'scale(1.3)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-mute)' }}>
          <span>Less</span>
          {[0, 200, 400, 700, 1000].map((v) => (
            <div key={v} style={{ width: 13, height: 13, background: calColor(v) }} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Day detail modal */}
      {selected && dayData && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              padding: 28, width: '100%', maxWidth: 560,
              maxHeight: '85vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 28, letterSpacing: 1 }}>
                {fmtDate(selected)}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Workouts */}
            {dayData.ws.length > 0 && (
              <Section title="Workouts">
                {dayData.ws.map((w) => (
                  <Row key={w.id}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span className={`tag ${w.type}`}>{w.type}</span>
                      <span>{w.equipment}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>
                      {fmtNum(w.calories)} cal · {w.minutes} min{w.miles ? ` · ${w.miles} mi` : ''}
                    </div>
                  </Row>
                ))}
              </Section>
            )}

            {/* Weight */}
            {dayData.wt && (
              <Section title="Weight">
                <Row>
                  <span style={{ fontFamily: 'var(--display)', fontSize: 22, color: 'var(--info)' }}>
                    {dayData.wt.weight} lbs
                  </span>
                  {dayData.wt.waist && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>Waist: {dayData.wt.waist}"</span>}
                </Row>
              </Section>
            )}

            {/* Supplements */}
            {dayData.supp.length > 0 && (
              <Section title="Supplements">
                {dayData.supp.map((s) => (
                  <Row key={s.id}>
                    <span>{s.name}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>{s.dose} · {s.time}</span>
                  </Row>
                ))}
              </Section>
            )}

            {/* TRT */}
            {dayData.trt.length > 0 && (
              <Section title="TRT">
                {dayData.trt.map((t) => (
                  <Row key={t.id}>
                    <span>{t.compound}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--warn)' }}>{t.dose} {t.unit} · {t.site}</span>
                  </Row>
                ))}
              </Section>
            )}

            {/* Journal */}
            {dayData.jrn.length > 0 && (
              <Section title="Journal">
                {dayData.jrn.map((e) => (
                  <div key={e.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13, lineHeight: 1.5, color: 'var(--text)' }}>
                    {e.mood && <span style={{ marginRight: 8 }}>{e.mood}</span>}
                    {e.energy && <span style={{ marginRight: 8 }}>{e.energy}</span>}
                    {e.tags?.map((t) => <span key={t} style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--info)', border: '1px solid rgba(77,159,255,0.3)', padding: '1px 5px', marginRight: 4 }}>{t}</span>)}
                    {e.text && <div style={{ marginTop: 6 }}>{e.text}</div>}
                  </div>
                ))}
              </Section>
            )}

            {/* Labs */}
            {dayData.labs.length > 0 && (
              <Section title="Lab Results">
                {dayData.labs.map((r) => (
                  <Row key={r.id}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.markerId.replace(/_/g, ' ').toUpperCase()}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>{r.value}</span>
                  </Row>
                ))}
              </Section>
            )}

            {dayData.ws.length === 0 && !dayData.wt && dayData.supp.length === 0 &&
              dayData.trt.length === 0 && dayData.jrn.length === 0 && dayData.labs.length === 0 && (
              <div className="empty">Nothing logged on this day.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="section-title" style={{ marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 6 }}>
      {children}
    </div>
  );
}
