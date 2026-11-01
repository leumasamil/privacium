import { describe, expect, it } from "vitest";
// Testes da remoção de registros de teste do dossiê (migração 0045).
import { DEMO_ROT, DEMO_ROWS } from "@/lib/priva/demo";
import { NOTA_HASH_ASSINATURA, linhasAtivas, linhasExcluidas, rotuloEtapa1Receptor, incisoSustentado, montarCadeia, receptoraExistente, relatorioProvaCadeia, rotuloStatus, trilhasDoNo } from "@/lib/priva/cadeiaCustodia";
import { BIBLIOTECA_NORMATIVA } from "@/lib/priva/bibliotecaNormativa";
import { rotuloReducaoDosimetria } from "@/lib/priva/dosimetria";

const trilhas = montarCadeia(DEMO_ROT);
const achar = (nome: string) => trilhas.find((t) => t.nomePRT === nome)!;

describe("cadeia de custódia", () => {
  it("PRT com duas assinaturas sem escolha do receptor aguarda tratamento", () => {
    const t=achar('Relatório de folha consolidado');
    expect(t.status.tipo === 'ROMPE' && t.status.motivo).toBe('Aguardando tratamento pelo receptor');
  });
  it('eliminação expressa no receptor é cadeia completa',()=>{
    const linhas=DEMO_ROT.map(r=>r.id==='demo-rot-4'?{...r,continuacao_receptor:{tipo:'ELIMINACAO',em:'2026-11-01',hash:'hash-auditado'}}:r);
    expect(montarCadeia(linhas).find(t=>t.nomePRT==='Relatório de folha consolidado')?.status.tipo).toBe('COMPLETA');
  });
  it('novo PRT continua até o segundo salto',()=>{
    const assinatura={assinante:'DPO de teste',etapa:2,em:'2026-11-01',sha256:'hash'};
    const linhas=DEMO_ROT.map(r=>r.id==='demo-rot-4'?{...r,continuacao_receptor:{tipo:'NOVO_PRT'},assinatura_etapa2:assinatura,produtos_tratamento:[{nome:'Produto receptor',destino:{tipo:'INTERNO',area_setor_destino:'Jurídico › Contencioso',linha_receptor_id:'demo-rot-5'}}]}:r.id==='demo-rot-5'?{...r,assinatura_etapa1:assinatura,continuacao_receptor:{tipo:'USO_EXCLUSIVO',anonimizados:true,sem_acesso_terceiro:true}}:r);
    const t=montarCadeia(linhas).find(t=>t.nomePRT==='Relatório de folha consolidado');
    expect(t?.arestas.length).toBe(2);expect(t?.status.tipo).toBe('COMPLETA');
  });
  it("PRT sem destino rompe no nó de origem", () => {
    expect(rotuloStatus(achar("Relatório de campanha").status)).toBe("Rompe em: Marketing › Relacionamento · PRIVA-MARKETING-001");
  });
  it("assinatura da Etapa 2 ausente rompe a cadeia", () => {
    const t = achar("Base de leads");
    expect(t.status.tipo === "ROMPE" && t.status.motivo).toBe("assinatura da Etapa 2 (DPO) ausente");
  });
  it("linha excluída logicamente aparece no grafo como removida, com data e motivo", () => {
    const t = trilhas.find((x) => x.origem.codigo === "PRIVA-COMERCIAL-002")!;
    expect(t.origem.removido).toBe(true);
    expect(t.status.tipo === "ROMPE" && t.status.motivo).toBe("excluída logicamente em 12/10/2026 por DPO (cenográfica) — motivo: Processo de cobrança terceirizado e encerrado internamente");
  });
  it("linha excluída sai da planilha mestre e vai para a seção histórica do PI-02", () => {
    expect(linhasAtivas(DEMO_ROT).map((r) => r.codigo)).not.toContain("PRIVA-COMERCIAL-002");
    expect(linhasExcluidas(DEMO_ROT).map((r) => r.codigo)).toEqual(["PRIVA-COMERCIAL-002"]);
  });
  it("origem apagada antes da migração 0044 é declarada como lacuna não recuperável", () => {
    const semOrigem = DEMO_ROT.filter((r) => r.id !== "demo-rot-removida");
    const t = montarCadeia(semOrigem).find((x) => x.origem.removido)!;
    expect(t.status.tipo === "ROMPE" && t.status.motivo).toBe("origem excluída antes da migração 0044 — data e motivo não recuperáveis");
  });
  it("destino Interno sem linha receptora mostra Etapa 1 receptor ausente; Externo mostra não se aplica", () => {
    expect(rotuloEtapa1Receptor(achar("Ficha cadastral").arestas[0]!)).toBe("ausente");
    expect(rotuloEtapa1Receptor(achar("Demonstrativo de pagamento").arestas[0]!)).toBe("não se aplica");
  });
  it("compartilhar o mesmo PRT de novo com o mesmo setor vincula à linha existente", () => {
    expect(receptoraExistente(DEMO_ROT, "demo-rot-1", "Financeiro › Contas a Pagar", "Relatório de folha consolidado")?.codigo).toBe("PRIVA-FIN-001");
    expect(receptoraExistente(DEMO_ROT, "demo-rot-1", "Jurídico › Contencioso", "Relatório de folha consolidado")).toBeNull();
  });
  it("relatório traz art. 43 integral e não afirma a excludente", () => {
    const art43 = BIBLIOTECA_NORMATIVA.find((e) => e.identificador === "art. 43")!;
    const no = DEMO_ROT.find((r) => r.id === "demo-rot-4")!;
    const doNo = trilhasDoNo(trilhas, no.id);
    const txt = relatorioProvaCadeia({ noSelecionado: no, trilhas: doNo, linhas: DEMO_ROT, incidenteId: "x", art43Literal: art43.texto_literal!, art43Url: art43.url_oficial, geradoEm: "2026-10-30" });
    expect(txt).toContain("III - que o dano é decorrente de culpa exclusiva");
    expect(txt).toContain("Não afirma que a excludente");
    expect(incisoSustentado(doNo)).toMatch(/^Nenhum inciso/);
    expect(txt).toContain(NOTA_HASH_ASSINATURA);
  });
  it("relatório do nó receptor exibe data e motivo da origem removida e a seleção registrada", () => {
    const art43 = BIBLIOTECA_NORMATIVA.find((e) => e.identificador === "art. 43")!;
    const no = DEMO_ROT.find((r) => r.id === "demo-rot-5")!;
    const txt = relatorioProvaCadeia({ noSelecionado: no, trilhas: trilhasDoNo(trilhas, no.id), linhas: DEMO_ROT, incidenteId: "x", art43Literal: art43.texto_literal!, art43Url: art43.url_oficial, geradoEm: "2026-10-30", selecao: { ts: "2026-10-30T12:00:00Z", hash: "abc123" } });
    expect(txt).toContain("REMOVIDA: excluída logicamente em 12/10/2026 por DPO (cenográfica) — motivo: Processo de cobrança terceirizado e encerrado internamente");
    expect(txt).toContain("Seleção do nó registrada na trilha: 2026-10-30T12:00:00Z · SHA-256 abc123");
  });
});

describe("dosimetria legada", () => {
  it("nenhum ciclo exibe percentual do método rejeitado", () => {
    for (const c of DEMO_ROWS.ciclos_priva) expect(rotuloReducaoDosimetria(c.reducao_dosimetria)).toBe("não calculado");
    expect(rotuloReducaoDosimetria(48)).toBe("não calculado");
  });
});
