import { describe, expect, it } from "vitest";
import { alertasPRTSemDestino, alertaPRTSemDestino, descreverDestinoPRT, NOTA_PRT, produtosDaLinha, prtExternosBloqueados, rotuloPRT } from "@/lib/priva/rot";
import { ROTULO_ETAPA2 } from "@/lib/priva/cicloVida";
import { ALERTA_TERCEIRO_SEM_CONTRATO, HIPOTESES_ART33, LITERAL_ART39, checklistCompleto, terceiroBloqueado, validarTerceiro } from "@/lib/priva/terceiros";
import { DEMO_ROT, DEMO_TERCEIROS } from "@/lib/priva/demo";

const linha = (produtos_tratamento: unknown, papel_agente = "CONTROLADOR") => ({ produtos_tratamento: produtos_tratamento as never, papel_agente, produto_interno: null, destino_produto: null, prazo_produto: null, fundamento_produto: null });

describe("Etapa 2 · Destino dos produtos gerados", () => {
  it("renomeia a etapa e numera PRT-1, PRT-2…", () => {
    expect(ROTULO_ETAPA2).toBe("Etapa 2 · Destino dos produtos gerados");
    expect([0, 1, 2].map(rotuloPRT)).toEqual(["PRT-1", "PRT-2", "PRT-3"]);
    expect(NOTA_PRT).toContain("Não confundir com os artefatos legais PI-01 a PI-05");
  });
  it("cada PRT sem destino gera alerta próprio; com todos os destinos a linha fecha", () => {
    const aberta = linha([{ nome: "Ficha cadastral", destino: { tipo: "INTERNO", area_setor_destino: "Recursos Humanos › Desligamento" } }, { nome: "Análise psicológica" }, { nome: "Demonstrativo", destino: { tipo: "ELIMINACAO", prazo: "5 anos" } }]);
    expect(alertasPRTSemDestino(aberta)).toEqual([alertaPRTSemDestino("Análise psicológica"), alertaPRTSemDestino("Demonstrativo")]);
    expect(alertaPRTSemDestino("Análise psicológica")).toBe("PRT 'Análise psicológica' sem destino declarado — art. 16 não comprovado.");
    const fechada = linha([{ nome: "Ficha cadastral", destino: { tipo: "INTERNO", area_setor_destino: "Recursos Humanos › Desligamento" } }, { nome: "Demonstrativo", destino: { tipo: "ELIMINACAO", prazo: "5 anos", fundamento: "LGPD, art. 16, I" } }, { nome: "Base", destino: { tipo: "EXTERNO", terceiro_id: "t1" } }]);
    expect(alertasPRTSemDestino(fechada)).toEqual([]);
  });
  it("destino externo sem terceiro do cadastro não fecha a linha", () => {
    expect(alertasPRTSemDestino(linha([{ nome: "Base", destino: { tipo: "EXTERNO" } }]))).toHaveLength(1);
  });
  it("linha antiga com produto único vira PRT-1 com o destino legado", () => {
    const p = produtosDaLinha({ produtos_tratamento: [] as never, produto_interno: "Base de leads", destino_produto: { tipo: "ELIMINACAO" } as never, prazo_produto: "6 meses", fundamento_produto: "art. 16" });
    expect(p).toEqual([{ nome: "Base de leads", destino: { tipo: "ELIMINACAO", prazo: "6 meses", fundamento: "art. 16" } }]);
    expect(descreverDestinoPRT(p[0]!.destino)).toBe("Eliminar em 6 meses (art. 16)");
  });
});

describe("Terceiros e alerta bloqueante do destino externo", () => {
  const ok = { id: "a", contrato_vigente: true, clausulas_art39: true };
  it("terceiro sem contrato vigente ou sem checklist completo bloqueia o PRT externo", () => {
    expect(terceiroBloqueado({ contrato_vigente: true, clausulas_art39: true })).toBe(false);
    expect(terceiroBloqueado({ contrato_vigente: false, clausulas_art39: true })).toBe(true);
    expect(terceiroBloqueado({ contrato_vigente: true, clausulas_art39: false })).toBe(true);
    const r = linha([{ nome: "X", destino: { tipo: "EXTERNO", terceiro_id: "a" } }, { nome: "Y", destino: { tipo: "EXTERNO", terceiro_id: "b" } }]);
    expect(prtExternosBloqueados(r, [ok, { id: "b", contrato_vigente: false, clausulas_art39: false }]).map((p) => p.nome)).toEqual(["Y"]);
    expect(ALERTA_TERCEIRO_SEM_CONTRATO).toBe("Terceiro sem contrato vigente com o checklist de cláusulas contratuais do método completo — compartilhamento externo não pode ser chancelado.");
  });
  it("checklist só é completo com os 10 itens", () => {
    expect(checklistCompleto({ instrucoes: true })).toBe(false);
    expect(checklistCompleto({ instrucoes: true, proposito: true, metodos: true, duracao: true, deveres: true, vigencia: true, controle: true, responsabilidade: true, seguranca: true, direitos_titular: true })).toBe(true);
  });
  it("suboperador exige operador principal e transferência internacional exige hipótese do art. 33", () => {
    const base = { razao_social: "Nuvem", cnpj: "11222333000181", papel_cadeia: "OPERADOR" as const, operador_principal_id: null, contrato_vigente: false, data_contrato: null, transferencia_internacional: false, hipotese_art33: null };
    expect(validarTerceiro(base)).toBeNull();
    expect(validarTerceiro({ ...base, papel_cadeia: "SUBOPERADOR" })).toBe("Suboperador exige vínculo com o operador principal.");
    expect(validarTerceiro({ ...base, transferencia_internacional: true })).toBe("Transferência internacional exige a hipótese do art. 33 selecionada.");
    expect(validarTerceiro({ ...base, transferencia_internacional: true, hipotese_art33: "II-b" })).toBeNull();
    expect(HIPOTESES_ART33).toHaveLength(12);
  });
  it("cita o art. 39 com o texto oficial (artigo sem parágrafos)", () => {
    expect(LITERAL_ART39).toBe("O operador deverá realizar o tratamento segundo as instruções fornecidas pelo controlador, que verificará a observância das próprias instruções e das normas sobre a matéria.");
  });
  it("demonstração: PRT para terceiro sem contrato fica bloqueado e há PRT sem destino", () => {
    const mkt = DEMO_ROT.find((r) => r.codigo === "PRIVA-MARKETING-001")!;
    expect(prtExternosBloqueados(mkt, DEMO_TERCEIROS).map((p) => p.nome)).toEqual(["Base de leads"]);
    expect(alertasPRTSemDestino(mkt)).toEqual([alertaPRTSemDestino("Relatório de campanha")]);
  });
});
