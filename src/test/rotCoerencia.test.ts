import { describe, expect, it } from "vitest";
import { DEMO_ROT } from "@/lib/priva/demo";
import { cicloDaLinha } from "@/lib/priva/cicloVida";
import { alertaOrigemExcluida, alertaProduzirSemPRT, produtosDaLinha, receptorSemEscolha, validateRot } from "@/lib/priva/rot";

function linha(codigo: string) {
  const row = DEMO_ROT.find(r => r.codigo === codigo);
  if (!row) throw new Error(`Fixture ausente: ${codigo}`);
  return row;
}

describe("cinco quebras de coerência do ROT", () => {
  it("Financeiro sem escolha não declara destino definitivo; Jurídico decidiu ELIMINACAO de forma coerente", () => {
    const fin = linha("PRIVA-FIN-001");
    expect(receptorSemEscolha(fin)).toBe(true);
    expect(cicloDaLinha(fin).Eliminar).toBeUndefined();
    expect(validateRot({ ...fin, ciclo_vida: { ...cicloDaLinha(fin), Eliminar: ["eliminar"] } })).not.toBeNull();
    const jur = linha("PRIVA-JURIDICO-001");
    expect(receptorSemEscolha(jur)).toBe(false);
    expect(jur.continuacao_receptor).toMatchObject({ tipo: "ELIMINACAO" });
    expect(cicloDaLinha(jur).Eliminar).toContain("eliminar");
  });
  it("destino de PRT sem escolha é recusado; depois de NOVO_PRT registrado é aceito", () => {
    const r = { ...linha("PRIVA-FIN-001"), dados_sensiveis: ["N/A"], produtos_tratamento: [{ nome: "Comprovante de pagamento", destino: { tipo: "ELIMINACAO", prazo: "5 anos", fundamento: "Política interna" } }] };
    expect(validateRot(r)).not.toBeNull();
    expect(validateRot({ ...r, continuacao_receptor: { tipo: "NOVO_PRT", em: "2026-11-01", hash: "auditado" } })).toBeNull();
  });
  it("Financeiro processa o insumo e possui comprovante como PRT sem destino prévio", () => {
    const r = linha("PRIVA-FIN-001");
    expect(cicloDaLinha(r).Processar).toContain("utilizar");
    expect(produtosDaLinha(r)).toEqual([{ nome: "Comprovante de pagamento", destino: null }]);
  });
  it("Jurídico identifica a origem excluída em 12/10/2026, sem excluir o receptor", () => {
    const r = linha("PRIVA-JURIDICO-001");
    expect(alertaOrigemExcluida(r, DEMO_ROT)).toContain("12/10/2026");
    expect(r.excluido_em).toBeNull();
    expect(alertaOrigemExcluida(linha("PRIVA-FIN-001"), DEMO_ROT)).toBeNull();
  });
  it("Recepção registra o produto do verbo produzir com destino ELIMINACAO", () => {
    const r = linha("PRIVA-RECEPCAO-001");
    expect(cicloDaLinha(r).Coletar).toContain("produzir");
    expect(produtosDaLinha(r)[0]?.destino?.tipo).toBe("ELIMINACAO");
    expect(alertaProduzirSemPRT(r)).toBeNull();
  });
  it("produzir sem PRT sinaliza e impede salvar; nomes vazios não satisfazem a regra", () => {
    const r = { ...linha("PRIVA-RECEPCAO-001"), produto_interno: null, produtos_tratamento: [{ nome: " " }] };
    expect(alertaProduzirSemPRT(r)).not.toBeNull();
    expect(validateRot(r)).not.toBeNull();
    expect(alertaProduzirSemPRT({ ...r, ciclo_vida: { Coletar: ["receber"] } })).toBeNull();
  });
});