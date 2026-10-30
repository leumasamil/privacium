import { describe, expect, it } from "vitest";
import { ESPECIES, ESPECIES_PERMITIDAS, GENEROS, ISO_27002, alternar, formatarCiclo, validarCiclo } from "@/lib/priva/cicloVida";
import { DEMO_ROT } from "@/lib/priva/demo";

describe("ciclo de vida do dado pessoal (art. 5º, X)", () => {
  it("nenhuma espécie fora do elenco do art. 5º, X", () => {
    for (const g of GENEROS) for (const e of ESPECIES[g]) expect(ESPECIES_PERMITIDAS as readonly string[]).toContain(e);
  });
  it("gêneros e espécies exatamente como definidos", () => {
    expect(ESPECIES).toEqual({
      Coletar: ["receber", "extrair", "produzir", "classificar"], Reter: ["arquivar", "armazenar"],
      Processar: ["utilizar", "acessar", "avaliar ou controlar", "modificar", "reproduzir"],
      Compartilhar: ["transmitir", "distribuir", "comunicar", "transferir", "difundir"], Eliminar: ["eliminar"],
    });
  });
  it("multi-seleção formata de forma legível", () => {
    let c = alternar({}, "Coletar", "receber"); c = alternar(c, "Coletar", "classificar"); c = alternar(c, "Reter", "arquivar");
    expect(formatarCiclo(c)).toBe("Coletar › receber, classificar | Reter › arquivar");
    expect(validarCiclo(c)).toBeNull();
  });
  it("rejeita espécie fora do elenco e ciclo vazio", () => {
    expect(validarCiclo({ Coletar: ["vender"] })).toMatch(/fora do elenco/);
    expect(validarCiclo({})).toMatch(/ao menos uma espécie/);
  });
  it("ISO/IEC 27002 determinística por gênero", () => {
    expect(ISO_27002.Processar).toEqual(["ISO/IEC 27002 — 5.10 (uso aceitável)", "ISO/IEC 27002 — 8.11 (mascaramento)"]);
    expect(ISO_27002.Eliminar[1]).toContain("7.10");
  });
  it("linhas da demonstração usam só espécies válidas", () => {
    for (const r of DEMO_ROT) expect(validarCiclo(r.ciclo_vida as never)).toBeNull();
  });
});
