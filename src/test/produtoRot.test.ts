import { produtosDaLinha } from "@/lib/priva/rot";
import { describe, expect, it } from "vitest";
import { criteriosSchema } from "@/lib/priva/enquadramento";
import { DEMO_ROT } from "@/lib/priva/demo";
import { temProcessar } from "@/lib/priva/cicloVida";
import {
  ALERTA_FINALIDADE_OPERADOR, ALERTA_PRODUTO_AUSENTE, alertaFinalidadeOperador, alertaProdutoAusente,
  finalidadeDoContrato, montarLinhaReceptora, sugerirProduto, validateRot, type RotInput, type RotRow,
} from "@/lib/priva/rot";

const base = (p: Partial<RotInput> = {}): RotInput => ({
  empresa_cnpj: "00000000000100", setor: "RH", genero_verbo: "Coletar", ciclo_vida: { Coletar: ["receber"] }, categoria_titulares: ["Candidatos"], dados_pessoais: ["Nome"],
  dados_sensiveis: ["N/A"], finalidade_especifica: "Seleção e recrutamento de candidatos", hipotese_tratamento: "Art. 7º, V – Execução de contrato ou procedimentos preliminares",
  hipotese_sensivel: null, tempo_retencao: "1 ano", base_prazo: "Política interna", compartilhamento: "Não Compartilhado", salvaguardas: [], infraestrutura: "Servidor Local",
  justificativa_mitigacao: null, area_setor: "Recursos Humanos › Seleção e Recrutamento", insumo: "currículo", meio_fornecimento: "site",
  papel_agente: "CONTROLADOR", contrato_controlador: null, produto_interno: null, destino_produto: null, prazo_produto: null, fundamento_produto: null, origem_compartilhamento: null, produtos_tratamento: [], ...p,
});

describe("papel do agente (item A)", () => {
  it("o enquadramento aceita o papel e aplica CONTROLADOR como padrão em declarações antigas", () => {
    const antiga = { grupoGrande: false, receitaAcimaTeto: false, tipo: "ME", titulares: 800, infraLimitada: false, descricaoInfra: "", sensivelLargaEscala: false, altoRisco: false, menoresAltoRisco: false };
    expect(criteriosSchema.parse(antiga).papelAgente).toBe("CONTROLADOR");
    expect(criteriosSchema.parse({ ...antiga, papelAgente: "OPERADOR" }).papelAgente).toBe("OPERADOR");
  });
  it("linha de operador sem contrato com o controlador não salva", () => {
    expect(validateRot(base({ papel_agente: "OPERADOR" }))).toMatch(/contrato com o controlador/);
    expect(validateRot(base({ papel_agente: "OPERADOR", contrato_controlador: "Contrato nº 12/2026" }))).toBeNull();
  });
  it("operador com finalidade própria dispara alerta; com a finalidade do contrato, não", () => {
    const op = base({ papel_agente: "OPERADOR", contrato_controlador: "Contrato nº 12/2026" });
    expect(alertaFinalidadeOperador(op)).toBe(ALERTA_FINALIDADE_OPERADOR);
    expect(alertaFinalidadeOperador({ ...op, finalidade_especifica: finalidadeDoContrato("Contrato nº 12/2026") })).toBeNull();
    expect(alertaFinalidadeOperador(base())).toBeNull();
  });
});

describe("produto interno (item B)", () => {
  it("sugestão determinística: currículo + RH › Seleção sugere os três produtos da tabela v1", () => {
    const f = base({ ciclo_vida: { Coletar: ["receber"], Processar: ["utilizar"] } });
    const dicas = sugerirProduto(f);
    expect(dicas.map((d) => d.patch.produto_interno)).toEqual(["Ficha de candidato", "Parecer de seleção", "Proposta de contratação"]);
    expect(dicas.every((d) => d.origem.includes("tabela determinística v"))).toBe(true);
    expect(sugerirProduto(f)).toEqual(dicas);
  });
  it("demais pares da tabela v1: nota fiscal, contrato, formulário e imagem digitalizada", () => {
    const c = { Coletar: ["receber"], Processar: ["utilizar"] };
    expect(sugerirProduto(base({ ciclo_vida: c, area_setor: "Financeiro › Contas a Pagar", insumo: "nota fiscal" })).map((d) => d.patch.produto_interno)).toEqual(["Lançamento contábil", "Relatório de despesas"]);
    expect(sugerirProduto(base({ ciclo_vida: c, area_setor: "Jurídico › Contratos", insumo: "contrato" })).map((d) => d.patch.produto_interno)).toEqual(["Parecer jurídico", "Minuta revisada"]);
    expect(sugerirProduto(base({ ciclo_vida: c, area_setor: "Marketing › Campanhas", insumo: "formulário" })).map((d) => d.patch.produto_interno)).toEqual(["Base de leads", "Relatório de campanha"]);
    expect(sugerirProduto(base({ ciclo_vida: c, area_setor: "Recepção › Controle de Acesso", insumo: "imagem/documento digitalizado" })).map((d) => d.patch.produto_interno)).toEqual(["Registro de visita", "Log de acesso"]);
  });
  it("nenhuma pré-seleção: o formulário novo nasce sem produto e a sugestão não muta a entrada", () => {
    const f = base({ ciclo_vida: { Coletar: ["receber"], Processar: ["utilizar"] } });
    const antes = JSON.stringify(f);
    sugerirProduto(f);
    expect(JSON.stringify(f)).toBe(antes);
    expect(f.produto_interno).toBeNull();
  });
  it("sem Processar não há sugestão nem alerta; com Processar e sem produto o alerta dispara", () => {
    expect(temProcessar({ Coletar: ["receber"] })).toBe(false);
    expect(sugerirProduto(base({ ciclo_vida: { Coletar: ["receber"] } }))).toEqual([]);
    expect(alertaProdutoAusente(base({ ciclo_vida: { Coletar: ["receber"] } }))).toBeNull();
    expect(alertaProdutoAusente(base({ ciclo_vida: { Processar: ["utilizar"] } }))).toBe(ALERTA_PRODUTO_AUSENTE);
    expect(alertaProdutoAusente(base({ ciclo_vida: { Processar: ["utilizar"] }, produto_interno: "Ficha de candidato" }))).toBeNull();
  });
});

describe("destino ancorado no produto (item C)", () => {
  const origem = { ...base({ ciclo_vida: { Coletar: ["receber"], Processar: ["utilizar"], Compartilhar: ["transferir"] }, produto_interno: "Ficha de candidato" }), id: "rot-1", codigo: "PRIVA-RH-001" } as RotRow;
  it("a linha receptora recebe o produto como insumo (10A) e a origem rastreada", () => {
    const r = montarLinhaReceptora(origem, "Financeiro › Contas a Pagar", "Financeiro");
    expect(r.insumo).toBe("Ficha de candidato");
    expect(r.area_setor).toBe("Financeiro › Contas a Pagar");
    expect(r.setor).toBe("Financeiro");
    expect(r.origem_compartilhamento).toEqual({ estado: "insumo recebido", linha_origem_id: "rot-1", codigo_origem: "PRIVA-RH-001", area_setor_origem: "Recursos Humanos › Seleção e Recrutamento" });
    expect(r.hipotese_tratamento).toBe(origem.hipotese_tratamento);
    expect(r.produto_interno).toBeNull();
  });
  it("a linha receptora passa na validação do banco (hipótese e termos)", () => {
    const r = montarLinhaReceptora(origem, "Financeiro › Contas a Pagar", "Financeiro");
    expect(r.hipotese_tratamento).toMatch(/^Art\. 7º/);
    expect(r.finalidade_especifica).toContain("compartilhamento interno");
  });
});

describe("demonstração cenográfica", () => {
  it("toda linha demo com Processar tem produto; o vínculo RH → Financeiro é cruzado", () => {
    for (const r of DEMO_ROT) if (temProcessar(r.ciclo_vida as never)) expect(r.produto_interno).toBeTruthy();
    const origem = DEMO_ROT.find((r) => r.codigo === "PRIVA-RH-001")!;
    const receptor = DEMO_ROT.find((r) => r.codigo === "PRIVA-FIN-001")!;
    const prt = produtosDaLinha(origem).find((p) => p.destino?.linha_receptor_codigo === "PRIVA-FIN-001");
    expect(prt?.nome).toBe("Relatório de folha consolidado");
    expect((receptor.origem_compartilhamento as { codigo_origem?: string }).codigo_origem).toBe("PRIVA-RH-001");
    expect(receptor.insumo).toBe(prt?.nome);
  });
});
