import { describe, expect, it } from "vitest";
import { multaComAtenuantes, reducaoDosimetria, slaRestante, SLA_MS } from "@/lib/priva/dosimetria";

const todos = { "PI-01": 1, "PI-02": 1, "PI-03": 1, "PI-04": 1, "PI-05": 1 };
describe("dosimetria Res. CD/ANPD nº 4/2023", () => {
  it("PI-01 a PI-05 chancelados somam exatamente 75%", () => expect(reducaoDosimetria(todos)).toBe(75));
  it("PI-01 sozinho não concede os 20% (exige PI-02)", () => expect(reducaoDosimetria({ "PI-01": 1 })).toBe(0));
  it("PI-01 + PI-02 concedem 20%", () => expect(reducaoDosimetria({ "PI-01": 1, "PI-02": 1 })).toBe(20));
  it("PI-03 concede 20%", () => expect(reducaoDosimetria({ "PI-03": 1 })).toBe(20));
  it("PI-04 concede 20%", () => expect(reducaoDosimetria({ "PI-04": 1 })).toBe(20));
  it("PI-05 concede 15%", () => expect(reducaoDosimetria({ "PI-05": 1 })).toBe(15));
  it("multa de 1 milhão com 75% cai para 250 mil", () => expect(multaComAtenuantes(1_000_000, 75)).toBe(250_000));
  it("prazo começa em 72h úteis (3 dias úteis) e zera após o limite", () => {
    expect(SLA_MS).toBe(72 * 3600 * 1000);
    const inicio = new Date(0).toISOString(); // qui 01/01/1970 00:00 → limite ter 06/01 00:00
    expect(slaRestante(inicio, 3600 * 1000)).toBe(71 * 3600 * 1000);
    // 80h corridas depois cai num domingo: restam 24h úteis (segunda), provando que o fim de semana não conta.
    expect(slaRestante(inicio, 80 * 3600 * 1000)).toBe(24 * 3600 * 1000);
    expect(slaRestante(inicio, 200 * 3600 * 1000)).toBe(0);
  });
});
