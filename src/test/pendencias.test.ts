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
});
