import { describe, expect, it } from "vitest";
import { multaComAtenuantes, reducaoDosimetria, slaRestante, SLA_MS } from "@/lib/priva/dosimetria";

describe("dosimetria", () => {
  it("todos os PI-01..PI-04 chancelados reduzem 75%", () => {
    expect(reducaoDosimetria({ "PI-01": 1, "PI-02": 1, "PI-03": 1, "PI-04": 1 })).toBe(75);
  });
  it("sem PIs não há redução", () => expect(reducaoDosimetria({})).toBe(0));
  it("é cumulativa", () => expect(reducaoDosimetria({ "PI-01": 1, "PI-03": 1 })).toBe(40));
  it("multa de 1 milhão com 75% cai para 250 mil", () => expect(multaComAtenuantes(1_000_000, 75)).toBe(250_000));
  it("SLA começa em 72h e zera após o prazo", () => {
    expect(SLA_MS).toBe(72 * 3600 * 1000);
    const inicio = new Date(0).toISOString();
    expect(slaRestante(inicio, 3600 * 1000)).toBe(71 * 3600 * 1000);
    expect(slaRestante(inicio, 80 * 3600 * 1000)).toBe(0);
  });
});
