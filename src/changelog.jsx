export const VERSION = '2.0';

export const CHANGELOG = [
  {
    version: '2.0',
    date: '2026-05-16',
    title: 'The Big One',
    changes: [
      'Journey Map — track cumulative miles on a live map from home to any destination',
      'Weather widget — live temp + condition icon on the Today page header',
      'Custom profile name and photo in the sidebar',
      'Progress Photos — upload and browse progress photos stored in Supabase',
      'Activity Calendar — GitHub-style heatmap, click any day for full log',
      'Progress Comparison — compare any two time periods side by side with charts',
      'Weight loss counter in sidebar with animated count-up on load',
      'Version tracker — this changelog you\'re reading right now',
      'Dark / Light mode toggle',
    ],
  },
  {
    version: '1.9',
    date: '2026-05-14',
    title: 'Health & Recovery',
    changes: [
      'Weekly Review — auto-generated debrief every week with written insights',
      'Journal — daily notes with mood, energy, tags, and workout context inline',
      'Lab Results tracker — full TRT panel with trend charts and reference ranges',
      'Rest Day Intelligence — smart recommendation based on workout streak',
    ],
  },
  {
    version: '1.8',
    date: '2026-05-13',
    title: 'DLC & Challenge Overhaul',
    changes: [
      'DLC Pack system — import downloadable JSON challenge packs',
      'Progress bars on every challenge card (daily, weekly, monthly, events)',
      'Sprint to Summer event challenge — burn 15,000 cal by June 21',
      'Challenge history — lifetime record of every challenge completed',
      'Fixed DLC crash — descriptor-based check/progress system (JSON-safe)',
      'Magnesium checklist fix — partial name matching',
    ],
  },
  {
    version: '1.7',
    date: '2026-05-12',
    title: 'Supabase Sync',
    changes: [
      'Full Supabase integration — data syncs across all devices',
      'One-time migration — localStorage data automatically uploaded on first login',
      'Force Re-sync button in Settings',
      'Sync status indicator in sidebar (Synced / Offline / Local Only)',
      'Fixed camelCase/snake_case column mapping bug that was silently blocking sync',
    ],
  },
  {
    version: '1.6',
    date: '2026-05-11',
    title: 'TRT & Supplements',
    changes: [
      'TRT Tracker — log weekly injections with compound, dose, site, notes',
      'Injection site rotation suggestions',
      'Next injection date estimate with overdue alert',
      'Supplement tracker — Vitamin D3+K2, Magnesium, custom supplements',
      'Supplement streak tracking per supplement',
      'TRT alert dot on nav every Thursday',
    ],
  },
  {
    version: '1.5',
    date: '2026-05-11',
    title: 'Core App',
    changes: [
      'Initial app launch — workout logging (cardio + strength)',
      'Weight tracker with trend chart',
      'Goal Planner — calorie-based weight loss calculator',
      'Dashboard with 30-day chart and weekly bars',
      'History with search and CSV export',
      'Personal Records (best single workout, strength PRs)',
      '60+ badges including 12 mystery badges',
      'Analytics — BMR, TDEE, BMI, macros, projected goal date',
      'Today page with daily checklist',
      'Daily, weekly, monthly challenges',
    ],
  },
];

// Version modal component
import { useState } from 'react';
import { X } from 'lucide-react';

export function VersionBadge() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'none', border: '1px solid var(--border)', cursor: 'pointer',
          fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: 1,
          color: 'var(--text-mute)', padding: '4px 8px',
          textTransform: 'uppercase', transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-mute)'; }}
      >
        v{VERSION}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              width: '100%', maxWidth: 560,
              maxHeight: '85vh', overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              position: 'sticky', top: 0, background: 'var(--bg-2)', zIndex: 1,
            }}>
              <div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 28, letterSpacing: 1 }}>
                  CHANGE<span style={{ color: 'var(--accent)' }}>LOG</span>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 2, letterSpacing: 1 }}>
                  HYBRID HUSTLER FITNESS OS
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Versions */}
            <div style={{ padding: '20px 24px' }}>
              {CHANGELOG.map((v, i) => (
                <div key={v.version} style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{
                      fontFamily: 'var(--display)', fontSize: 22, letterSpacing: 1,
                      color: i === 0 ? 'var(--accent)' : 'var(--text)',
                    }}>v{v.version}</div>
                    {i === 0 && (
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 2,
                        color: 'var(--accent)', border: '1px solid rgba(198,255,61,0.4)',
                        padding: '2px 6px', textTransform: 'uppercase',
                      }}>CURRENT</span>
                    )}
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginLeft: 'auto' }}>
                      {v.date}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 8, letterSpacing: 1 }}>
                    {v.title.toUpperCase()}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {v.changes.map((c, ci) => (
                      <li key={ci} style={{
                        display: 'flex', gap: 8, padding: '4px 0',
                        fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.4,
                        borderBottom: ci < v.changes.length - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                        <span style={{ color: 'var(--accent)', flexShrink: 0 }}>+</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
