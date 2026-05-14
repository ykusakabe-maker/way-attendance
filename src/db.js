import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'YOUR_URL',
  import.meta.env.VITE_SUPABASE_KEY || 'YOUR_KEY'
);

export const DB = {
  getWorkers: async () => { const { data } = await sb.from('workers').select('name').order('id'); return (data || []).map(r => r.name); },
  getSites: async () => { const { data } = await sb.from('sites').select('name').order('id'); return (data || []).map(r => r.name); },
  getRecords: async () => { const { data } = await sb.from('records').select('*').order('date', { ascending: false }); return data || []; },
  addWorker: async (name) => { await sb.from('workers').insert({ name }); },
  delWorker: async (name) => { await sb.from('workers').delete().eq('name', name); },
  addSite: async (name) => { await sb.from('sites').insert({ name }); },
  delSite: async (name) => { await sb.from('sites').delete().eq('name', name); },
  addRecord: async (r) => { await sb.from('records').insert(r); },
  delRecord: async (id) => { await sb.from('records').delete().eq('id', id); },
  updateRecord: async (id, updates) => { await sb.from('records').update(updates).eq('id', id); },
  checkDuplicate: async (workerName, date) => { const { data } = await sb.from('records').select('id').eq('worker_name', workerName).eq('date', date); return (data || []).length > 0; },
};
