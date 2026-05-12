/**
 * db.js — Supabase sync layer
 *
 * Strategy:
 *  - All data belongs to a single hardcoded user_id ('john')
 *  - Writes go to localStorage immediately (instant UI), then sync to Supabase async
 *  - On app load, pulls from Supabase and merges with localStorage
 *    using updated_at timestamps so the most recent record always wins
 *  - If Supabase is unreachable, localStorage data is used as fallback
 *  - First-time migration: detects existing localStorage data and upserts it all
 */

import { supabase, hasSupabase } from './supabase';
import { storage } from './storage';

const USER_ID = 'john';
const MIGRATION_KEY = 'supabase_migrated_v1';

// ── Helpers ────────────────────────────────────────────────

const now = () => new Date().toISOString();

// Merge two arrays by id, keeping the record with the latest updated_at.
// Items without updated_at are treated as older.
const mergeById = (local, remote) => {
  const map = {};
  [...local, ...remote].forEach((item) => {
    const existing = map[item.id];
    if (!existing) { map[item.id] = item; return; }
    const existingTs = existing.updated_at || existing.createdAt || '0';
    const itemTs = item.updated_at || item.createdAt || '0';
    if (itemTs > existingTs) map[item.id] = item;
  });
  return Object.values(map);
};

// ── Load (called once on app start) ───────────────────────

export const loadAllData = async (localData) => {
  if (!hasSupabase()) return localData; // offline mode

  try {
    const [workouts, weights, supplements, trtLogs, meta] = await Promise.all([
      supabase.from('workouts').select('*').eq('user_id', USER_ID),
      supabase.from('weights').select('*').eq('user_id', USER_ID),
      supabase.from('supplements').select('*').eq('user_id', USER_ID),
      supabase.from('trt_logs').select('*').eq('user_id', USER_ID),
      supabase.from('user_meta').select('*').eq('user_id', USER_ID).single(),
    ]);

    // Merge remote + local for array data (id-based dedup)
    const merged = {
      workouts:    mergeById(localData.workouts    || [], workouts.data    || []),
      weights:     mergeById(localData.weights     || [], weights.data     || []),
      supplements: mergeById(localData.supplements || [], supplements.data || []),
      trtLogs:     mergeById(localData.trtLogs     || [], trtLogs.data     || []),
      profile:  localData.profile,
      challenge: localData.challenge,
    };

    // For profile/challenge: remote wins if it exists and is newer
    if (meta.data) {
      const remote = meta.data;
      if (remote.profile) {
        const localTs = localData.profile?._updatedAt || '0';
        const remoteTs = remote.profile_updated_at || '0';
        if (remoteTs > localTs) merged.profile = remote.profile;
      }
      if (remote.challenge) {
        const localTs = localData.challenge?._updatedAt || '0';
        const remoteTs = remote.challenge_updated_at || '0';
        if (remoteTs > localTs) merged.challenge = remote.challenge;
      }
    }

    return merged;
  } catch (err) {
    console.warn('[db] Load failed, using localStorage:', err.message);
    return localData;
  }
};

// ── Migration (run once to upload existing localStorage data) ─

export const migrateIfNeeded = async (localData) => {
  if (!hasSupabase()) return;
  if (storage.get(MIGRATION_KEY, false)) return;

  const hasLocalData =
    (localData.workouts?.length > 0) ||
    (localData.weights?.length > 0) ||
    (localData.supplements?.length > 0) ||
    (localData.trtLogs?.length > 0);

  if (!hasLocalData) {
    // No local data to migrate — just mark done
    storage.set(MIGRATION_KEY, true);
    return;
  }

  console.log('[db] Migrating localStorage data to Supabase...');

  try {
    const stamp = (items) => items.map((i) => ({ ...i, user_id: USER_ID, updated_at: i.createdAt || now() }));

    await Promise.all([
      localData.workouts?.length    && supabase.from('workouts').upsert(stamp(localData.workouts), { onConflict: 'id' }),
      localData.weights?.length     && supabase.from('weights').upsert(stamp(localData.weights), { onConflict: 'id' }),
      localData.supplements?.length && supabase.from('supplements').upsert(stamp(localData.supplements), { onConflict: 'id' }),
      localData.trtLogs?.length     && supabase.from('trt_logs').upsert(stamp(localData.trtLogs), { onConflict: 'id' }),
    ].filter(Boolean));

    // Save profile + challenge into user_meta
    await syncMeta(localData.profile, localData.challenge);

    storage.set(MIGRATION_KEY, true);
    console.log('[db] Migration complete.');
  } catch (err) {
    console.warn('[db] Migration failed (will retry next load):', err.message);
  }
};

// ── Sync helpers ───────────────────────────────────────────

const syncMeta = async (profile, challenge) => {
  if (!hasSupabase()) return;
  try {
    await supabase.from('user_meta').upsert({
      user_id: USER_ID,
      profile,
      challenge,
      profile_updated_at: now(),
      challenge_updated_at: now(),
    }, { onConflict: 'user_id' });
  } catch (err) {
    console.warn('[db] Meta sync failed:', err.message);
  }
};

// ── Write helpers (called after each state update) ─────────

export const syncWorkout = async (workout) => {
  if (!hasSupabase()) return;
  try {
    await supabase.from('workouts').upsert(
      { ...workout, user_id: USER_ID, updated_at: now() },
      { onConflict: 'id' }
    );
  } catch (err) { console.warn('[db] Workout sync failed:', err.message); }
};

export const deleteWorkout = async (id) => {
  if (!hasSupabase()) return;
  try {
    await supabase.from('workouts').delete().eq('id', id).eq('user_id', USER_ID);
  } catch (err) { console.warn('[db] Workout delete failed:', err.message); }
};

export const syncWeight = async (weight) => {
  if (!hasSupabase()) return;
  try {
    await supabase.from('weights').upsert(
      { ...weight, user_id: USER_ID, updated_at: now() },
      { onConflict: 'id' }
    );
  } catch (err) { console.warn('[db] Weight sync failed:', err.message); }
};

export const deleteWeight = async (id) => {
  if (!hasSupabase()) return;
  try {
    await supabase.from('weights').delete().eq('id', id).eq('user_id', USER_ID);
  } catch (err) { console.warn('[db] Weight delete failed:', err.message); }
};

export const syncSupplement = async (supplement) => {
  if (!hasSupabase()) return;
  try {
    await supabase.from('supplements').upsert(
      { ...supplement, user_id: USER_ID, updated_at: now() },
      { onConflict: 'id' }
    );
  } catch (err) { console.warn('[db] Supplement sync failed:', err.message); }
};

export const deleteSupplement = async (id) => {
  if (!hasSupabase()) return;
  try {
    await supabase.from('supplements').delete().eq('id', id).eq('user_id', USER_ID);
  } catch (err) { console.warn('[db] Supplement delete failed:', err.message); }
};

export const syncTrtLog = async (log) => {
  if (!hasSupabase()) return;
  try {
    await supabase.from('trt_logs').upsert(
      { ...log, user_id: USER_ID, updated_at: now() },
      { onConflict: 'id' }
    );
  } catch (err) { console.warn('[db] TRT sync failed:', err.message); }
};

export const deleteTrtLog = async (id) => {
  if (!hasSupabase()) return;
  try {
    await supabase.from('trt_logs').delete().eq('id', id).eq('user_id', USER_ID);
  } catch (err) { console.warn('[db] TRT delete failed:', err.message); }
};

export const syncProfile = async (profile, challenge) => {
  await syncMeta(profile, challenge);
};

// ── Bulk clear (Settings "clear all") ─────────────────────

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
  } catch (err) { console.warn('[db] Clear failed:', err.message); }
};
