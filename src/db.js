/**
 * db.js — Supabase sync layer
 *
 * Key design decisions:
 * - All JS objects stay in camelCase throughout the app
 * - We map to/from snake_case only at the Supabase boundary
 * - Writes: localStorage first (instant), Supabase async (background)
 * - Reads: Supabase on login, merge with localStorage, localStorage wins if offline
 * - Migration: uploads existing localStorage data on first run
 */

import { supabase, hasSupabase } from './supabase';
import { storage } from './storage';

const USER_ID = 'john';
const MIGRATION_KEY = 'supabase_migrated_v2';

const now = () => new Date().toISOString();

// ── camelCase <-> snake_case mappers ──────────────────────

// Workout: JS camel -> DB snake
const workoutToDb = (w) => ({
  id:         w.id,
  user_id:    USER_ID,
  date:       w.date,
  type:       w.type,
  equipment:  w.equipment,
  calories:   w.calories   ?? 0,
  minutes:    w.minutes    ?? 0,
  miles:      w.miles      ?? 0,
  avg_hr:     w.avgHR      ?? null,
  max_hr:     w.maxHR      ?? null,
  exercises:  w.exercises  ?? null,
  notes:      w.notes      ?? null,
  created_at: w.createdAt  ?? now(),
  updated_at: now(),
});

// DB snake -> JS camel
const workoutFromDb = (r) => ({
  id:         r.id,
  date:       r.date,
  type:       r.type,
  equipment:  r.equipment,
  calories:   Number(r.calories)  || 0,
  minutes:    Number(r.minutes)   || 0,
  miles:      Number(r.miles)     || 0,
  avgHR:      r.avg_hr   != null ? Number(r.avg_hr)  : null,
  maxHR:      r.max_hr   != null ? Number(r.max_hr)  : null,
  exercises:  r.exercises ?? [],
  notes:      r.notes     ?? '',
  createdAt:  r.created_at,
  updated_at: r.updated_at,
});

// Weight
const weightToDb = (w) => ({
  id:         w.id,
  user_id:    USER_ID,
  date:       w.date,
  weight:     w.weight,
  waist:      w.waist     ?? null,
  notes:      w.notes     ?? null,
  created_at: w.createdAt ?? now(),
  updated_at: now(),
});

const weightFromDb = (r) => ({
  id:         r.id,
  date:       r.date,
  weight:     Number(r.weight),
  waist:      r.waist != null ? Number(r.waist) : null,
  notes:      r.notes ?? '',
  createdAt:  r.created_at,
  updated_at: r.updated_at,
});

// Supplement
const supplementToDb = (s) => ({
  id:         s.id,
  user_id:    USER_ID,
  date:       s.date,
  name:       s.name,
  dose:       s.dose       ?? null,
  time:       s.time       ?? null,
  notes:      s.notes      ?? null,
  created_at: s.createdAt  ?? now(),
  updated_at: now(),
});

const supplementFromDb = (r) => ({
  id:         r.id,
  date:       r.date,
  name:       r.name,
  dose:       r.dose  ?? '',
  time:       r.time  ?? '',
  notes:      r.notes ?? '',
  createdAt:  r.created_at,
  updated_at: r.updated_at,
});

// TRT log
const trtToDb = (t) => ({
  id:         t.id,
  user_id:    USER_ID,
  date:       t.date,
  dose:       t.dose      ?? null,
  unit:       t.unit      ?? null,
  compound:   t.compound  ?? null,
  site:       t.site      ?? null,
  notes:      t.notes     ?? null,
  created_at: t.createdAt ?? now(),
  updated_at: now(),
});

const trtFromDb = (r) => ({
  id:         r.id,
  date:       r.date,
  dose:       r.dose     != null ? Number(r.dose) : null,
  unit:       r.unit     ?? '',
  compound:   r.compound ?? '',
  site:       r.site     ?? '',
  notes:      r.notes    ?? '',
  createdAt:  r.created_at,
  updated_at: r.updated_at,
});

// ── Merge helper (latest updated_at wins) ─────────────────

const mergeById = (local, remote) => {
  const map = {};
  [...local, ...remote].forEach((item) => {
    const existing = map[item.id];
    if (!existing) { map[item.id] = item; return; }
    const existingTs = existing.updated_at || existing.createdAt || '0';
    const itemTs     = item.updated_at     || item.createdAt     || '0';
    if (itemTs > existingTs) map[item.id] = item;
  });
  return Object.values(map);
};

// ── Load on login ─────────────────────────────────────────

export const loadAllData = async (localData) => {
  if (!hasSupabase()) return localData;

  try {
    const [wRes, wtRes, sRes, tRes, mRes] = await Promise.all([
      supabase.from('workouts').select('*').eq('user_id', USER_ID),
      supabase.from('weights').select('*').eq('user_id', USER_ID),
      supabase.from('supplements').select('*').eq('user_id', USER_ID),
      supabase.from('trt_logs').select('*').eq('user_id', USER_ID),
      supabase.from('user_meta').select('*').eq('user_id', USER_ID).maybeSingle(),
    ]);

    // Log any errors for debugging
    if (wRes.error)  console.warn('[db] workouts fetch error:',     wRes.error.message);
    if (wtRes.error) console.warn('[db] weights fetch error:',      wtRes.error.message);
    if (sRes.error)  console.warn('[db] supplements fetch error:',  sRes.error.message);
    if (tRes.error)  console.warn('[db] trt_logs fetch error:',     tRes.error.message);
    if (mRes.error)  console.warn('[db] user_meta fetch error:',    mRes.error.message);

    const remoteWorkouts    = (wRes.data  || []).map(workoutFromDb);
    const remoteWeights     = (wtRes.data || []).map(weightFromDb);
    const remoteSupplements = (sRes.data  || []).map(supplementFromDb);
    const remoteTrtLogs     = (tRes.data  || []).map(trtFromDb);

    const merged = {
      workouts:    mergeById(localData.workouts    || [], remoteWorkouts),
      weights:     mergeById(localData.weights     || [], remoteWeights),
      supplements: mergeById(localData.supplements || [], remoteSupplements),
      trtLogs:     mergeById(localData.trtLogs     || [], remoteTrtLogs),
      profile:     localData.profile,
      challenge:   localData.challenge,
    };

    // Profile / challenge: remote wins if it exists and is newer
    const meta = mRes.data;
    if (meta?.profile) {
      const localTs  = localData.profile?._updatedAt  || '0';
      const remoteTs = meta.profile_updated_at         || '0';
      if (remoteTs > localTs) merged.profile = meta.profile;
    }
    if (meta?.challenge) {
      const localTs  = localData.challenge?._updatedAt || '0';
      const remoteTs = meta.challenge_updated_at        || '0';
      if (remoteTs > localTs) merged.challenge = meta.challenge;
    }

    return merged;
  } catch (err) {
    console.warn('[db] Load failed, falling back to localStorage:', err.message);
    return localData;
  }
};

// ── Migration ─────────────────────────────────────────────

export const migrateIfNeeded = async (localData) => {
  if (!hasSupabase()) return;
  if (storage.get(MIGRATION_KEY, false)) return;

  const hasData =
    (localData.workouts?.length    > 0) ||
    (localData.weights?.length     > 0) ||
    (localData.supplements?.length > 0) ||
    (localData.trtLogs?.length     > 0);

  if (!hasData) {
    storage.set(MIGRATION_KEY, true);
    return;
  }

  console.log('[db] Running one-time migration of localStorage → Supabase...');

  try {
    const jobs = [];

    if (localData.workouts?.length)
      jobs.push(supabase.from('workouts').upsert(
        localData.workouts.map(workoutToDb), { onConflict: 'id' }
      ));
    if (localData.weights?.length)
      jobs.push(supabase.from('weights').upsert(
        localData.weights.map(weightToDb), { onConflict: 'id' }
      ));
    if (localData.supplements?.length)
      jobs.push(supabase.from('supplements').upsert(
        localData.supplements.map(supplementToDb), { onConflict: 'id' }
      ));
    if (localData.trtLogs?.length)
      jobs.push(supabase.from('trt_logs').upsert(
        localData.trtLogs.map(trtToDb), { onConflict: 'id' }
      ));

    const results = await Promise.all(jobs);
    const errors  = results.filter((r) => r.error);
    if (errors.length) {
      errors.forEach((r) => console.warn('[db] Migration partial error:', r.error.message));
      // Don't mark done — will retry next login
      return;
    }

    await syncMetaInternal(localData.profile, localData.challenge);
    storage.set(MIGRATION_KEY, true);
    console.log('[db] Migration complete ✓');
  } catch (err) {
    console.warn('[db] Migration failed, will retry next login:', err.message);
  }
};

// Call this from Settings if migration needs a forced re-run
export const resetMigration = () => storage.remove(MIGRATION_KEY);

// ── Internal meta sync ────────────────────────────────────

const syncMetaInternal = async (profile, challenge) => {
  if (!hasSupabase()) return;
  const { error } = await supabase.from('user_meta').upsert({
    user_id:              USER_ID,
    profile:              profile   ?? null,
    challenge:            challenge ?? null,
    profile_updated_at:   now(),
    challenge_updated_at: now(),
  }, { onConflict: 'user_id' });
  if (error) console.warn('[db] Meta sync error:', error.message);
};

// ── Public write helpers ───────────────────────────────────

export const syncWorkout = async (workout) => {
  if (!hasSupabase()) return;
  const { error } = await supabase.from('workouts')
    .upsert(workoutToDb(workout), { onConflict: 'id' });
  if (error) console.warn('[db] syncWorkout error:', error.message);
};

export const deleteWorkout = async (id) => {
  if (!hasSupabase()) return;
  const { error } = await supabase.from('workouts')
    .delete().eq('id', id).eq('user_id', USER_ID);
  if (error) console.warn('[db] deleteWorkout error:', error.message);
};

export const syncWeight = async (weight) => {
  if (!hasSupabase()) return;
  const { error } = await supabase.from('weights')
    .upsert(weightToDb(weight), { onConflict: 'id' });
  if (error) console.warn('[db] syncWeight error:', error.message);
};

export const deleteWeight = async (id) => {
  if (!hasSupabase()) return;
  const { error } = await supabase.from('weights')
    .delete().eq('id', id).eq('user_id', USER_ID);
  if (error) console.warn('[db] deleteWeight error:', error.message);
};

export const syncSupplement = async (supplement) => {
  if (!hasSupabase()) return;
  const { error } = await supabase.from('supplements')
    .upsert(supplementToDb(supplement), { onConflict: 'id' });
  if (error) console.warn('[db] syncSupplement error:', error.message);
};

export const deleteSupplement = async (id) => {
  if (!hasSupabase()) return;
  const { error } = await supabase.from('supplements')
    .delete().eq('id', id).eq('user_id', USER_ID);
  if (error) console.warn('[db] deleteSupplement error:', error.message);
};

export const syncTrtLog = async (log) => {
  if (!hasSupabase()) return;
  const { error } = await supabase.from('trt_logs')
    .upsert(trtToDb(log), { onConflict: 'id' });
  if (error) console.warn('[db] syncTrtLog error:', error.message);
};

export const deleteTrtLog = async (id) => {
  if (!hasSupabase()) return;
  const { error } = await supabase.from('trt_logs')
    .delete().eq('id', id).eq('user_id', USER_ID);
  if (error) console.warn('[db] deleteTrtLog error:', error.message);
};

export const syncProfile = async (profile, challenge) => {
  await syncMetaInternal(profile, challenge);
};

export const clearAllRemote = async () => {
  if (!hasSupabase()) return;
  try {
    await Promise.all([
      supabase.from('workouts').delete().eq('user_id', USER_ID),
      supabase.from('weights').delete().eq('user_id', USER_ID),
      supabase.from('supplements').delete().eq('user_id', USER_ID),
      supabase.from('trt_logs').delete().eq('user_id', USER_ID),
      supabase.from('user_meta').delete().eq('user_id', USER_ID),
    ]);
    storage.remove(MIGRATION_KEY);
  } catch (err) {
    console.warn('[db] clearAllRemote error:', err.message);
  }
};
