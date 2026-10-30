import { describe, expect, it } from "vitest";
import { contadorPadronizadas, finalidadeEquivalente, sugestaoFinalidade, sugerir } from "@/lib/priva/rot";
import { CITACAO_ART42_P1_I, NOTA_SUBOPERADOR, TITULO_CHECKLIST } from "@/lib/priva/terceiros";

describe("campo 6 — finalidade sugerida (v2)", () => {
  it("sugere por Área › Setor + insumo com origem v2", () => {
    const s = sugestaoFinalidade({ area_setor: "Recursos Humanos › Recrutamento", insumo: "currículo" });
    expect(s?.finalidade).toBe("Seleção e recrutamento de candidatos");
    expect(s?.origem).toBe("tabela determinística v2 · Área › Setor + insumo");
  });
  it("aviso de equivalência para texto livre aproximado, nunca para o padronizado", () => {
    expect(finalidadeEquivalente({ finalidade_especifica: "recrutamento de candidatos para vagas" })).toBe("Seleção e recrutamento de candidatos");
    expect(finalidadeEquivalente({ finalidade_especifica: "Seleção e recrutamento de candidatos" })).toBeNull();
  });
  it("contador X de Y", () => {
    expect(contadorPadronizadas([{ finalidade_especifica: "Seleção e recrutamento de candidatos" }, { finalidade_especifica: "outra" }])).toBe("1 de 2 finalidades padronizadas");
  });
  it("nunca pré-seleciona: sugestão não altera a linha", () => {
    const r = { area_setor: "Recursos Humanos › Recrutamento", insumo: "currículo", finalidade_especifica: "", categoria_titulares: [], dados_sensiveis: ["N/A"], dados_pessoais: [], salvaguardas: [], hipotese_tratamento: "", hipotese_sensivel: null, tempo_retencao: "", ciclo_vida: {}, genero_verbo: "Coletar" } as never;
    const d = sugerir(r); expect(d.some((x) => x.origem.includes("v2"))).toBe(true);
    expect((r as { finalidade_especifica: string }).finalidade_especifica).toBe("");
  });
  it("checklist renomeado e suboperador pelo art. 42, § 1º, I", () => {
    expect(TITULO_CHECKLIST).toBe("Checklist de cláusulas contratuais do método (não é transcrição do art. 39)");
    expect(NOTA_SUBOPERADOR).toContain("art. 42, § 1º, I");
    expect(CITACAO_ART42_P1_I).toContain("equipara-se ao controlador");
  });
});
