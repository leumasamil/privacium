import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CATEGORIAS_ROTULO, podeFundamentar, type PosicaoCitacao } from '@/lib/priva/incidenciaNormativa';
import type { EntradaNormativa } from '@/lib/priva/bibliotecaNormativa';
export function CitacoesAgrupadas({ entradas, posicao = 'FUNDAMENTO' }: { entradas: EntradaNormativa[]; posicao?: PosicaoCitacao }) {
  const [aberto, setAberto] = useState(false);
  const permitidas = entradas.filter(e => podeFundamentar(e, posicao));
  return <div className="space-y-1 text-xs" data-testid="citacoes-agrupadas">
    {permitidas.map(e => <p key={`${e.norma}-${e.identificador}`}><b>{CATEGORIAS_ROTULO[e.categoria]}</b> · <a className="underline" href={e.url_oficial} target="_blank" rel="noreferrer">{e.norma} · {e.identificador}</a>{aberto && <span className="mt-1 block text-muted-foreground">{e.texto_literal}</span>}</p>)}
    {permitidas.length > 0 && <Button variant="ghost" size="sm" onClick={() => setAberto(v => !v)}>{aberto ? 'Recolher texto literal' : 'Ver texto literal'}</Button>}
  </div>;
}