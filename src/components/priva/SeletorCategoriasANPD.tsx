import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { CategoriaANPD } from '@/lib/priva/categoriasANPD';
export function SeletorCategoriasANPD({ opcoes, valores, editavel, padrao, onChange }: { opcoes: CategoriaANPD[]; valores: string[]; editavel: boolean; padrao: boolean; onChange: (valores: string[]) => void }) {
  const elevado = opcoes.some(c => c.sensivel && valores.includes(c.valor));
  return <fieldset id="anpd-categorias" tabIndex={-1} className="min-w-0 rounded-sm border border-l-4 p-3 focus:ring-2 focus:ring-ring">
    <legend className="px-1 text-sm font-medium">Categorias de dados pessoais afetados</legend>
    {padrao && <p className="mb-3 text-xs text-muted-foreground">Catálogo padrão · campos de dados do processo ROT vazios.</p>}
    <div className="grid gap-3 md:grid-cols-2">{opcoes.map(c => <label key={c.valor} className="flex min-w-0 items-start gap-2 text-sm"><Checkbox className="mt-0.5 shrink-0" checked={valores.includes(c.valor)} disabled={!editavel} onCheckedChange={v => onChange(v === true ? [...valores, c.valor] : valores.filter(x => x !== c.valor))} /><span className="min-w-0 break-words">{c.valor}<span className="block text-xs text-muted-foreground">{c.fonte_normativa}</span>{c.sensivel && <span className="mt-1 inline-flex items-center gap-1 rounded-sm bg-atencao-bg px-1.5 text-xs font-medium text-atencao"><ShieldAlert className="h-3 w-3 shrink-0" aria-hidden />Dado pessoal sensível</span>}{c.fonte_normativa.includes('art. 14') && <span className="mt-1 flex items-center gap-1 text-xs text-atencao"><AlertTriangle className="h-3 w-3" aria-hidden />Atenção redobrada · menores de idade</span>}</span></label>)}</div>
    {!opcoes.length && <p className="text-sm text-pendencia">Selecione um processo para carregar suas categorias.</p>}
    {elevado && <p role="status" className="mt-3 flex items-center gap-2 border-l-4 border-l-atencao-border pl-2 text-sm font-medium text-atencao"><AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />Criticidade elevada · dado pessoal sensível selecionado (LGPD art. 5º, II).</p>}
  </fieldset>;
}