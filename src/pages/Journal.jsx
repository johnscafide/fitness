import { useState, useMemo } from 'react';
import { Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { uid, todayISO, fmtDate, storage } from '../storage';

const MOODS   = ['💪 Strong', '😊 Good', '😐 Okay', '😴 Tired', '😣 Rough'];
const ENERGY  = ['🔋 High', '⚡ Medium', '🪫 Low'];
const QUICK_TAGS = ['Rest Day', 'Sore', 'Great Sleep', 'Bad Sleep', 'Stressed', 'Motivated', 'Sick', 'Travel', 'Diet On Point', 'Cheat Day', 'TRT Week', 'Labs Done'];

const JOURNAL_KEY = 'journal';
export const getJournal  = ()        => storage.get(JOURNAL_KEY, []);
export const saveJournal = (entries) => storage.set(JOURNAL_KEY, entries);

export default function Journal({ workouts, weights, showToast }) {
  const [entries, setEntries] = useState(() => getJournal());

  // Form state
  const [date, setDate]     = useState(todayISO());
  const [text, setText]     = useState('');
  const [mood, setMood]     = useState('');
  const [energy, setEnergy] = useState('');
  const [tags, setTags]     = useState([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const toggleTag = (tag) => setTags((prev) =>
    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
  );

  const save = () => {
    if (!text.trim() && !mood && !energy && tags.length === 0) {
      showToast('Add something to log');
      return;
    }
    const entry = {
      id: uid(), date, text: text.trim(),
      mood, energy, tags,
      createdAt: new Date().toISOString(),
    };
    const next = [entry, ...entries];
    setEntries(next);
    saveJournal(next);
    setText(''); setMood(''); setEnergy(''); setTags([]);
    showToast('Journal entry saved');
  };

  const remove = (id) => {
    if (!confirm('Delete this entry?')) return;
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    saveJournal(next);
  };

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter((e) =>
      (e.text || '').toLowerCase().includes(q) ||
      (e.mood || '').toLowerCase().includes(q) ||
      (e.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [entries, search]);

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  // Context: workouts and weight on a given date
  const contextFor = (date) => {
    const ws  = workouts.filter((w) => w.date === date);
    const wt  = weights.find((w) => w.date === date);
    const cal = ws.reduce((s, w) => s + (Number(w.calories) || 0), 0);
    return { workoutCount: ws.length, calories: cal, weight: wt?.weight ?? null };
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">JOUR<span>NAL</span></div>
          <div className="page-sub">// {entries.length} entries</div>
        </div>
      </div>

      {/* Entry form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">New Entry</div>
        <div className="form-group" style={{ maxWidth: 220, marginBottom: 16 }}>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Note</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="How did today feel? What happened? Anything to remember about your training, protocol, or progress..."
          />
        </div>

        <div className="grid grid-2" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label>Mood</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(mood === m ? '' : m)}
                  style={{
                    padding: '5px 10px', fontSize: 12, fontFamily: 'var(--mono)',
                    background: mood === m ? 'var(--accent)' : 'var(--bg)',
                    color: mood === m ? '#000' : 'var(--text-dim)',
                    border: `1px solid ${mood === m ? 'var(--accent)' : 'var(--border-2)'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >{m}</button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Energy</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {ENERGY.map((e) => (
                <button
                  key={e}
                  onClick={() => setEnergy(energy === e ? '' : e)}
                  style={{
                    padding: '5px 10px', fontSize: 12, fontFamily: 'var(--mono)',
                    background: energy === e ? 'var(--accent)' : 'var(--bg)',
                    color: energy === e ? '#000' : 'var(--text-dim)',
                    border: `1px solid ${energy === e ? 'var(--accent)' : 'var(--border-2)'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >{e}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Tags</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {QUICK_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                style={{
                  padding: '4px 9px', fontSize: 11, fontFamily: 'var(--mono)',
                  background: tags.includes(t) ? 'rgba(77,159,255,0.15)' : 'var(--bg)',
                  color: tags.includes(t) ? 'var(--info)' : 'var(--text-dim)',
                  border: `1px solid ${tags.includes(t) ? 'rgba(77,159,255,0.4)' : 'var(--border)'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >{t}</button>
            ))}
          </div>
        </div>

        <button className="btn" onClick={save}>Save Entry</button>
      </div>

      {/* Search */}
      {entries.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-2)', border: '1px solid var(--border-2)',
          padding: '0 12px', marginBottom: 16,
        }}>
          <Search size={14} color="var(--text-mute)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries..."
            style={{ background: 'transparent', border: 'none', outline: 'none', padding: '10px 0', flex: 1, color: 'var(--text)', fontSize: 13 }}
          />
        </div>
      )}

      {/* Entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sorted.map((entry) => {
          const ctx = contextFor(entry.date);
          const isExpanded = expanded === entry.id;
          return (
            <div key={entry.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Header row */}
              <div
                onClick={() => setExpanded(isExpanded ? null : entry.id)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 18px', cursor: 'pointer',
                  borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', minWidth: 90 }}>
                    {fmtDate(entry.date)}
                  </div>
                  {entry.mood   && <span style={{ fontSize: 12 }}>{entry.mood}</span>}
                  {entry.energy && <span style={{ fontSize: 12 }}>{entry.energy}</span>}
                  {entry.tags?.map((t) => (
                    <span key={t} style={{
                      fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 1,
                      color: 'var(--info)', border: '1px solid rgba(77,159,255,0.3)',
                      padding: '2px 5px', textTransform: 'uppercase',
                    }}>{t}</span>
                  ))}
                  {/* Inline workout context */}
                  {ctx.workoutCount > 0 && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)' }}>
                      🔥 {fmtNum(ctx.calories)} cal
                    </span>
                  )}
                  {ctx.weight && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--info)' }}>
                      ⚖ {ctx.weight} lbs
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {isExpanded ? <ChevronUp size={14} color="var(--text-mute)" /> : <ChevronDown size={14} color="var(--text-mute)" />}
                </div>
              </div>

              {/* Expanded body */}
              {isExpanded && (
                <div style={{ padding: '14px 18px' }}>
                  {entry.text ? (
                    <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, marginBottom: 14, whiteSpace: 'pre-wrap' }}>
                      {entry.text}
                    </p>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--text-mute)', fontFamily: 'var(--mono)', marginBottom: 14 }}>No text note.</p>
                  )}
                  <button className="icon-btn danger" onClick={() => remove(entry.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="card"><div className="empty">{search ? 'No matching entries' : 'No journal entries yet'}</div></div>
        )}
      </div>
    </div>
  );
}
