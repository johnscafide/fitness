// Simple localStorage wrapper with JSON encoding
const PREFIX = 'hhf_';

export const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(PREFIX + key);
  },
  exportAll() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) {
        try {
          data[k.replace(PREFIX, '')] = JSON.parse(localStorage.getItem(k));
        } catch {}
      }
    }
    return data;
  },
  importAll(obj) {
    Object.keys(obj).forEach((k) => {
      localStorage.setItem(PREFIX + k, JSON.stringify(obj[k]));
    });
  },
};

// Date helpers
export const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const daysBetween = (a, b) => {
  const d1 = new Date(a + 'T00:00:00');
  const d2 = new Date(b + 'T00:00:00');
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
};

export const addDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// Format numbers nicely
export const fmtNum = (n, decimals = 0) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// Pace formatting (min:sec per mile)
export const fmtPace = (minutes, miles) => {
  if (!minutes || !miles) return '—';
  const paceMin = minutes / miles;
  const m = Math.floor(paceMin);
  const s = Math.round((paceMin - m) * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

// ID generator
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Streak calculator
export const calcStreak = (workouts) => {
  if (!workouts.length) return { current: 0, longest: 0 };

  const dates = [...new Set(workouts.map((w) => w.date))].sort().reverse();

  // Current streak from today/yesterday backwards
  const today = todayISO();
  let current = 0;
  let cursor = today;
  // allow up to 1 day gap (if today not logged but yesterday was, still on streak)
  if (dates[0] !== today && daysBetween(dates[0], today) > 1) {
    current = 0;
  } else {
    cursor = dates[0];
    current = 1;
    for (let i = 1; i < dates.length; i++) {
      if (daysBetween(dates[i], cursor) === 1) {
        current++;
        cursor = dates[i];
      } else {
        break;
      }
    }
  }

  // Longest streak ever
  let longest = 0;
  let run = 1;
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      run = 1;
    } else if (daysBetween(dates[i], dates[i - 1]) === -1) {
      run++;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
  }

  return { current, longest };
};

// CSV export
export const toCSV = (rows, headers) => {
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const head = headers.map((h) => esc(h.label)).join(',');
  const body = rows.map((r) => headers.map((h) => esc(r[h.key])).join(',')).join('\n');
  return head + '\n' + body;
};

export const downloadFile = (filename, content, mime = 'text/csv') => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
