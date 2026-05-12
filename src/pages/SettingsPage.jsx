import { useState, useRef } from 'react';
import { Download, Upload, Trash2, RefreshCw } from 'lucide-react';
import { downloadFile } from '../storage';
import { hasSupabase } from '../supabase';
import { resetMigration, migrateIfNeeded } from '../db';

export default function SettingsPage({
  profile, setProfile, workouts, setWorkouts, weights, setWeights,
  challenge, setChallenge, supplements, setSupplements, trtLogs, setTrtLogs,
  showToast, clearAllRemote,
}) {
  const [draft, setDraft]     = useState(profile);
  const [resyncing, setResyncing] = useState(false);
  const fileRef = useRef(null);

  const forceResync = async () => {
    if (!hasSupabase()) { showToast('Supabase not configured'); return; }
    setResyncing(true);
    resetMigration();
    await migrateIfNeeded({ workouts, weights, supplements, trtLogs, profile, challenge });
    setResyncing(false);
    showToast('Re-sync complete — all local data pushed to Supabase');
  };

  const save = () => {
    setProfile({
      ...draft,
      heightFt: Number(draft.heightFt) || 0,
      heightIn: Number(draft.heightIn) || 0,
      age: Number(draft.age) || 0,
      dailyCalorieGoal: Number(draft.dailyCalorieGoal) || 300,
    });
    showToast('Profile saved');
  };

  const exportAll = () => {
    const data = {
      profile, challenge,
      workouts, weights,
      supplements: supplements || [],
      trtLogs: trtLogs || [],
      exportedAt: new Date().toISOString(),
      version: 2,
    };
    downloadFile(
      `fitness-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(data, null, 2),
      'application/json'
    );
    showToast('Backup exported');
  };

  const importFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!confirm('This will replace all current data. Continue?')) return;
        if (data.profile)     setProfile(data.profile);
        if (data.challenge)   setChallenge(data.challenge);
        if (data.workouts)    setWorkouts(data.workouts);
        if (data.weights)     setWeights(data.weights);
        if (data.supplements) setSupplements(data.supplements);
        if (data.trtLogs)     setTrtLogs(data.trtLogs);
        showToast('Data imported');
      } catch {
        showToast('Invalid file');
      }
    };
    reader.readAsText(file);
  };

  const clearAll = async () => {
    if (!confirm('This deletes EVERYTHING — workouts, weights, supplements, TRT, profile. Are you sure?')) return;
    if (!confirm('Really? This cannot be undone.')) return;
    // Clear Supabase first
    await clearAllRemote();
    // Then local state
    setWorkouts([]); setWeights([]); setSupplements([]); setTrtLogs([]);
    setProfile({ name: 'John', heightFt: 5, heightIn: 10, age: 40, sex: 'male', dailyCalorieGoal: 300 });
    setChallenge({ startDate: new Date().toISOString().slice(0, 10), months: 3, startWeight: null, goalWeight: null });
    showToast('Everything cleared');
  };

  const storageSize = Math.round(
    (JSON.stringify({ workouts, weights, profile, challenge, supplements, trtLogs }).length / 1024) * 10
  ) / 10;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">SETT<span>INGS</span></div>
          <div className="page-sub">// Profile & data management</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Profile</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Age</label>
            <input type="number" value={draft.age || ''} onChange={(e) => setDraft({ ...draft, age: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Sex</label>
            <select value={draft.sex || 'male'} onChange={(e) => setDraft({ ...draft, sex: e.target.value })}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Height (ft)</label>
            <input type="number" value={draft.heightFt || ''} onChange={(e) => setDraft({ ...draft, heightFt: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Height (in)</label>
            <input type="number" value={draft.heightIn || ''} onChange={(e) => setDraft({ ...draft, heightIn: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Daily Calorie Burn Goal</label>
            <input type="number" value={draft.dailyCalorieGoal || ''} onChange={(e) => setDraft({ ...draft, dailyCalorieGoal: e.target.value })} />
          </div>
        </div>
        <button className="btn" onClick={save} style={{ marginTop: 16 }}>Save Profile</button>
      </div>

      {/* Sync status */}
      <div className="card" style={{ marginBottom: 20, borderColor: hasSupabase() ? 'rgba(198,255,61,0.3)' : 'var(--border)' }}>
        <div className="section-title">Sync Status</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.8 }}>
          {hasSupabase() ? (
            <>
              <span style={{ color: 'var(--accent)' }}>● Supabase connected</span><br />
              Data syncs automatically across all devices.<br />
              Your data is stored in your Supabase project.
            </>
          ) : (
            <>
              <span style={{ color: 'var(--warn)' }}>● Local only (Supabase not configured)</span><br />
              Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel env vars to enable sync.
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Data Management</div>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16, lineHeight: 1.5 }}>
          Export a full JSON backup to keep a local copy. Import to restore or migrate to another Supabase project.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" onClick={exportAll}><Download size={14} /> Export Full Backup (JSON)</button>
          <button className="btn secondary" onClick={() => fileRef.current.click()}><Upload size={14} /> Import Backup</button>
          {hasSupabase() && (
            <button className="btn secondary" onClick={forceResync} disabled={resyncing}>
              <RefreshCw size={14} style={{ animation: resyncing ? 'spin 1s linear infinite' : 'none' }} />
              {resyncing ? 'Syncing...' : 'Force Re-sync to Supabase'}
            </button>
          )}
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importFile} />
        </div>
      </div>

      <div className="card" style={{ borderColor: 'rgba(255,68,68,0.3)', marginBottom: 20 }}>
        <div className="section-title" style={{ color: 'var(--danger)' }}>Danger Zone</div>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16, lineHeight: 1.5 }}>
          Permanently deletes everything from localStorage {hasSupabase() ? 'and Supabase' : ''}. Export a backup first.
        </p>
        <button className="btn danger" onClick={clearAll}><Trash2 size={14} /> Clear All Data</button>
      </div>

      <div className="card" style={{ background: 'var(--bg-3)' }}>
        <div className="section-title">Stats</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 2 }}>
          Workouts: {workouts.length}<br />
          Weight entries: {weights.length}<br />
          Supplement logs: {(supplements || []).length}<br />
          TRT logs: {(trtLogs || []).length}<br />
          Local storage used: ~{storageSize} KB
        </div>
      </div>
    </div>
  );
}
