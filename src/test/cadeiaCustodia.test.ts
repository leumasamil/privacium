import { describe, expect, it } from "vitest";
import { DEMO_ROT, DEMO_ROWS } from "@/lib/priva/demo";
import { incisoSustentado, montarCadeia, receptoraExistente, relatorioProvaCadeia, rotuloStatus, trilhasDoNo } from "@/lib/priva/cadeiaCustodia";
import { BIBLIOTECA_NORMATIVA } from "@/lib/priva/bibliotecaNormativa";
import { rotuloReducaoDosimetria } from "@/lib/priva/dosimetria";

const trilhas = montarCadeia(DEMO_ROT);
const achar = (nome: string) => trilhas.find((t) => t.nomePRT === nome)!;

describe("cadeia de custódia", () => {
  it("PRT com destino interno assinado nas duas pontas é Completa", () => {
    expect(rotuloStatus(achar("Relatório de folha consolidado").status)).toBe("Completa");
  });
  it("PRT sem destino rompe no nó de origem", () => {
    expect(rotuloStatus(achar("Relatório de campanha").status)).toBe("Rompe em: Marketing › Relacionamento · PRIVA-MARKETING-001");
  });
  it("assinatura da Etapa 2 ausente rompe a cadeia", () => {
    const t = achar("Base de leads");
    expect(t.status.tipo === "ROMPE" && t.status.motivo).toBe("assinatura da Etapa 2 (DPO) ausente");
  });
  it("linha receptora com origem removida exibe a ruptura no nó removido", () => {
    const t = trilhas.find((x) => x.origem.removido)!;
    expect(t.origem.codigo).toBe("PRIVA-COMERCIAL-002");
    expect(t.status.tipo === "ROMPE" && t.status.motivo).toBe("origem removida");
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
    expect(incisoSustentado(doNo)).toMatch(/^Inciso II/);
  });
});

describe("dosimetria legada", () => {
  it("nenhum ciclo exibe percentual do método rejeitado", () => {
    for (const c of DEMO_ROWS.ciclos_priva) expect(rotuloReducaoDosimetria(c.reducao_dosimetria)).toBe("não calculado");
    expect(rotuloReducaoDosimetria(48)).toBe("não calculado");
  });
});
