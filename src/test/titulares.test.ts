import { describe, expect, it } from 'vitest';
import { estadoPrazo, prazoTitular, statusInicialTitular, tipoPrazo } from '../lib/priva/titulares';
import { podeFundamentar } from '../lib/priva/incidenciaNormativa';
import { BIBLIOTECA_NORMATIVA } from '../lib/priva/bibliotecaNormativa';
import { continuacaoConforme } from '../lib/priva/continuacaoReceptor';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { vi } from 'vitest';
import { CitacaoNormativa } from '../components/priva/CitacaoNormativa';
vi.mock('../lib/priva/store',()=>({usePriva:()=>({demo:true,log:vi.fn()})}));
describe('Direitos do titular e incidência',()=>{
  it('confirmação é prazo legal de 15 dias corridos',()=>{expect(tipoPrazo('I')).toBe('LEGAL');expect(prazoTitular('2026-10-22')).toBe('2026-11-06');});
  it('acesso é legal',()=>expect(tipoPrazo('II')).toBe('LEGAL'));
  it.each(['III','IV','V','VI','VII','VIII','IX'])('direito %s usa regra do método',d=>expect(tipoPrazo(d)).toBe('METODO'));
  it('alerta D-5',()=>expect(estadoPrazo('2026-11-06','2026-11-01')).toEqual({dias:5,alerta:'D-5'}));
  it('alerta D-2',()=>expect(estadoPrazo('2026-11-03','2026-11-01')).toEqual({dias:2,alerta:'D-2'}));
  it('atraso após vencimento',()=>expect(estadoPrazo('2026-10-31','2026-11-01')).toEqual({dias:-1,alerta:'ATRASADA'}));
  it('operador encaminha controlador',()=>expect(statusInicialTitular('OPERADOR')).toBe('ENCAMINHADA_CONTROLADOR'));
  it('fomento econômico nunca fundamenta obrigação',()=>{const entradas=BIBLIOTECA_NORMATIVA.filter(e=>e.categoria==='FOMENTO_ECONOMICO');expect(entradas.length).toBeGreaterThan(0);for(const e of entradas) expect(podeFundamentar(e,'FUNDAMENTO')).toBe(false);});
  it('controle de citação não renderiza fomento econômico como fundamento',()=>{
    for(const norma of ['LC 123/2006','LC 182/2021']) {
      const entrada=BIBLIOTECA_NORMATIVA.find(e=>e.norma===norma);
      if(!entrada)throw new Error('Referência econômica ausente');
      const citacao=`${norma}, ${entrada.identificador}`;
      expect(renderToStaticMarkup(createElement(CitacaoNormativa,{citacao,posicao:'FUNDAMENTO'}))).toBe('');
      expect(renderToStaticMarkup(createElement(CitacaoNormativa,{citacao,posicao:'REFERENCIA'}))).toContain(norma);
    }
  });
  it('sem escolha receptor não é conforme',()=>expect(continuacaoConforme(null,false)).toBe(false));
  it('uso exclusivo exige anonimização',()=>expect(continuacaoConforme({tipo:'USO_EXCLUSIVO',anonimizados:false,sem_acesso_terceiro:true},false)).toBe(false));
  it('uso exclusivo exige ausência de acesso por terceiro',()=>expect(continuacaoConforme({tipo:'USO_EXCLUSIVO',anonimizados:true,sem_acesso_terceiro:false},false)).toBe(false));
  it('duas declarações tornam uso exclusivo conforme',()=>expect(continuacaoConforme({tipo:'USO_EXCLUSIVO',anonimizados:true,sem_acesso_terceiro:true},false)).toBe(true));
});