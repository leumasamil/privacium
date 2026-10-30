import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
const sessionText = process.env['LOVABLE_BROWSER_SUPABASE_SESSION_JSON'];
const url = import.meta.env['VITE_SUPABASE_URL'];
const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
describe.skipIf(!sessionText || !url || !key)('enquadramento autenticado no banco', () => {
  it('calcula ambos os portes e preserva assinatura/hash na trilha', async () => {
    if (!sessionText) throw new Error('Sessão ausente');
    const session = JSON.parse(sessionText) as { access_token: string };
    const db = createClient(url, key, { auth: { persistSession:false }, global: { headers: { Authorization:`Bearer ${session.access_token}` } } });
    const criterios = {grupoGrande:false,receitaAcimaTeto:false,tipo:'ME',titulares:100,infraLimitada:false,descricaoInfra:'',sensivelLargaEscala:false,altoRisco:false,menoresAltoRisco:false};
    const pequeno = await db.rpc('calcular_porte_agente',{_criterios:criterios}); expect(pequeno.error).toBeNull(); expect(pequeno.data).toBe('PEQUENO');
    const grande = await db.rpc('calcular_porte_agente',{_criterios:{...criterios,titulares:10001}}); expect(grande.error).toBeNull(); expect(grande.data).toBe('COMPLETO');
    const sa = await db.rpc('calcular_porte_agente',{_criterios:{...criterios,tipo:'SA'}}); expect(sa.error).toBeNull(); expect(sa.data).toBe('COMPLETO');
    const empresa = await db.from('workspace_empresa').select('cnpj').eq('razao_social','TESTE DE ACEITAÇÃO — Enquadramento Privacium (cenográfico)').single(); expect(empresa.error).toBeNull();
    if (!empresa.data) throw new Error('Empresa de teste ausente');
    const rows = await db.from('enquadramentos_agente').select('*').eq('empresa_cnpj',empresa.data.cnpj).order('assinado_em',{ascending:false}); expect(rows.error).toBeNull();
    expect(rows.data?.some(r=>r.porte==='PEQUENO')).toBe(true); expect(rows.data?.some(r=>r.porte==='COMPLETO')).toBe(true);
    const row=rows.data?.[0]; if (!row) throw new Error('Declaração ausente'); expect(row.hash_sha256).toMatch(/^[a-f0-9]{64}$/);
    const trilha = await db.from('trilha_auditoria_sistema').select('detail,hash,role,op').eq('cnpj',empresa.data.cnpj).eq('target','enquadramentos_agente').like('detail',`%${row.hash_sha256}%`).single(); expect(trilha.error).toBeNull(); expect(trilha.data?.role).toBe('DPO_OPERACIONAL'); expect(trilha.data?.op).toBe('INSERT'); expect(trilha.data?.hash).toMatch(/^[a-f0-9]{64}$/);
    const prazo = await db.rpc('prazo_agente_anpd',{_cnpj:empresa.data.cnpj}); expect(prazo.error).toBeNull(); expect(prazo.data).toBe(6);
    const forged = await db.from('enquadramentos_agente').insert({...row,id:crypto.randomUUID(),porte:'PEQUENO'}); expect(forged.error).not.toBeNull();
  },30000);
});