import { useEffect, useRef } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GRUPOS_MEDIDAS, sugerirMedidas, textoMedidas } from '@/lib/priva/medidasIncidente';
import type { ComunicacaoANPD } from '@/lib/priva/anpd';
import type { EstadoIncidente } from '@/lib/priva/estadoIncidente';

export function SeletorMedidas({ form, onChange, editavel, estado }: { form: ComunicacaoANPD; onChange: React.Dispatch<React.SetStateAction<ComunicacaoANPD>>; editavel: boolean; estado: EstadoIncidente }) {
  const vistas = useRef(new Set<string>());
  const sugeridas = sugerirMedidas(estado.etapas.itens);
  const chave = sugeridas.join('|');
  useEffect(() => {
    if (!editavel) return;
    const novas = sugeridas.filter(v => !vistas.current.has(v));
    sugeridas.forEach(v => vistas.current.add(v));
    if (!novas.length) return;
    onChange(atual => {
      const medidasSelecionadas = [...new Set([...(atual.medidasSelecionadas ?? []), ...novas])];
      return { ...atual, medidasSelecionadas, medidas: textoMedidas(medidasSelecionadas, atual.outrasMedidas) };
    });
  }, [chave, editavel, onChange]);
  const selecionadas = form.medidasSelecionadas ?? [];
  const alterar = (medidasSelecionadas: string[], outrasMedidas = form.outrasMedidas ?? '') => onChange(atual => ({ ...atual, medidasSelecionadas, outrasMedidas, medidas: textoMedidas(medidasSelecionadas, outrasMedidas) }));
  const copiar = async () => {
    try { await navigator.clipboard.writeText(form.medidas); toast.success('Medidas copiadas.'); }
    catch { toast.error('Não foi possível copiar as medidas.'); }
  };
  const legado = !editavel && form.medidasSelecionadas === undefined;
  return <fieldset id="anpd-medidas" tabIndex={-1} className="min-w-0 space-y-4 focus:ring-2 focus:ring-ring">
    <legend className="font-medium">Medidas técnicas e de segurança adotadas</legend>
    {!legado && <TooltipProvider><div className="space-y-5">{GRUPOS_MEDIDAS.map(g => <fieldset key={g.titulo} className="min-w-0 border-t pt-3">
      <legend className="pr-2 text-sm font-semibold">{g.titulo}</legend>
      <p className="mb-3 text-xs text-muted-foreground">{g.fonte_normativa}</p>
      <div className="grid gap-3 md:grid-cols-2">{g.itens.map(m => <div key={m.valor} className="flex min-w-0 items-start gap-2 text-sm">
        <Tooltip><TooltipTrigger asChild><Checkbox aria-label={m.valor} className="mt-0.5 shrink-0" checked={selecionadas.includes(m.valor)} disabled={!editavel} onCheckedChange={v => alterar(v === true ? [...selecionadas, m.valor] : selecionadas.filter(x => x !== m.valor))} /></TooltipTrigger><TooltipContent className="max-w-xs">{m.descricao}</TooltipContent></Tooltip>
        <span className="min-w-0 break-words">{m.valor}<span className="block text-xs text-muted-foreground">{m.fonte_normativa}</span>{editavel && sugeridas.includes(m.valor) && selecionadas.includes(m.valor) && <span className="mt-1 block text-xs font-medium text-andamento">Sugerido a partir das etapas concluídas</span>}</span>
      </div>)}</div>
    </fieldset>)}</div></TooltipProvider>}
    {!legado && <div><label htmlFor="anpd-outras-medidas">Outras medidas adotadas (opcional)</label><Textarea id="anpd-outras-medidas" value={form.outrasMedidas ?? ''} readOnly={!editavel} rows={3} onChange={e => alterar(selecionadas, e.target.value)} /></div>}
    <div className="space-y-2"><div className="flex items-center justify-between gap-2"><label htmlFor="anpd-medidas-texto">{legado ? 'Medidas registradas' : 'Texto final das medidas'}</label><Button type="button" variant="outline" size="sm" disabled={!form.medidas} onClick={() => void copiar()}><Copy className="h-3.5 w-3.5" />Copiar</Button></div><Textarea id="anpd-medidas-texto" rows={5} value={form.medidas} readOnly /><p className="text-xs text-muted-foreground">{form.medidas.trim().length} caracteres · mínimo 30</p></div>
  </fieldset>;
}