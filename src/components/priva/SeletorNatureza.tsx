import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GRUPOS_NATUREZAS, NATUREZAS, OUTRO, PADRAO_RANSOMWARE } from "@/lib/priva/naturezasIncidente";
import type { ComunicacaoANPD } from "@/lib/priva/anpd";
export function SeletorNatureza({ form, onChange, editavel, sugerida }: { form: ComunicacaoANPD; onChange: (form: ComunicacaoANPD) => void; editavel: boolean; sugerida: boolean }) {
  const [alterada, setAlterada] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const item = NATUREZAS.find(n => n.valor === form.natureza);
  const secundarias = form.naturezasSecundarias ?? [];
  const outro = form.natureza === OUTRO || secundarias.includes(OUTRO);
  return <div className="space-y-3">
    <div><label htmlFor="anpd-natureza">Natureza principal do incidente</label>
      {editavel ? <Select value={item?.valor ?? ""} onValueChange={natureza => { setAlterada(true); onChange({ ...form, natureza, naturezasSecundarias: secundarias.filter(n => n !== natureza) }); }}>
        <SelectTrigger ref={trigger} id="anpd-natureza" className="mt-1 h-auto min-h-9 whitespace-normal text-left [&>span]:line-clamp-none"><SelectValue placeholder="Selecione a natureza principal" /></SelectTrigger>
        <SelectContent className="max-h-80 max-w-[calc(100vw-2rem)]">
          {GRUPOS_NATUREZAS.map(g => <SelectGroup key={g.titulo}><SelectLabel>{g.titulo}</SelectLabel>{g.itens.map(n => <SelectItem key={n.valor} value={n.valor} textValue={n.valor} className="max-w-xl whitespace-normal"><span className="block">{n.valor}</span><span className="block text-xs text-muted-foreground">{n.fonte_normativa}</span></SelectItem>)}</SelectGroup>)}
        </SelectContent>
      </Select> : <p id="anpd-natureza" className="mt-1 break-words rounded-sm border p-2 text-sm">{form.natureza || "Natureza não registrada"}</p>}
      {editavel && sugerida && !alterada && form.natureza === PADRAO_RANSOMWARE && <p className="mt-1 text-xs text-muted-foreground">Sugerido com base no tipo registrado no incidente — <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => { setAlterada(true); trigger.current?.click(); }}>Alterar</Button></p>}
      {item && <div className="mt-2 text-sm text-muted-foreground"><p>{item.descricao[0]}</p><p>{item.descricao[1]}</p><p className="mt-1 font-medium">{item.fonte_normativa}</p></div>}
      <p className="mt-2 text-xs text-muted-foreground">Taxonomia técnica: NIST SP 800-61r3 / ENISA</p>
    </div>
    <details><summary className="cursor-pointer text-sm font-medium">Naturezas secundárias (opcional){secundarias.length ? ` · ${secundarias.length} selecionadas` : ""}</summary>
      <div className="mt-3 space-y-4">{GRUPOS_NATUREZAS.map(g => <fieldset key={g.titulo}><legend className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{g.titulo}</legend><div className="grid gap-3 md:grid-cols-2">{g.itens.filter(n => n.valor !== form.natureza).map(n => <label key={n.valor} className="flex items-start gap-2 text-sm"><Checkbox checked={secundarias.includes(n.valor)} disabled={!editavel} onCheckedChange={v => onChange({ ...form, naturezasSecundarias: v === true ? [...secundarias, n.valor] : secundarias.filter(x => x !== n.valor) })} /><span>{n.valor}<span className="block text-xs text-muted-foreground">{n.fonte_normativa}</span>{secundarias.includes(n.valor) && <span className="mt-1 block text-xs text-muted-foreground">{n.descricao.map(d => <span className="block" key={d}>{d}</span>)}</span>}</span></label>)}</div></fieldset>)}</div>
    </details>
    {outro && <div><label htmlFor="anpd-natureza-outro">Outro — descrição obrigatória</label><Textarea id="anpd-natureza-outro" value={form.naturezaOutro ?? ""} readOnly={!editavel} onChange={e => onChange({ ...form, naturezaOutro: e.target.value })} /></div>}
  </div>;
}