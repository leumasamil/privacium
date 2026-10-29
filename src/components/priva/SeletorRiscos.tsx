import { useEffect, useRef } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RISCOS_ANPD, sugerirRiscos, textoRiscos } from '@/lib/priva/riscosIncidente';
import type { ComunicacaoANPD } from '@/lib/priva/anpd';
export function SeletorRiscos({ form, onChange, editavel, sensivel, menores }: { form: ComunicacaoANPD; onChange: React.Dispatch<React.SetStateAction<ComunicacaoANPD>>; editavel: boolean; sensivel: boolean; menores: boolean }) {
  const vistas = useRef(new Set<string>());
  const sugeridas = sugerirRiscos(form.natureza, sensivel, menores);
  const chave = sugeridas.join('|');
  useEffect(() => {
    if (!editavel) return;
    const novas = sugeridas.filter(v => !vistas.current.has(v)); sugeridas.forEach(v => vistas.current.add(v));
    if (novas.length) onChange(atual => { const riscosSelecionados = [...new Set([...(atual.riscosSelecionados ?? []), ...novas])]; return { ...atual, riscosSelecionados, riscos: textoRiscos(riscosSelecionados, atual.riscosDetalhes ?? '') }; });
  }, [chave, editavel, onChange]);
  const selecionados = form.riscosSelecionados ?? [];
  const alterar = (riscosSelecionados: string[], riscosDetalhes = form.riscosDetalhes ?? '') => onChange(atual => ({ ...atual, riscosSelecionados, riscosDetalhes, riscos: textoRiscos(riscosSelecionados, riscosDetalhes) }));
  const legado = !editavel && form.riscosSelecionados === undefined;
  const copiar = async () => { try { await navigator.clipboard.writeText(form.riscos); toast.success('Riscos copiados.'); } catch { toast.error('Não foi possível copiar os riscos.'); } };
  return <fieldset id="anpd-riscos" tabIndex={-1} className="min-w-0 space-y-4 focus:ring-2 focus:ring-ring">
    <legend className="font-medium">Riscos e consequências aos titulares</legend>
    {!legado && [...new Set(RISCOS_ANPD.map(r => r.grupo))].map(grupo => <fieldset key={grupo} className="border-t pt-3"><legend className="pr-2 text-sm font-semibold">{grupo}</legend><div className="grid gap-3 md:grid-cols-2">{RISCOS_ANPD.filter(r => r.grupo === grupo).map(r => <label key={r.valor} className="flex min-w-0 items-start gap-2 text-sm"><Checkbox aria-label={r.valor} checked={selecionados.includes(r.valor)} disabled={!editavel} onCheckedChange={v => alterar(v === true ? [...selecionados, r.valor] : selecionados.filter(x => x !== r.valor))} /><span className="min-w-0 break-words">{r.valor}<span className="block text-xs text-muted-foreground">{r.descricao}</span><span className="block text-xs text-muted-foreground">{r.fonte_normativa}</span>{editavel && selecionados.includes(r.valor) && sugeridas.includes(r.valor) && <span className="block text-xs text-andamento">Sugerido para {form.natureza}</span>}</span></label>)}</div></fieldset>)}
    {!legado && <div><label htmlFor="anpd-riscos-detalhes">Detalhes específicos deste incidente (obrigatório)</label><Textarea id="anpd-riscos-detalhes" rows={4} value={form.riscosDetalhes ?? ''} readOnly={!editavel} placeholder="Ex.: O serviço de atendimento ficou indisponível por duas horas; os registros foram recuperados e o alcance da exposição está em avaliação." onChange={e => alterar(selecionados, e.target.value)} /><p className="text-xs text-muted-foreground">{(form.riscosDetalhes ?? '').trim().length} caracteres · mínimo 50</p></div>}
    <div><div className="mb-2 flex items-center justify-between gap-2"><label htmlFor="anpd-riscos-texto">{legado ? 'Riscos registrados' : 'Texto final dos riscos'}</label><Button type="button" size="sm" variant="outline" disabled={!form.riscos} onClick={() => void copiar()}><Copy className="h-3.5 w-3.5" />Copiar</Button></div><Textarea id="anpd-riscos-texto" rows={6} value={form.riscos} readOnly /></div>
  </fieldset>;
}