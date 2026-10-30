import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
const sessionText = process.env['LOVABLE_BROWSER_SUPABASE_SESSION_JSON'];
const url = import.meta.env['VITE_SUPABASE_URL'];
const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
const RAZAO_TESTE = 'TESTE DE ACEITAÇÃO — Enquadramento Privacium (cenográfico)';

describe.skipIf(!sessionText || !url || !key)('papel do agente e produto interno no banco', () => {
  it('operador sem contrato é recusado; com contrato grava; destino interno cria linha receptora rastreada', async () => {
    if (!sessionText) throw new Error('Sessão ausente');
    const session = JSON.parse(sessionText) as { access_token: string };
    const db = createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${session.access_token}` } } });
    const emp = await db.from('empresas').select('id, cnpj').eq('razao_social', RAZAO_TESTE).single();
    expect(emp.error).toBeNull(); if (!emp.data) throw new Error('Empresa de teste ausente');
    const cnpj = emp.data.cnpj;

    const linha = {
      empresa_cnpj: cnpj, setor: 'TI', genero_verbo: 'Processar', ciclo_vida: { Coletar: ['receber'], Processar: ['utilizar'] },
      categoria_titulares: ['Clientes'], dados_pessoais: ['Nome'], dados_sensiveis: ['N/A'],
      finalidade_especifica: 'Tratamento em nome do controlador, conforme contrato: Contrato nº 99/2026',
      hipotese_tratamento: 'Art. 7º, V – Execução de contrato ou procedimentos preliminares',
      tempo_retencao: '1 ano', base_prazo: 'Contrato', compartilhamento: 'Não Compartilhado',
      salvaguardas: ['Criptografia'], infraestrutura: 'Nuvem Corporativa',
      area_setor: 'Tecnologia da Informação › Suporte', insumo: 'banco de dados', meio_fornecimento: 'API/sistema',
      papel_agente: 'OPERADOR', contrato_controlador: 'Contrato nº 99/2026', produto_interno: 'Relatório de suporte',
    };

    // Trava do banco: OPERADOR sem contrato é recusado pela constraint
    const semContrato = await db.from('registro_operacoes').insert({ ...linha, contrato_controlador: null }).select('id');
    expect(semContrato.error).not.toBeNull();

    // Com contrato, grava com papel e produto
    const ok = await db.from('registro_operacoes').insert(linha).select('id, codigo, papel_agente, produto_interno').single();
    expect(ok.error).toBeNull();
    expect(ok.data?.papel_agente).toBe('OPERADOR');
    expect(ok.data?.produto_interno).toBe('Relatório de suporte');

    // Destino INTERNO: a linha de origem guarda o destino do produto e a receptora nasce rastreada
    const destino = { tipo: 'INTERNO', area_setor_destino: 'Financeiro › Contas a Pagar' };
    const upd = await db.from('registro_operacoes').update({ destino_produto: destino }).eq('id', ok.data!.id);
    expect(upd.error).toBeNull();
    const receptor = await db.from('registro_operacoes').insert({
      ...linha, setor: 'Financeiro', area_setor: 'Financeiro › Contas a Pagar', papel_agente: 'CONTROLADOR', contrato_controlador: null,
      genero_verbo: 'Coletar', ciclo_vida: { Coletar: ['receber'] },
      finalidade_especifica: 'Recebimento de "Relatório de suporte" de Tecnologia da Informação › Suporte (compartilhamento interno)',
      insumo: 'Relatório de suporte', produto_interno: null,
      origem_compartilhamento: { estado: 'insumo recebido', linha_origem_id: ok.data!.id, codigo_origem: ok.data!.codigo, area_setor_origem: 'Tecnologia da Informação › Suporte' },
    }).select('id, codigo, insumo, origem_compartilhamento').single();
    expect(receptor.error).toBeNull();
    expect(receptor.data?.insumo).toBe('Relatório de suporte');
    expect((receptor.data?.origem_compartilhamento as { codigo_origem?: string }).codigo_origem).toBe(ok.data!.codigo);
    const vinculo = await db.from('registro_operacoes').update({ destino_produto: { ...destino, linha_receptor_id: receptor.data!.id, linha_receptor_codigo: receptor.data!.codigo } }).eq('id', ok.data!.id);
    expect(vinculo.error).toBeNull();

    // Prazos separados: insumo (tempo_retencao/base_prazo) e produto (prazo_produto/fundamento_produto)
    const prazos = await db.from('registro_operacoes').update({ prazo_produto: '6 meses', fundamento_produto: 'LGPD, art. 16' }).eq('id', ok.data!.id);
    expect(prazos.error).toBeNull();
    const lido = await db.from('registro_operacoes').select('tempo_retencao, prazo_produto, fundamento_produto').eq('id', ok.data!.id).single();
    expect(lido.data?.tempo_retencao).toBe('1 ano');
    expect(lido.data?.prazo_produto).toBe('6 meses');

    // Limpeza cenográfica
    await db.from('registro_operacoes').delete().eq('id', receptor.data!.id);
    await db.from('registro_operacoes').delete().eq('id', ok.data!.id);
  });
});
