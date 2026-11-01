import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePriva } from '@/lib/priva/store';
import { avisarAcaoDemo } from '@/lib/priva/demoAction';
import { lerContinuacao, rotuloContinuacao, type ContinuacaoReceptor as Declaracao } from '@/lib/priva/continuacaoReceptor';
import { produtosDaLinha, type RotRow } from '@/lib/priva/rot';
import { BIBLIOTECA_NORMATIVA } from '@/lib/priva/bibliotecaNormativa';
import { CitacoesAgrupadas } from './CitacoesAgrupadas';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
export function ContinuacaoReceptor({ row, rows, onSaved }: { row: RotRow; rows: RotRow[]; onSaved: () => void }) {
  const { demo } = usePriva();
  const [tipo,setTipo]=useState<Declaracao['tipo'] | ''>('');
  const [anon,setAnon]=useState(false); const [semTerceiro,setSemTerceiro]=useState(false); const [alvo,setAlvo]=useState('');
  const [busy,setBusy]=useState(false); const [erro,setErro]=useState('');
  const registrada=lerContinuacao(row.continuacao_receptor);
  const salvar=async()=>{
    if(demo) return avisarAcaoDemo();
    if(!tipo) return setErro('Escolha o tratamento pelo receptor.');
    if(tipo==='USO_EXCLUSIVO' && (!anon || !semTerceiro)) return setErro('As duas declarações são obrigatórias.');
    const [linha_id,indice]=alvo.split(':');
    setBusy(true);setErro('');
    const r=await supabase.rpc('declarar_continuacao_receptor',{_rot_id:row.id,_declaracao:{tipo,anonimizados:anon,sem_acesso_terceiro:semTerceiro,linha_id,produto_indice:Number(indice ?? -1)}});
    setBusy(false);if(r.error) return setErro(r.error.message);toast.success('Escolha registrada com hash; renove as assinaturas da linha.');onSaved();
  };
  return <div className="mt-2 space-y-2 border-t pt-2" data-testid={`continuacao-${row.codigo}`}>
    <p className="text-xs font-semibold">{rotuloContinuacao(registrada)}</p>
    {registrada && <p className="break-all text-[10px] text-muted-foreground">{registrada.em} · SHA-256 {registrada.hash}</p>}
    <select aria-label={`Tratamento do receptor ${row.codigo}`} className="w-full rounded-sm border bg-background p-2 text-xs" value={tipo} onChange={e=>{setTipo(e.target.value as Declaracao['tipo']);setAnon(false);setSemTerceiro(false);}}>
      <option value="">Escolha o tratamento pelo receptor…</option><option value="NOVO_PRT">Gerar novo PRT</option><option value="ELIMINACAO">Não gera produto — eliminação após o tratamento</option><option value="USO_EXCLUSIVO">Não gera produto — uso exclusivo com anonimização</option><option value="INCORPORACAO">Incorporação ao produto existente</option>
    </select>
    {tipo==='NOVO_PRT' && !produtosDaLinha(row).length && <p className="text-xs text-destructive">Cadastre o novo PRT ao editar esta linha antes de registrar a escolha.</p>}
    {tipo==='USO_EXCLUSIVO' && <div className="space-y-2"><Label className="flex items-start gap-2 text-xs"><Checkbox checked={anon} onCheckedChange={v=>setAnon(v===true)} />Declaro expressamente que os dados foram anonimizados.</Label><Label className="flex items-start gap-2 text-xs"><Checkbox checked={semTerceiro} onCheckedChange={v=>setSemTerceiro(v===true)} />Declaro expressamente que não há acesso por terceiro.</Label><p className="text-xs text-muted-foreground">Sem as duas declarações, esta opção não é conforme.</p></div>}
    {tipo==='INCORPORACAO' && <select aria-label={`Produto existente ${row.codigo}`} className="w-full rounded-sm border bg-background p-2 text-xs" value={alvo} onChange={e=>setAlvo(e.target.value)}><option value="">Selecione o código do produto…</option>{rows.filter(r=>r.id!==row.id).flatMap(r=>produtosDaLinha(r).map((p,i)=><option key={`${r.id}:${i}`} value={`${r.id}:${i}`}>{r.codigo} · PRT-{i+1} · {p.nome}</option>))}</select>}
    {(tipo==='USO_EXCLUSIVO'||tipo==='ELIMINACAO') && <CitacoesAgrupadas entradas={BIBLIOTECA_NORMATIVA.filter(e=>e.norma==='LGPD' && e.identificador===(tipo==='USO_EXCLUSIVO'?'art. 16, IV':'art. 16, caput'))} />}
    {erro && <p role="alert" className="text-xs text-destructive">{erro}</p>}
    <Button size="sm" variant="outline" disabled={!demo && (busy||!tipo||(tipo==='USO_EXCLUSIVO'&&(!anon||!semTerceiro)))} onClick={()=>void salvar()}>Registrar escolha do receptor</Button>
  </div>;
}