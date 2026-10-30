import { describe, expect, it } from "vitest";
import * as dos from "@/lib/priva/dosimetria";
import { SLA_MS, slaRestante, SIMULADOR_EM_REVISAO, AVISO_SIMULADOR, LITERAL_RES4_ART13 } from "@/lib/priva/dosimetria";

describe("Dosimetria (Res. CD/ANPD nº 4/2023)", () => {
  it("simulador desabilitado com o aviso de revisão", () => {
    expect(SIMULADOR_EM_REVISAO).toBe(true);
    expect(AVISO_SIMULADOR).toBe("Simulador em revisão — percentuais em conferência com a Res. CD/ANPD nº 4/2023");
  });
  it("percentuais não verificados (15% RIPD, teto 75%) não existem mais", () => {
    expect("TETO_REDUCAO" in dos).toBe(false);
    expect("DOSIMETRIA" in dos).toBe(false);
    expect("reducaoDosimetria" in dos).toBe(false);
  });
  it("art. 13 transcrito: II = 20% e IV = 5%", () => {
    expect(LITERAL_RES4_ART13.find((l) => l.startsWith("II -"))).toContain("20% (vinte por cento)");
    expect(LITERAL_RES4_ART13.find((l) => l.startsWith("IV -"))).toContain("5% (cinco por cento)");
  });
  it("prazo começa em 72h úteis (3 dias úteis)", () => {
    expect(SLA_MS).toBe(72 * 3600 * 1000);
    expect(slaRestante(null, Date.now())).toBe(SLA_MS);
  });
});
