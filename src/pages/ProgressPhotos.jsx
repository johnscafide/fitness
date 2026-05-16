import { useState, useEffect, useRef, useMemo } from 'react';
import { Camera, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { uid, fmtDate, todayISO } from '../storage';
import { supabase, hasSupabase } from '../supabase';

const BUCKET = 'progress-photos';
const USER   = 'john';

// ── Supabase storage helpers ──────────────────────────────
const uploadPhoto = async (file, id) => {
  if (!hasSupabase()) throw new Error('Supabase not configured');
  const ext  = file.name.split('.').pop().toLowerCase();
  const path = `${USER}/${id}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
};

const getPhotoUrl = async (path) => {
  if (!hasSupabase() || !path) return null;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl || null;
};

const deletePhoto = async (path) => {
  if (!hasSupabase() || !path) return;
  await supabase.storage.from(BUCKET).remove([path]);
};

const savePhotoRecord = async (record) => {
  if (!hasSupabase()) return;
  await supabase.from('progress_photos').upsert({
    id:           record.id,
    user_id:      USER,
    date:         record.date,
    storage_path: record.path,
    caption:      record.caption || null,
    weight:       record.weight  || null,
    created_at:   record.createdAt,
    updated_at:   new Date().toISOString(),
  }, { onConflict: 'id' });
};

const deletePhotoRecord = async (id) => {
  if (!hasSupabase()) return;
  await supabase.from('progress_photos').delete().eq('id', id).eq('user_id', USER);
};

const loadPhotoRecords = async () => {
  if (!hasSupabase()) return [];
  const { data, error } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('user_id', USER)
    .order('date', { ascending: false });
  if (error) return [];
  return (data || []).map((r) => ({
    id:        r.id,
    date:      r.date,
    path:      r.storage_path,
    caption:   r.caption,
    weight:    r.weight,
    createdAt: r.created_at,
  }));
};

export default function ProgressPhotos({ weights, showToast }) {
  const [photos,    setPhotos]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [urls,      setUrls]      = useState({});   // id -> signed URL
  const [lightbox,  setLightbox]  = useState(null); // index into sorted photos
  const [date,      setDate]      = useState(todayISO());
  const [caption,   setCaption]   = useState('');
  const [weight,    setWeight]    = useState('');
  const fileRef = useRef(null);

  // Load records on mount
  useEffect(() => {
    loadPhotoRecords().then((recs) => { setPhotos(recs); setLoading(false); });
  }, []);

  // Load signed URLs for visible photos
  useEffect(() => {
    photos.forEach(async (p) => {
      if (!urls[p.id] && p.path) {
        const url = await getPhotoUrl(p.path);
        if (url) setUrls((prev) => ({ ...prev, [p.id]: url }));
      }
    });
  }, [photos]);

  const sorted = useMemo(() => [...photos].sort((a, b) => b.date.localeCompare(a.date)), [photos]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('File too large (max 10MB)'); return; }

    setUploading(true);
    try {
      const id   = uid();
      const path = await uploadPhoto(file, id);

      // Get a temporary object URL for immediate display
      const tempUrl = URL.createObjectURL(file);

      // Get the logged weight for this date if not manually entered
      const autoWeight = weight || (() => {
        const wt = [...weights].filter((w) => w.date <= date).sort((a, b) => b.date.localeCompare(a.date))[0];
        return wt?.weight || null;
      })();

      const record = {
        id, date, path, caption,
        weight: autoWeight ? Number(autoWeight) : null,
        createdAt: new Date().toISOString(),
      };

      await savePhotoRecord(record);
      setPhotos((prev) => [record, ...prev]);
      setUrls((prev) => ({ ...prev, [id]: tempUrl }));
      setCaption(''); setWeight('');
      showToast('Photo saved');
    } catch (err) {
      showToast('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const remove = async (photo) => {
    if (!confirm('Delete this photo permanently?')) return;
    await deletePhoto(photo.path);
    await deletePhotoRecord(photo.id);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    setUrls((prev) => { const n = { ...prev }; delete n[photo.id]; return n; });
    showToast('Photo deleted');
  };

  const lightboxPhoto = lightbox !== null ? sorted[lightbox] : null;

  // Weight closest to photo date
  const nearestWeight = (date) => {
    const wt = [...weights].filter((w) => w.date <= date).sort((a, b) => b.date.localeCompare(a.date))[0];
    return wt?.weight || null;
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">PROG<span>RESS</span></div>
          <div className="page-sub">// {photos.length} photo{photos.length !== 1 ? 's' : ''} logged</div>
        </div>
      </div>

      {/* Upload form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">Add Photo</div>
        <div className="form-grid" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Weight at time (lbs, optional)</label>
            <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)}
              placeholder={nearestWeight(date) || 'auto-fills from log'} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Caption (optional)</label>
            <input value={caption} onChange={(e) => setCaption(e.target.value)}
              placeholder="Front pose, 30 days in, feeling stronger..." />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn" onClick={() => fileRef.current.click()} disabled={uploading}>
            <Camera size={14} /> {uploading ? 'Uploading...' : 'Choose Photo'}
          </button>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>
            JPG, PNG, WEBP · max 10MB
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
          style={{ display: 'none' }} onChange={handleFileChange} />
      </div>

      {/* Photo grid */}
      {loading ? (
        <div className="card"><div className="empty">Loading photos...</div></div>
      ) : sorted.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            No progress photos yet. Add your first one to start your timeline.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {sorted.map((photo, idx) => {
            const url = urls[photo.id];
            const wt  = photo.weight || nearestWeight(photo.date);
            return (
              <div key={photo.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                {/* Photo */}
                <div
                  onClick={() => setLightbox(idx)}
                  style={{
                    height: 240, background: 'var(--bg-3)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', position: 'relative',
                  }}
                >
                  {url ? (
                    <img src={url} alt={photo.caption || fmtDate(photo.date)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ color: 'var(--text-mute)', fontFamily: 'var(--mono)', fontSize: 11 }}>Loading...</div>
                  )}
                </div>

                {/* Meta */}
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>
                        {fmtDate(photo.date)}
                      </div>
                      {wt && (
                        <div style={{ fontFamily: 'var(--display)', fontSize: 20, color: 'var(--info)', lineHeight: 1 }}>
                          {wt}<span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginLeft: 3 }}>lbs</span>
                        </div>
                      )}
                      {photo.caption && (
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.4 }}>
                          {photo.caption}
                        </div>
                      )}
                    </div>
                    <button className="icon-btn danger" onClick={() => remove(photo)} style={{ flexShrink: 0 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
            <X size={28} />
          </button>
          {lightbox > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
              style={{ position: 'absolute', left: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
              <ChevronLeft size={40} />
            </button>
          )}
          {lightbox < sorted.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
              style={{ position: 'absolute', right: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
              <ChevronRight size={40} />
            </button>
          )}
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', textAlign: 'center' }}>
            {urls[lightboxPhoto.id] && (
              <img src={urls[lightboxPhoto.id]} alt=""
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
            )}
            <div style={{ marginTop: 12, color: '#ccc', fontFamily: 'var(--mono)', fontSize: 12 }}>
              {fmtDate(lightboxPhoto.date)}
              {lightboxPhoto.weight && ` · ${lightboxPhoto.weight} lbs`}
              {lightboxPhoto.caption && ` · ${lightboxPhoto.caption}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
