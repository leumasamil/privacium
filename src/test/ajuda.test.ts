import { describe, expect, it } from "vitest";
import { AJUDA, AJUDA_KANBAN } from "@/lib/priva/ajuda";
import { ordenar, pendenciasBloco5, pendenciasKanban } from "@/lib/priva/pendencias";
const paineis = [AJUDA[1]!, AJUDA[2]!, AJUDA[3]!, AJUDA[4]!, AJUDA[5]!, AJUDA_KANBAN];
describe("ajuda 5W2H operacional", () => {
  it.each(paineis.map((p) => [p.titulo, p]))("%s: ≥5 passos com ação, resultado e plano B", (_t, p) => {
    expect(p.passos.length).toBeGreaterThanOrEqual(5);
    for (const s of p.passos) for (const c of [s.titulo, s.acao, s.resultado, s.seNao]) expect(c.trim().length).toBeGreaterThan(5);
  });
  it.each(paineis.map((p) => [p.titulo, p]))("%s: campo Como é resumo, não índice", (_t, p) => {
    expect(p.como).not.toMatch(/^Conforme o passo a passo/);
    expect(p.como.length).toBeGreaterThan(120);
  });
});
describe("como resolver", () => {
  it("vencidas vêm antes das concluídas", () => {
    const b = { titulo: "", exige: "", responsavel: "DPO_OPERACIONAL" as const, bloco: 4, ancora: "", acao: "" };
    expect(ordenar([{ ...b, id: "a", estado: "ok" }, { ...b, id: "b", estado: "critico" }, { ...b, id: "c", estado: "pendente" }]).map((i) => i.id)).toEqual(["b", "c", "a"]);
  });
  it("Bloco 5 aponta o risco sem mitigação e exige duas assinaturas", () => {
    const c = pendenciasBloco5({ sistema: "LLM interno", escudo: "x".repeat(30), riscos: [{ label: "Viés", mitig: "" }] }, {});
    expect(c.find((i) => i.id === "mitig")!.acao).toBe('Mitigar o risco "Viés"');
    expect(c.filter((i) => i.id.startsWith("sig"))).toHaveLength(2);
  });
  it("Kanban: cartão aberto sem responsável é pendência", () => {
    expect(pendenciasKanban([{ id: "1", what: "Treinar RH", who: "", when: "2026-11-01", column: "todo" }])[0]!.exige).toBe("sem responsável.");
  });
});
