import { describe, expect, it } from "vitest";
import { calcularProximoPasso, blocoCorrente } from "@/lib/priva/proximoPasso";
import type { Pendencia } from "@/lib/priva/pendencias";

const p = (id: string, estado: Pendencia["estado"], responsavel: Pendencia["responsavel"] = "DPO_OPERACIONAL"): Pendencia =>
  ({ id, titulo: id, exige: "", responsavel, estado, bloco: 4, ancora: "x", acao: `fazer ${id}` });
const DPO = ["DPO_OPERACIONAL"];

describe("próximo passo único", () => {
  it("SLA vencido vem antes de tudo", () => {
    const r = calcularProximoPasso({ blocoTela: 4, blocoBase: 4, roles: DPO, itens: [p("a", "pendente"), p("b", "andamento"), p("anpd", "critico")] });
    expect(r.pendencia?.id).toBe("anpd");
  });
  it("em andamento vem antes de não iniciada, e assinatura por último", () => {
    const r = calcularProximoPasso({ blocoTela: 4, blocoBase: 4, roles: DPO, itens: [p("sig-dpo", "pendente"), p("a", "pendente"), p("b", "andamento")] });
    expect(r.pendencia?.id).toBe("b");
  });
  it("nada pendente avança para o próximo bloco", () => {
    const r = calcularProximoPasso({ blocoTela: 4, blocoBase: 4, roles: DPO, itens: [p("a", "ok")] });
    expect(r.tipo).toBe("concluido");
    expect(r.link.to).toBe("/bloco-5");
  });
  it("só assinatura da Diretoria pendente fica aguardando C_SUITE", () => {
    const r = calcularProximoPasso({ blocoTela: 2, blocoBase: 2, roles: DPO, itens: [p("sig-dir", "pendente", "C_SUITE")] });
    expect(r.tipo).toBe("aguardando");
  });
  it("bloco travado mostra o passo do bloco anterior", () => {
    const r = calcularProximoPasso({ blocoTela: 3, blocoBase: 2, roles: DPO, itens: [p("proc", "pendente")] });
    expect(r.tipo).toBe("travado");
  });
  it("bloco corrente é o primeiro PI sem chancela", () => {
    expect(blocoCorrente({ "PI-01": { by: "", ts: "", hash: "" } })).toBe(2);
  });
});
