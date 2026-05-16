import { useEffect, useRef, useState, useMemo } from 'react';
import { MapPin, Navigation, Edit2, Check, X } from 'lucide-react';
import { fmtNum, storage } from '../storage';

const MAP_KEY = 'journey_map_config';

const DEFAULT_CONFIG = {
  startName: 'Home (Williamstown, NJ)',
  startLat: 39.6837,
  startLng: -75.0187,
  endName: 'Grand Floridian Resort, Disney World',
  endLat: 28.4106,
  endLng: -81.5845,
};

// Haversine distance in miles between two lat/lng points
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Interpolate a point along the great-circle path at fraction t (0–1)
const interpolate = (lat1, lng1, lat2, lng2, t) => ({
  lat: lat1 + (lat2 - lat1) * t,
  lng: lng1 + (lng2 - lng1) * t,
});

// Geocode an address using Nominatim (free, no key)
const geocode = async (address) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (!data.length) throw new Error('Address not found');
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name };
};

export default function JourneyMap({ workouts }) {
  const mapRef      = useRef(null);
  const leafletRef  = useRef(null);
  const [config, setConfig]   = useState(() => storage.get(MAP_KEY, DEFAULT_CONFIG));
  const [editing, setEditing] = useState(null); // 'start' | 'end' | null
  const [editVal, setEditVal] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError]   = useState('');

  const totalMiles = useMemo(
    () => workouts.reduce((s, w) => s + (Number(w.miles) || 0), 0),
    [workouts]
  );

  const totalDistance = useMemo(
    () => haversine(config.startLat, config.startLng, config.endLat, config.endLng),
    [config]
  );

  const pct      = Math.min(1, totalMiles / totalDistance);
  const reached  = totalMiles >= totalDistance;
  const current  = interpolate(config.startLat, config.startLng, config.endLat, config.endLng, pct);
  const remaining = Math.max(0, totalDistance - totalMiles);

  // Build polyline points — start, current position, end
  const pathPoints = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      pts.push(interpolate(config.startLat, config.startLng, config.endLat, config.endLng, t));
    }
    return pts;
  }, [config]);

  const travelledPoints = useMemo(() => {
    const pts = [];
    const steps = Math.max(1, Math.round(pct * 100));
    for (let i = 0; i <= steps; i++) {
      const t = (i / 100);
      pts.push(interpolate(config.startLat, config.startLng, config.endLat, config.endLng, t));
    }
    return pts;
  }, [config, pct]);

  // Initialise Leaflet map
  useEffect(() => {
    if (!mapRef.current) return;

    // Dynamically import leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id   = 'leaflet-css';
      link.rel  = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      // Destroy previous instance
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }

      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
      leafletRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      // Full path (grey)
      L.polyline(
        pathPoints.map((p) => [p.lat, p.lng]),
        { color: '#333', weight: 3, dashArray: '6 6', opacity: 0.6 }
      ).addTo(map);

      // Travelled path (accent)
      if (travelledPoints.length > 1) {
        L.polyline(
          travelledPoints.map((p) => [p.lat, p.lng]),
          { color: '#c6ff3d', weight: 4, opacity: 0.9 }
        ).addTo(map);
      }

      // Start marker
      const startIcon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;background:#4d9fff;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
        iconAnchor: [7, 7],
      });
      L.marker([config.startLat, config.startLng], { icon: startIcon })
        .addTo(map)
        .bindPopup(`<b>Start:</b> ${config.startName}`);

      // End marker
      const endIcon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:#ffb020;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
        iconAnchor: [8, 8],
      });
      L.marker([config.endLat, config.endLng], { icon: endIcon })
        .addTo(map)
        .bindPopup(`<b>Destination:</b> ${config.endName}`);

      // Current position marker (pulsing)
      if (totalMiles > 0) {
        const curIcon = L.divIcon({
          className: '',
          html: `<div style="width:18px;height:18px;background:#c6ff3d;border:3px solid #000;border-radius:50%;box-shadow:0 0 0 4px rgba(198,255,61,0.3),0 2px 8px rgba(0,0,0,0.5)"></div>`,
          iconAnchor: [9, 9],
        });
        L.marker([current.lat, current.lng], { icon: curIcon })
          .addTo(map)
          .bindPopup(`<b>You are here</b><br>${fmtNum(totalMiles, 1)} miles in`);
      }

      // Fit map to show both endpoints with padding
      const bounds = L.latLngBounds(
        [config.startLat, config.startLng],
        [config.endLat, config.endLng]
      );
      map.fitBounds(bounds, { padding: [40, 40] });
    });

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, [config, totalMiles]);

  const startEdit = (which) => {
    setEditing(which);
    setEditVal(which === 'start' ? config.startName : config.endName);
    setGeoError('');
  };

  const cancelEdit = () => { setEditing(null); setEditVal(''); setGeoError(''); };

  const applyEdit = async () => {
    if (!editVal.trim()) { cancelEdit(); return; }
    setGeocoding(true);
    setGeoError('');
    try {
      const result = await geocode(editVal.trim());
      const next = editing === 'start'
        ? { ...config, startName: editVal.trim(), startLat: result.lat, startLng: result.lng }
        : { ...config, endName: editVal.trim(), endLat: result.lat, endLng: result.lng };
      setConfig(next);
      storage.set(MAP_KEY, next);
      setEditing(null);
    } catch {
      setGeoError('Address not found. Try a more specific address.');
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">JOUR<span>NEY</span></div>
          <div className="page-sub">// Every mile counts</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card stat-card accent-corner">
          <div className="stat-label">Miles Logged</div>
          <div><span className="stat-value accent">{fmtNum(totalMiles, 1)}</span><span className="stat-unit">mi</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total Distance</div>
          <div><span className="stat-value">{fmtNum(totalDistance, 1)}</span><span className="stat-unit">mi</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Remaining</div>
          <div><span className="stat-value">{fmtNum(remaining, 1)}</span><span className="stat-unit">mi</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Progress</div>
          <div><span className="stat-value" style={{ color: reached ? 'var(--accent)' : 'var(--text)' }}>
            {fmtNum(pct * 100, 1)}
          </span><span className="stat-unit">%</span></div>
          {reached && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', marginTop: 4 }}>🎉 DESTINATION REACHED</div>}
        </div>
      </div>

      {/* Progress bar */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontFamily: 'var(--mono)', fontSize: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--info)' }}>
            <MapPin size={12} /> {config.startName}
            <button onClick={() => startEdit('start')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', padding: 2 }}>
              <Edit2 size={11} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--warn)' }}>
            <button onClick={() => startEdit('end')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', padding: 2 }}>
              <Edit2 size={11} />
            </button>
            <Navigation size={12} /> {config.endName}
          </div>
        </div>
        <div style={{ height: 12, background: 'var(--bg)', border: '1px solid var(--border-2)', overflow: 'hidden', borderRadius: 2 }}>
          <div style={{
            height: '100%', width: `${pct * 100}%`,
            background: 'linear-gradient(90deg, #4d9fff, #c6ff3d)',
            transition: 'width 0.8s ease',
          }} />
        </div>

        {/* Edit address form */}
        {editing && (
          <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                {editing === 'start' ? 'New Start Address' : 'New Destination'}
              </div>
              <input
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applyEdit(); if (e.key === 'Escape') cancelEdit(); }}
                placeholder="e.g. 1600 Pennsylvania Ave, Washington DC"
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--accent)', padding: '9px 12px', color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, outline: 'none' }}
                autoFocus
              />
              {geoError && <div style={{ color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: 11, marginTop: 4 }}>{geoError}</div>}
            </div>
            <div style={{ display: 'flex', gap: 6, paddingTop: 22 }}>
              <button className="btn small" onClick={applyEdit} disabled={geocoding}>
                {geocoding ? '...' : <><Check size={13} /> Apply</>}
              </button>
              <button className="btn secondary small" onClick={cancelEdit}><X size={13} /> Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div ref={mapRef} style={{ height: 520, width: '100%' }} />
      </div>

      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 10, textAlign: 'center' }}>
        Path shown as straight line between coordinates. Map data © OpenStreetMap contributors.
      </div>
    </div>
  );
}
