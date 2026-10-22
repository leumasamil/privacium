import { describe, it, expect } from "vitest";
import { cicloSemestral } from "@/lib/priva/ciclo";

describe("régua do ciclo semestral", () => {
  it("dia 1 do novo ciclo", () => expect(cicloSemestral(new Date(2026, 6, 1, 10)).fase).toBe("dia1"));
  it("faltando 30 dias = alerta amarelo", () => expect(cicloSemestral(new Date(2026, 5, 1, 10)).fase).toBe("alerta30"));
  it("faltando 31+ dias = normal", () => expect(cicloSemestral(new Date(2026, 4, 30, 10)).fase).toBe("normal"));
  it("faltando 7 dias = urgência", () => expect(cicloSemestral(new Date(2026, 5, 24, 10)).fase).toBe("urgente7"));
  it("congelamento na véspera do fim", () => expect(cicloSemestral(new Date(2026, 9, 1)).congelamento.getDate()).toBe(31));
});

import { respostaHerdada, assinaturasVigentes } from "@/lib/priva/ciclo";
import { isUnlocked } from "@/lib/priva/store";
describe("Delta de Riscos", () => {
  const hoje = new Date(2026, 6, 1, 10);
  it("resposta do semestre anterior é herdada", () => expect(respostaHerdada(new Date(2026, 5, 20).toISOString(), hoje)).toBe(true));
  it("resposta do ciclo vigente não é herdada", () => expect(respostaHerdada(new Date(2026, 6, 1, 9).toISOString(), hoje)).toBe(false));
  it("PI-01 do ciclo anterior não destrava o Bloco 2", () => {
    const sigs = assinaturasVigentes({ "PI-01": { ts: new Date(2026, 5, 20).toISOString() } }, hoje);
    expect(isUnlocked(sigs as never, 2)).toBe(false);
  });
  it("PI-01 do ciclo vigente destrava o Bloco 2", () => {
    const sigs = assinaturasVigentes({ "PI-01": { ts: new Date(2026, 6, 1, 9).toISOString() } }, hoje);
    expect(isUnlocked(sigs as never, 2)).toBe(true);
  });
});
