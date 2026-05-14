import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'YOUR_URL',
  import.meta.env.VITE_SUPABASE_KEY || 'YOUR_KEY'
);

const throwIfError = (error) => {
  if (error) throw error;
};

const cleanNames = (rows, keys) => {
  return (rows || [])
    .map((row) => {
      for (const key of keys) {
        const value = row?.[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
      }
      return '';
    })
    .filter(Boolean);
};

const insertWithFallback = async (table, primaryColumn, fallbackColumn, value) => {
  let result = await sb.from(table).insert({ [primaryColumn]: value });
  if (result.error && fallbackColumn && result.error.code === 'PGRST204') {
    result = await sb.from(table).insert({ [fallbackColumn]: value });
  }
  throwIfError(result.error);
};

const deleteWithFallback = async (table, primaryColumn, fallbackColumn, value) => {
  let result = await sb.from(table).delete().eq(primaryColumn, value);
  if (result.error && fallbackColumn && result.error.code === 'PGRST204') {
    result = await sb.from(table).delete().eq(fallbackColumn, value);
  }
  throwIfError(result.error);
};

export const DB = {
  getWorkers: async () => {
    const { data, error } = await sb.from('workers').select('*');
    throwIfError(error);
    return cleanNames(data, ['name', 'worker_name']);
  },
  getSites: async () => {
    const { data, error } = await sb.from('sites').select('*');
    throwIfError(error);
    return cleanNames(data, ['name', 'site_name']);
  },
  getRecords: async () => {
    const { data, error } = await sb.from('records').select('*').order('date', { ascending: false });
    throwIfError(error);
    return data || [];
  },
  addWorker: async (name) => { await insertWithFallback('workers', 'name', 'worker_name', name); },
  delWorker: async (name) => { await deleteWithFallback('workers', 'name', 'worker_name', name); },
  addSite: async (name) => { await insertWithFallback('sites', 'name', 'site_name', name); },
  delSite: async (name) => { await deleteWithFallback('sites', 'name', 'site_name', name); },
  addRecord: async (r) => { const { error } = await sb.from('records').insert(r); throwIfError(error); },
  delRecord: async (id) => { const { error } = await sb.from('records').delete().eq('id', id); throwIfError(error); },
  updateRecord: async (id, updates) => { const { error } = await sb.from('records').update(updates).eq('id', id); throwIfError(error); },
  checkDuplicate: async (workerName, date) => {
    const { data, error } = await sb.from('records').select('id').eq('worker_name', workerName).eq('date', date);
    throwIfError(error);
    return (data || []).length > 0;
  },
};
