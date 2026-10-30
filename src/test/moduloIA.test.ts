import { describe, expect, it } from "vitest";
import { DIMENSOES_AIA, NIVEIS_RISCO_IA, PL_2338_RESSALVA, ROTULO_ESCOPO_IA, classificarRiscoIA, respostasAIA } from "@/lib/privacium/bibliotecaTextos";

describe("módulo Lei de IA — classificação determinística", () => {
  it("quatro níveis na ordem Excessivo → Mínimo", () => {
    expect(NIVEIS_RISCO_IA).toEqual(["Risco Excessivo", "Alto Risco", "Risco Limitado", "Risco Mínimo"]);
  });
  it("IA sobre dado pessoal sensível → Risco Excessivo, com critérios", () => {
    const c = classificarRiscoIA({ saud_tracking: true, sens_ai: true, decisao_automatizada: false, pessoais: true });
    expect(c.nivel).toBe("Risco Excessivo");
    expect(c.derivadoDe.join(" ")).toContain("dado pessoal sensível");
  });
  it("decisão automatizada sem dado sensível → Alto Risco (LGPD art. 20)", () => {
    expect(classificarRiscoIA({ saud_tracking: false, sens_ai: false, decisao_automatizada: true, pessoais: true }).nivel).toBe("Alto Risco");
  });
  it("dado pessoal comum com IA → Risco Limitado; sem nada → Risco Mínimo", () => {
    expect(classificarRiscoIA({ saud_tracking: false, sens_ai: false, decisao_automatizada: false, pessoais: true }).nivel).toBe("Risco Limitado");
    expect(classificarRiscoIA({ saud_tracking: false, sens_ai: false, decisao_automatizada: false, pessoais: false }).nivel).toBe("Risco Mínimo");
  });
  it("determinismo: mesma entrada, mesmo nível e mesmos critérios", () => {
    const e = { saud_tracking: true, sens_ai: true, decisao_automatizada: true, pessoais: true };
    expect(classificarRiscoIA(e)).toEqual(classificarRiscoIA(e));
  });
});

describe("módulo Lei de IA — AIA e ressalvas", () => {
  it("AIA tem os quatro eixos exigidos", () => {
    expect(DIMENSOES_AIA.map((d) => d.id)).toEqual(["autonomia", "afetados", "revisao", "mitigacao"]);
    expect(DIMENSOES_AIA[2]!.titulo).toContain("LGPD art. 20");
  });
  it("respostas AIA marcam 'sugerida' quando o RIPO tem dados", () => {
    const r = respostasAIA({ decisao_automatizada: true, sens_ai: false, pessoais: true });
    expect(r["autonomia"]!.sugerida).toBe(true);
    expect(r["autonomia"]!.resposta).toContain("LGPD art. 20");
    expect(respostasAIA({ decisao_automatizada: false, sens_ai: false, pessoais: false })["afetados"]!.sugerida).toBe(false);
  });
  it("ressalva de escopo e PL 2338 em tramitação, nunca como lei vigente", () => {
    expect(ROTULO_ESCOPO_IA).toContain("não substitui parecer jurídico");
    expect(PL_2338_RESSALVA).toContain("em tramitação");
    expect(PL_2338_RESSALVA).toContain("não é lei vigente");
  });
});
