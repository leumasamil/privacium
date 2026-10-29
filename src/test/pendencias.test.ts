import { describe, it, expect } from "vitest";
import { montarChecklist, proximoPasso } from "@/lib/priva/pendencias";

describe("checklist da tela de bloqueio", () => {
  it("Bloco 1 lista as perguntas que faltam", () => {
    const c = montarChecklist({ n: 1, perguntas: 166, respondidas: 100, naos: 10 }, {});
    expect(c.find((i) => i.id === "diag")!.exige).toContain("Faltam 66 de 166");
  });
  it("PI-02 exige duas assinaturas: DPO e Diretoria", () => {
    const c = montarChecklist({ n: 2, rot: [] }, {});
    expect(c.filter((i) => i.id.startsWith("sig")).map((i) => i.responsavel)).toEqual(["DPO_OPERACIONAL", "C_SUITE"]);
  });
  it("PI-01 exige só a assinatura do DPO", () => {
    const c = montarChecklist({ n: 1, perguntas: 1, respondidas: 1, naos: 0 }, {});
    expect(c.filter((i) => i.id.startsWith("sig"))).toHaveLength(1);
  });
  it("com DPO assinado, o próximo passo do DPO é nada dele — sobra a Diretoria", () => {
    const sig = { by: "x", ts: "t", hash: "h" };
    const c = montarChecklist({ n: 3, endpoints: [{ protegido: true }], cofres: [{ hash_integridade: "a" }], chaves: 1 }, { "PI-03-DPO": sig });
    expect(proximoPasso(c, ["DPO_OPERACIONAL"])!.id).toBe("sig-dir");
  });
  it("Bloco 4 sem incidente encerrado pede um incidente", () => {
    const c = montarChecklist({ n: 4, lotes: [], incidentes: [], agora: 0 }, {});
    expect(c.map((i) => i.id)).toContain("inc");
  });
  it("lote do mês corrente sem hash não bloqueia; mês anterior sem hash bloqueia", () => {
    const agora = Date.parse("2026-10-15T12:00:00Z");
    const so = montarChecklist({ n: 4, lotes: [{ mes_referencia: "2026-10", hash_sha256: null }], incidentes: [], agora }, {});
    expect(so.find((i) => i.id === "lote")!.estado).toBe("ok");
    const ant = montarChecklist({ n: 4, lotes: [{ mes_referencia: "2026-09", hash_sha256: null }], incidentes: [], agora }, {});
    expect(ant.find((i) => i.id === "lote")!.acao).toBe("Selar o lote de setembro/2026");
  });
  it("incidente com SLA de 72h estourado é crítico", () => {
    const agora = Date.parse("2026-10-15T12:00:00Z");
    const c = montarChecklist({ n: 4, lotes: [], incidentes: [{ id: "a54ac7ff", passos: [true, false, false, false, false, false], iniciado_em: "2026-10-11T12:00:00Z", enviado_anpd_em: null, encerrado_em: null }], agora }, {});
    expect(c.find((i) => i.id === "anpd-a54ac7ff")!.estado).toBe("critico");
    expect(c.find((i) => i.id === "inc-a54ac7ff")!.acao).toBe("Concluir a etapa 2 de 6 do incidente #a54ac7");
  });
});
