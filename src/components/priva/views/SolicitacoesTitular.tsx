import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { usePriva } from '@/lib/priva/store';
import { DIREITOS, estadoPrazo, NOTA_PRAZO_METODO, tipoPrazo } from '@/lib/priva/titulares';
import { BIBLIOTECA_NORMATIVA } from '@/lib/priva/bibliotecaNormativa';
import { avisarAcaoDemo } from '@/lib/priva/demoAction';
import { OPCOES_PRT_DEMO, RESULTADO_BUSCA_DEMO, solicitacoesDemo } from '@/lib/priva/demoTitulares';
import { CitacoesAgrupadas } from '../CitacoesAgrupadas';
import { PageHeader, Panel, Tag } from '../ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type Pedido = Database['public']['Tables']['solicitacoes_titular']['Row'];
type Resultado = Database['public']['Functions']['localizar_titular']['Returns'][number];
const STATUS = ['ABERTA', 'EM_ANALISE', 'ENCAMINHADA_CONTROLADOR', 'RESPONDIDA', 'NEGADA'];
const selectClass = 'w-full rounded-sm border bg-background p-2 text-sm';
export function SolicitacoesTitular() {
  const { cnpj, demo } = usePriva();
  const qc = useQueryClient();
  const [identificador, setIdentificador] = useState('');
  const [tipo, setTipo] = useState('CPF');
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [consultou, setConsultou] = useState(false);
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);
  const [direito, setDireito] = useState('I');
  const [canal, setCanal] = useState('E-mail');
  const [descricao, setDescricao] = useState('');
  const [recebimento, setRecebimento] = useState(new Date().toISOString().slice(0,10));
  const [produto, setProduto] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [filtro, setFiltro] = useState('TODAS');
  const [prazoFiltro, setPrazoFiltro] = useState('TODOS');
  const [negando, setNegando] = useState<string | null>(null);
  const [fundamentoId, setFundamentoId] = useState('');
  const [fundamento, setFundamento] = useState('');
  useEffect(() => { setIdentificador(''); setResultados([]); setConsultou(false); setProduto(''); setNegando(null); setErro(''); }, [cnpj]);
  const empresaQ = useQuery({ queryKey: ['empresa-titulares', cnpj], enabled: !!cnpj && !demo, queryFn: async () => {
    const r = await supabase.from('empresas').select('id').eq('cnpj', cnpj ?? '').single(); if (r.error) throw r.error; return r.data;
  }});
  const empresaId = empresaQ.data?.id;
  const pedidosQ = useQuery({ queryKey: ['solicitacoes_titular', empresaId], enabled: !!empresaId && !demo, queryFn: async () => {
    const r = await supabase.from('solicitacoes_titular').select('*').eq('empresa_id', empresaId ?? '').order('criado_em', { ascending: false }); if (r.error) throw r.error; return r.data;
  }});
  const rotQ = useQuery({ queryKey: ['rot-titulares', cnpj], enabled: !!cnpj && !demo, queryFn: async () => {
    const r = await supabase.from('registro_operacoes').select('id,codigo,produtos_tratamento,papel_agente').eq('empresa_cnpj', cnpj ?? '').is('excluido_em',null).eq('removida_do_dossie',false); if(r.error) throw r.error; return r.data;
  }});
  const bibliotecaQ = useQuery({ queryKey: ['biblioteca-titulares'], enabled: !demo, queryFn: async () => {
    const r = await supabase.from('biblioteca_normativa').select('*').eq('status','VERIFICADA').in('categoria',['REGIME_GERAL','LEI_ESPECIAL_SETORIAL']);if(r.error) throw r.error; return r.data;
  }});
  const executar = async (fn: () => Promise<void>) => {
    if(demo) return avisarAcaoDemo(); setBusy(true); setErro('');
    try { await fn(); } catch(e) { setErro(e instanceof Error ? e.message : 'Não foi possível concluir.'); } finally { setBusy(false); }
  };
  const buscar = () => {
    if(demo) { setResultados(identificador.trim() ? RESULTADO_BUSCA_DEMO : []); setConsultou(true); return; }
    void executar(async () => {
      if(!empresaId || !identificador.trim()) throw new Error('Informe o identificador.');
      const r=await supabase.rpc('localizar_titular',{ _empresa_id:empresaId,_identificador:identificador,_tipo:tipo }); if(r.error) throw r.error;
      setResultados(r.data ?? []);setConsultou(true);
    });
  };
  const vincular = () => executar(async () => {
    if(!empresaId || !produto) throw new Error('Selecione o PRT.');
    const [id,indice]=produto.split(':'); if(!id) return;
    const r=await supabase.rpc('indexar_titular',{_empresa_id:empresaId,_produto_id:id,_produto_indice:Number(indice ?? 0),_identificador:identificador,_tipo:tipo,_localizacao:localizacao});if(r.error) throw r.error;
    setIdentificador('');setLocalizacao('');toast.success('Vínculo protegido registrado na trilha.');
  });
  const criar = () => executar(async () => {
    if(!empresaId || !identificador.trim()) throw new Error('Informe o identificador.');
    const processoId=produto.split(':')[0];
    const r=await supabase.rpc('criar_solicitacao_titular',{_empresa_id:empresaId,_identificador:identificador,_tipo:tipo,_direito:direito,_canal:canal,_descricao:descricao,_recebimento:recebimento,...(processoId ? {_produto_id:processoId} : {})});if(r.error) throw r.error;
    setIdentificador('');setDescricao('');await qc.invalidateQueries({queryKey:['solicitacoes_titular']});toast.success(`Protocolo ${r.data.protocolo} registrado.`);
  });
  const atualizar = (id: string, status: string) => executar(async () => {
    const r=await supabase.rpc('atualizar_solicitacao_titular',{_id:id,_status:status,...(status==='NEGADA' && fundamentoId ? {_fundamento_id:fundamentoId} : {}),_fundamento:fundamento});if(r.error) throw r.error;
    setNegando(null);await qc.invalidateQueries({queryKey:['solicitacoes_titular']});toast.success('Atendimento atualizado e auditado.');
  });
  const pedidos: Pedido[] = demo ? solicitacoesDemo() : (pedidosQ.data ?? []);
  const visiveis=pedidos.filter(p => (filtro==='TODAS'||p.status===filtro) && (prazoFiltro==='TODOS'||estadoPrazo(p.prazo_resposta).alerta===prazoFiltro));
  const opcoes=demo ? OPCOES_PRT_DEMO : (rotQ.data ?? []).flatMap(r => Array.isArray(r.produtos_tratamento) ? r.produtos_tratamento.map((p,i) => ({valor:`${r.id}:${i}`,texto:`${r.codigo} · PRT-${i+1} · ${(p as {nome?:string})?.nome ?? ''} · ${r.papel_agente}`})) : []);
  const dispositivos=demo
    ? BIBLIOTECA_NORMATIVA.filter(e=>e.status==='VERIFICADA' && ['REGIME_GERAL','LEI_ESPECIAL_SETORIAL'].includes(e.categoria)).map(e=>({id:`${e.norma}|${e.identificador}`,norma:e.norma,identificador:e.identificador}))
    : (bibliotecaQ.data ?? []);
  return <div className="space-y-6">
    <PageHeader eyebrow="Transversal" title="Solicitações de titulares" />
    {(erro || empresaQ.isError || pedidosQ.isError) && <p role="alert" className="text-sm text-destructive">{erro || 'Não foi possível carregar os registros desta empresa.'}</p>}
    <Panel title="Localizar titular">
      <div className="grid gap-3 sm:grid-cols-3">
        <div><Label htmlFor="tipo-titular">Tipo de identificador</Label><select id="tipo-titular" className={selectClass} value={tipo} onChange={e=>setTipo(e.target.value)}>{['CPF','CNPJ','EMAIL','MATRICULA','OUTRO'].map(t=><option key={t}>{t}</option>)}</select></div>
        <div><Label htmlFor="identificador-titular">Identificador protegido</Label><Input id="identificador-titular" type="password" autoComplete="off" value={identificador} onChange={e=>setIdentificador(e.target.value)} /></div>
        <Button className="self-end" disabled={busy} onClick={()=>void buscar()}><Search className="h-4 w-4" /> Buscar titular</Button>
      </div>
      {consultou && <div className="mt-4" data-testid="resultado-titular">{resultados.length===0 ? <p>Nenhum PRT localizado.</p> : resultados.map(r=><p key={r.indice_id} className="border-b py-2 text-sm"><b>{r.codigo} · {r.prt}</b><span className="block text-muted-foreground">{r.localizacao_tecnica}</span></p>)}</div>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div><Label htmlFor="produto-titular">PRT / processo associado</Label><select id="produto-titular" className={selectClass} value={produto} onChange={e=>setProduto(e.target.value)}><option value="">Sem vínculo</option>{opcoes.map(p=><option key={p.valor} value={p.valor}>{p.texto}</option>)}</select></div>
        <div><Label htmlFor="localizacao-titular">Localização técnica</Label><Input id="localizacao-titular" value={localizacao} onChange={e=>setLocalizacao(e.target.value)} /></div>
      </div>
      <Button className="mt-3" variant="outline" disabled={busy} onClick={()=>void vincular()}>Registrar vínculo técnico</Button>
    </Panel>
    <Panel title="Registrar solicitação">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label htmlFor="direito-titular">Direito solicitado — art. 18</Label><select id="direito-titular" className={selectClass} value={direito} onChange={e=>setDireito(e.target.value)}>{DIREITOS.map(([v,t])=><option key={v} value={v}>{v} · {t}</option>)}</select></div>
        <div><Label htmlFor="recebimento-titular">Data de recebimento</Label><Input id="recebimento-titular" type="date" max={new Date().toISOString().slice(0,10)} value={recebimento} onChange={e=>setRecebimento(e.target.value)} /></div>
        <div><Label htmlFor="canal-titular">Canal</Label><select id="canal-titular" className={selectClass} value={canal} onChange={e=>setCanal(e.target.value)}>{['E-mail','Portal','Presencial','Telefone','Outro'].map(c=><option key={c}>{c}</option>)}</select></div>
        <div><Label htmlFor="descricao-titular">Descrição sem identificador</Label><Textarea id="descricao-titular" value={descricao} onChange={e=>setDescricao(e.target.value)} /></div>
      </div>
      <p className="mt-3 text-sm font-medium">{tipoPrazo(direito)==='LEGAL' ? 'Declaração completa: até 15 dias corridos — prazo legal (art. 19, II). Formato simplificado: imediato (art. 19, I).' : 'Regra do método — 15 dias corridos.'}</p>
      <p className="mt-2 text-xs text-muted-foreground">{NOTA_PRAZO_METODO}</p>
      <CitacoesAgrupadas entradas={BIBLIOTECA_NORMATIVA.filter(e=>e.norma==='LGPD' && ['art. 19, I','art. 19, II','art. 18, § 5º'].includes(e.identificador))} />
      <Button className="mt-3" disabled={busy} onClick={()=>void criar()}><Plus className="h-4 w-4" /> Registrar solicitação</Button>
    </Panel>
    <Panel title={`Atendimentos · ${pedidos.length}`}>
      <div className="mb-4 flex flex-wrap gap-3"><select aria-label="Filtrar status" className={selectClass+' sm:w-auto'} value={filtro} onChange={e=>setFiltro(e.target.value)}><option value="TODAS">Todos os status</option>{STATUS.map(s=><option key={s}>{s}</option>)}</select><select aria-label="Filtrar prazo" className={selectClass+' sm:w-auto'} value={prazoFiltro} onChange={e=>setPrazoFiltro(e.target.value)}>{['TODOS','D-5','D-2','ATRASADA','NO_PRAZO'].map(s=><option key={s}>{s}</option>)}</select></div>
      <ul className="divide-y">{visiveis.map(p=> { const prazo=estadoPrazo(p.prazo_resposta); const aberto=!['RESPONDIDA','NEGADA'].includes(p.status);return <li key={p.id} className="space-y-2 py-4" data-testid={`pedido-${p.protocolo}`}>
        <div className="flex flex-wrap items-center gap-2"><b>{p.protocolo}</b><Tag tone={p.status==='ENCAMINHADA_CONTROLADOR'?'warning':'muted'}>{p.status.replaceAll('_',' ')}</Tag>{aberto && <Tag tone={prazo.dias<0?'destructive':prazo.dias<=5?'warning':'muted'}>{prazo.alerta==='ATRASADA' ? `Atrasada · ${-prazo.dias} dias` : `${prazo.dias} dias restantes${prazo.dias<=5 ? ' · '+prazo.alerta : ''}`}</Tag>}</div>
        <p className="text-sm">{DIREITOS.find(d=>d[0]===p.direito_solicitado)?.[1]} · {p.tipo_prazo==='LEGAL'?'15 dias corridos — prazo legal (art. 19, II)':'Regra do método — 15 dias'} · até {p.prazo_resposta}</p>
        {p.status==='ENCAMINHADA_CONTROLADOR' && <p className="text-sm text-muted-foreground">Linha do ROT: Operador · encaminhada ao controlador.</p>}
        {aberto && <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={()=>void atualizar(p.id,'EM_ANALISE')}>Em análise</Button><Button size="sm" variant="outline" disabled={busy} onClick={()=>void atualizar(p.id,'RESPONDIDA')}>Registrar resposta</Button><Button size="sm" variant="outline" onClick={()=>{setNegando(p.id);setFundamentoId('');setFundamento('');}}>Negar com fundamento</Button></div>}
        {negando===p.id && <div className="space-y-2 border-l-2 border-destructive pl-3"><p role="alert" className="text-sm text-destructive">Negativa exige fundamento com dispositivo legal verificado.</p><select aria-label="Dispositivo legal da negativa" className={selectClass} value={fundamentoId} onChange={e=>setFundamentoId(e.target.value)}><option value="">Selecione o dispositivo…</option>{(bibliotecaQ.data??[]).map(e=><option key={e.id} value={e.id}>{e.norma} · {e.identificador}</option>)}</select><Textarea aria-label="Fundamento da negativa" value={fundamento} onChange={e=>setFundamento(e.target.value)} /><Button size="sm" disabled={!fundamentoId||!fundamento.trim()||busy} onClick={()=>void atualizar(p.id,'NEGADA')}>Confirmar negativa fundamentada</Button></div>}
        {p.fundamento_negativa && <p className="text-sm">Fundamento: {p.fundamento_negativa}</p>}
        {p.fundamento_normativo_id && <CitacoesAgrupadas entradas={(bibliotecaQ.data??[]).filter(e=>e.id===p.fundamento_normativo_id).map(e=>({...e,url_oficial:e.url_oficial??''}))} />}
      </li>; })}</ul>
      {!visiveis.length && <p className="text-sm text-muted-foreground">Nenhuma solicitação neste filtro.</p>}
    </Panel>
  </div>;
}