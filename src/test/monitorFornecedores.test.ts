import { describe, expect, it } from 'vitest';
import { correspondenciaForte, extrairFornecedores, cooldownRestante, decisaoValida } from '@/lib/priva/monitorFornecedores';
import type { VazamentoFornecedor } from '@/lib/priva/monitorFornecedores';
import { readFileSync } from 'node:fs';
describe('Monitor conservador', () => {
 const breach: VazamentoFornecedor = { Name:'Adobe',Title:'Adobe',Domain:'adobe.com',BreachDate:'2013-10-04',PwnCount:100,DataClasses:['Email addresses'] };
 it('aceita nome exato normalizado sem S.A./Ltda',()=>{ expect(correspondenciaForte('Adobe S.A.',breach)).toBe(true); expect(correspondenciaForte('Adobe Ltda',breach)).toBe(true); });
 it('aceita domínio exato e rejeita subdomínio ou nome parecido',()=>{ expect(correspondenciaForte('https://www.adobe.com',breach)).toBe(true); expect(correspondenciaForte('notadobe.com',breach)).toBe(false); expect(correspondenciaForte('Adobe Consulting',breach)).toBe(false); expect(correspondenciaForte('adobe.com.evil.org',breach)).toBe(false); });
 it('não alerta para infraestrutura genérica',()=>expect(correspondenciaForte('Servidor Local',{...breach,Name:'Servidor Local',Title:'Servidor Local'})).toBe(false));
 it('extrai apenas referências locais e mantém vínculo de origem',()=>{ const f=extrairFornecedores([{id:'rot',infraestrutura:'Adobe',salvaguardas:['Fornecedor: Dropbox']}],[{id:'ativo',responsavel:'Adobe Ltda',localizacao:'adobe.com',provedor_nuvem:null,descricao:'Endpoint',estrutura_pasta:null}]); expect(f).toContainEqual({nome:'Adobe',processo_rot_id:'rot',ativo_id:null,campo:'12'}); expect(f).toContainEqual({nome:'adobe.com',processo_rot_id:null,ativo_id:'ativo',campo:'localização'}); });
 it('cooldown é uma hora inclusive entre usuários',()=>{ const t=Date.parse('2026-10-29T00:00:00Z'); expect(cooldownRestante('2026-10-29T00:00:00Z',t+3599999)).toBe(1); expect(cooldownRestante('2026-10-29T00:00:00Z',t+3600000)).toBe(0); });
 it('descarte exige justificativa e impacto próprio exige titulares confirmados',()=>{ expect(decisaoValida('descartado','','sim')).toBe(false); expect(decisaoValida('descartado','Não há impacto','nao')).toBe(true); expect(decisaoValida('confirmado_impacto','Confirmado','nao')).toBe(false); expect(decisaoValida('confirmado_impacto','Confirmado','sim')).toBe(true); });
 it('monitor não alimenta documentos, progresso ou auditoria com fatos externos',()=>{
   for(const p of ['src/lib/priva/pdf.ts','src/lib/priva/pendencias.ts','src/lib/priva/estadoIncidente.ts','src/components/priva/ui.tsx']) expect(readFileSync(p,'utf8')).not.toMatch(/monitorFornecedores|monitor_fornecedores|AlertaFornecedor/);
   const sql=readFileSync('drizzle/migrations/0024_monitor_fornecedores_informativo.sql','utf8');
   const auditorias=sql.split('\n').filter(l=>l.includes('PERFORM public.registrar_trilha'));
   expect(auditorias.length).toBe(3);
   auditorias.forEach(l=>expect(l).not.toMatch(/fornecedor_nome|data_vazamento|contas_afetadas|tipos_dados|_justificativa|url_referencia/));
 });
});