import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 💡 NEW: Background client for creating accounts without logging the Admin out!
export const authAdminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// ─── DB HELPERS (all async) ───────────────────────────────────────────────────
export const db = {
  get: async (table) => {
    const { data, error } = await supabase.from(table).select('*');
    if (error) { console.error(`db.get(${table}):`, error); return []; }
    return data ?? [];
  },

  getWhere: async (table, column, value) => {
    const { data, error } = await supabase.from(table).select('*').eq(column, value);
    if (error) { console.error(`db.getWhere(${table}):`, error); return []; }
    return data ?? [];
  },

  getOne: async (table, column, value) => {
    const { data, error } = await supabase.from(table).select('*').eq(column, value).maybeSingle();;
    if (error) return null;
    return data;
  },

  insert: async (table, row) => {
    const { data, error } = await supabase.from(table).insert(row).select().single();
    if (error) { console.error(`db.insert(${table}):`, error); return null; }
    return data;
  },

  upsert: async (table, row) => {
    const { data, error } = await supabase.from(table).upsert(row).select().single();
    if (error) { console.error(`db.upsert(${table}):`, error); return null; }
    return data;
  },

  update: async (table, id, updates) => {
    const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
    if (error) { console.error(`db.update(${table}):`, error); return null; }
    return data;
  },

  del: async (table, id) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { console.error(`db.del(${table}):`, error); }
  },

  delWhere: async (table, column, value) => {
    const { error } = await supabase.from(table).delete().eq(column, value);
    if (error) { console.error(`db.delWhere(${table}):`, error); }
  },
};

// ─── ID GENERATOR ─────────────────────────────────────────────────────────────
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
export const makeSlug = () => Math.random().toString(36).slice(2, 8).toUpperCase();