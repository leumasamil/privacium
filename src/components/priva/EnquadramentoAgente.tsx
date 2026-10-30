import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Panel, Tag } from './ui';
import { usePriva } from '@/lib/priva/store';
import { useEnquadramento } from '@/lib/priva/useEnquadramento';
import { calcularPorte, CRITERIOS_DEMO, criteriosSchema, FUNDAMENTO_PORTE, rotuloPorte, travaPorte, type CriteriosPorte } from '@/lib/priva/enquadramento';
import { FONTE_LGPD, LITERAL_ART5_VI, LITERAL_ART5_VII, PAPEIS_AGENTE, ROTULO_PAPEL } from '@/lib/priva/rot';
import { toast } from 'sonner';
import { avisarAcaoDemo } from '@/lib/priva/demoAction';
const inicial: CriteriosPorte = { grupoGrande: false, receitaAcimaTeto: false, tipo: 'ME', titulares: 0, infraLimitada: false, descricaoInfra: '', sensivelLargaEscala: false, altoRisco: false, menoresAltoRisco: false, papelAgente: 'CONTROLADOR' };
const perguntas = [ ['grupoGrande', 'Faz parte de grupo econômico com receita global acima do teto aplicável?'], ['receitaAcimaTeto', 'Receita bruta anual do agente acima do teto aplicável?'], ['infraLimitada', 'Infraestrutura limitada?'], ['sensivelLargaEscala', 'Dado pessoal sensível em larga escala?'], ['altoRisco', 'Tratamento de alto risco (critério geral e específico do art. 4º)?'], ['menoresAltoRisco', 'Dado pessoal de crianças e adolescentes com perfil de risco alto?'] ] as const;
export function EnquadramentoAgente() {
  const { cnpj, enterprise, demo, roles, refreshAudit, demoPorte, setDemoPorte } = usePriva();
  const e = useEnquadramento();
  const [c, setC] = useState<CriteriosPorte>(inicial);
  const [erro, setErro] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { setC(demo ? CRITERIOS_DEMO[demoPorte] : e.declaracao ? e.declaracao.criterios as CriteriosPorte : inicial); setErro(''); }, [cnpj, e.declaracao?.id, demo, demoPorte]);
  const valida = criteriosSchema.safeParse(c);
  const porte = valida.success ? calcularPorte(c) : null;
  const trava = valida.success ? travaPorte(c, enterprise) : null;
  return <Panel id="enquadramento" title="Enquadramento do agente">
    {demo && <div className="mb-4"><Label htmlFor="cenario-porte">Cenário demonstrativo de enquadramento</Label><select id="cenario-porte" value={demoPorte} onChange={event => setDemoPorte(event.target.value === 'PEQUENO' ? 'PEQUENO' : 'COMPLETO')} className="mt-1 w-full rounded-sm border bg-background p-2 text-sm"><option value="COMPLETO">Médio/grande porte — cenográfico</option><option value="PEQUENO">Pequeno porte — cenográfico</option></select></div>}
    <p className="mb-4 text-xs text-muted-foreground">{FUNDAMENTO_PORTE}. Alto risco: art. 4º. Teto geral de receita: R$ 4.800.000/ano (LC 123/2006, art. 3º, II); startups: R$ 16.000.000/ano (LC 182/2021, art. 4º). S.A. e mais de 10 mil titulares/mês são gatilhos conservadores do método.</p>
    <form className="space-y-4" onSubmit={async event => {
      event.preventDefault(); if (demo) return avisarAcaoDemo();
      if (!valida.success) return setErro(valida.error.issues[0]?.message ?? 'Critérios inválidos');
      if (trava) return setErro(trava);
      setBusy(true); setErro('');
      try { await e.assinar(c); await refreshAudit(); toast.success('Declaração assinada pelo DPO e registrada na trilha.'); }
      catch (err) { setErro(err instanceof Error ? err.message : 'Não foi possível assinar a declaração.'); }
      finally { setBusy(false); }
    }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1"><Label htmlFor="porte-tipo">Tipo societário / enquadramento empresarial</Label><select id="porte-tipo" className="w-full rounded-sm border bg-background p-2 text-sm" value={c.tipo} onChange={v => setC({ ...c, tipo: v.target.value as CriteriosPorte['tipo'] })}>{[['ME','ME'],['EPP','EPP'],['LTDA','LTDA'],['SA','S.A.'],['ASSOCIACAO','Associação'],['OUTRO','Outro']].map(([v,t]) => <option key={v} value={v}>{t}</option>)}</select></div>
        <div className="space-y-1"><Label htmlFor="porte-titulares">Número de titulares/mês</Label><Input id="porte-titulares" type="number" min="0" step="1" value={c.titulares} onChange={v => setC({ ...c, titulares: Number(v.target.value) })} /></div>
        <div className="space-y-1 sm:col-span-2" data-testid="papel-agente-bloco1">
          <Label htmlFor="papel-agente">Papel do agente neste tratamento — LGPD art. 5º, VI e VII</Label>
          <select id="papel-agente" className="w-full rounded-sm border bg-background p-2 text-sm" value={c.papelAgente} onChange={v => setC({ ...c, papelAgente: v.target.value as CriteriosPorte['papelAgente'] })}>
            {PAPEIS_AGENTE.map((p) => <option key={p} value={p}>{ROTULO_PAPEL[p]}</option>)}
          </select>
          <p className="text-[11px] text-muted-foreground">Art. 5º, VI: "{LITERAL_ART5_VI}". Art. 5º, VII: "{LITERAL_ART5_VII}". Fonte: {FONTE_LGPD}. O papel escolhido aqui é o padrão herdado por cada linha do ROT (Bloco 2), editável por linha.</p>
        </div>
        {perguntas.map(([k,t]) => <Label key={k} className="flex items-start gap-3 leading-relaxed"><Checkbox checked={c[k]} onCheckedChange={v => setC({ ...c, [k]: v === true })} />{t}</Label>)}
        {c.infraLimitada && <div className="space-y-1 sm:col-span-2"><Label htmlFor="porte-infra">Descrição da infraestrutura limitada</Label><Textarea id="porte-infra" maxLength={2000} value={c.descricaoInfra} onChange={v => setC({ ...c, descricaoInfra: v.target.value })} /></div>}
      </div>
      <p className="text-sm" data-testid="resultado-porte"><b>Resultado calculado:</b> {trava ? 'Pequeno porte bloqueado — regime completo obrigatório' : porte ? rotuloPorte(porte) : 'Preencha os critérios.'}</p>
      {(erro || trava) && <p role="alert" className="text-sm text-destructive">{erro || trava}</p>}
      {e.isError && <p role="alert">Não foi possível consultar a declaração vigente.</p>}
      {e.declaracao && <div className="space-y-1 text-xs"><Tag tone="success">Declaração assinada pelo DPO · PI-01</Tag><p>{new Date(e.declaracao.assinado_em).toLocaleString('pt-BR')}</p><p className="break-all font-mono">SHA-256 {e.declaracao.hash_sha256}</p></div>}
      <Button type="submit" disabled={!demo && (busy || !roles.includes('DPO_OPERACIONAL'))}>{busy ? 'Registrando…' : e.declaracao ? 'Assinar reenquadramento como DPO (simulado)' : 'Assinar declaração como DPO (simulado)'}</Button>
    </form>
  </Panel>;
}