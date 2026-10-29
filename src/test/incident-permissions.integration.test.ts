import { createClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

const sessionText = process.env['LOVABLE_BROWSER_SUPABASE_SESSION_JSON'];
const url = import.meta.env['VITE_SUPABASE_URL'];
const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
describe.skipIf(!sessionText || !url || !key)('authenticated incident permissions', () => {
  it('allows declaring an incident and records step evidence through RPC', async () => {
    if (!sessionText) throw new Error('Authenticated test session unavailable');
    const session = JSON.parse(sessionText) as { access_token: string };
    const client = createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${session.access_token}` } } });
    const company = await client.from('workspace_empresa').select('cnpj').limit(1).single();
    expect(company.error).toBeNull();
    if (!company.data) throw new Error('No authorized company for integration test');
    const inserted = await client.from('incidentes_seguranca').insert({ empresa_cnpj: company.data.cnpj }).select('id').single();
    expect(inserted.error).toBeNull();
    if (!inserted.data) throw new Error('Incident declaration failed');
    const id = inserted.data.id;
    try {
      const step = await client.rpc('registrar_etapa_incidente', { _incidente: id, _etapa: 1, _concluida: true });
      expect(step.error).toBeNull();
      const read = await client.from('incidentes_seguranca').select('passos,etapas_registro').eq('id', id).single();
      expect(read.data?.passos[0]).toBe(true);
      const evidence = read.data?.etapas_registro as Record<string, { data: string; responsavel: string }>;
      expect(evidence['1']?.responsavel).toMatch(/^[0-9a-f-]{36}$/);
      expect(Number.isFinite(Date.parse(evidence['1']?.data ?? ''))).toBe(true);
      const close = await client.rpc('encerrar_incidente', { _incidente: id });
      expect(close.error).toBeNull();
      expect(close.data).toMatchObject({ encerrado: false });
    } finally {
      const removed = await client.from('incidentes_seguranca').delete().eq('id', id);
      expect(removed.error).toBeNull();
    }
  }, 20000);
});