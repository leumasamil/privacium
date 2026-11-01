import { describe, expect, it } from "vitest";
import { DEMO_ROT } from "@/lib/priva/demo";
import { alertaOrigemExcluida, alertaRetencaoLinha, alertasPRTSemDestino, pendenciasPI02 } from "@/lib/priva/rot";
import { linhasAtivas, montarCadeia } from "@/lib/priva/cadeiaCustodia";

const fin = DEMO_ROT.find(r => r.codigo === "PRIVA-FIN-001");
const jur = DEMO_ROT.find(r => r.codigo === "PRIVA-JURIDICO-001");
if (!fin || !jur) throw new Error("Fixtures obrigatórias ausentes");
describe("estados pendentes do receptor", () => {
  it("origem ausente é distinta de origem excluída e contém o código", () => {
    expect(alertaOrigemExcluida(jur, [])).toContain("não localizada (código PRIVA-COMERCIAL-002)");
    expect(alertaOrigemExcluida(jur, DEMO_ROT)).toContain("12/10/2026");
  });
  it("receptor pendente não dispara alerta de retenção", () => {
    expect(alertaRetencaoLinha(fin)).toBeNull();
    expect(alertaRetencaoLinha({ ...fin, origem_compartilhamento: null })).not.toBeNull();
  });
  it("comprovante pendente não conta como PRT sem destino", () => {
    expect(alertasPRTSemDestino(fin)).toEqual([]);
    expect(alertasPRTSemDestino({ ...fin, origem_compartilhamento: null })).toHaveLength(1);
  });
  it("semProduto é zero independentemente do destino do comprovante", () => {
    expect(pendenciasPI02(linhasAtivas(DEMO_ROT), []).semProduto).toBe(0);
  });
  it("decisão pendente isolada não bloqueia PI-02", () => {
    expect(pendenciasPI02([fin], []).ready).toBe(true);
    expect(pendenciasPI02([{ ...fin, produto_interno: null, produtos_tratamento: [] }], []).ready).toBe(false);
  });
  it("trilha do comprovante é pendente, nunca rompida ou completa", () => {
    expect(montarCadeia(DEMO_ROT).find(t => t.nomePRT === "Comprovante de pagamento")?.status.tipo).toBe("PENDENTE");
  });
});