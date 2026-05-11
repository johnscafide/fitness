import { useState, useRef } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { storage, downloadFile, toCSV } from '../storage';

export default function SettingsPage({ profile, setProfile, workouts, setWorkouts, weights, setWeights, challenge, setChallenge, showToast }) {
  const [draft, setDraft] = useState(profile);
  const fileRef = useRef(null);

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
      profile,
      challenge,
      workouts,
      weights,
      exportedAt: new Date().toISOString(),
      version: 1,
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
        if (data.profile) setProfile(data.profile);
        if (data.challenge) setChallenge(data.challenge);
        if (data.workouts) setWorkouts(data.workouts);
        if (data.weights) setWeights(data.weights);
        showToast('Data imported');
      } catch (err) {
        showToast('Invalid file');
      }
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    const msg = 'This deletes everything: workouts, weights, profile, challenge. There is no undo. Are you absolutely sure?';
    if (!confirm(msg)) return;
    if (!confirm('Really delete everything?')) return;
    setWorkouts([]);
    setWeights([]);
    setProfile({
      name: 'John',
      heightFt: 5,
      heightIn: 10,
      age: 40,
      sex: 'male',
      dailyCalorieGoal: 300,
    });
    setChallenge({
      startDate: new Date().toISOString().slice(0, 10),
      months: 3,
      startWeight: null,
      goalWeight: null,
    });
    showToast('Everything cleared');
  };

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
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Age</label>
            <input type="number" value={draft.age} onChange={(e) => setDraft({ ...draft, age: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Sex</label>
            <select value={draft.sex} onChange={(e) => setDraft({ ...draft, sex: e.target.value })}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Height (ft)</label>
            <input type="number" value={draft.heightFt} onChange={(e) => setDraft({ ...draft, heightFt: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Height (in)</label>
            <input type="number" value={draft.heightIn} onChange={(e) => setDraft({ ...draft, heightIn: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Daily Calorie Goal</label>
            <input type="number" value={draft.dailyCalorieGoal} onChange={(e) => setDraft({ ...draft, dailyCalorieGoal: e.target.value })} />
          </div>
        </div>
        <button className="btn" onClick={save} style={{ marginTop: 16 }}>Save Profile</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Data Management</div>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16, lineHeight: 1.5 }}>
          Your data lives in your browser (localStorage). It does NOT sync between devices or browsers. Use the backup button regularly to save a copy you can restore later, or move to another browser.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" onClick={exportAll}>
            <Download size={14} /> Export Full Backup (JSON)
          </button>
          <button className="btn secondary" onClick={() => fileRef.current.click()}>
            <Upload size={14} /> Import Backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={importFile}
          />
        </div>
      </div>

      <div className="card" style={{ borderColor: 'rgba(255, 68, 68, 0.3)' }}>
        <div className="section-title" style={{ color: 'var(--danger)' }}>Danger Zone</div>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16, lineHeight: 1.5 }}>
          Permanently delete everything. Export a backup first if you're not 100% sure.
        </p>
        <button className="btn danger" onClick={clearAll}>
          <Trash2 size={14} /> Clear All Data
        </button>
      </div>

      <div className="card" style={{ marginTop: 20, background: 'var(--bg-3)' }}>
        <div className="section-title">Stats</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.8 }}>
          Workouts stored: {workouts.length}<br/>
          Weight entries: {weights.length}<br/>
          Storage used: ~{Math.round((JSON.stringify({ workouts, weights, profile, challenge }).length / 1024) * 10) / 10} KB
        </div>
      </div>
    </div>
  );
}
