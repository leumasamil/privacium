import { describe, expect, it } from "vitest";
import { AREAS_SETORES, areaSetorCompleto, chaveDaArea, exibirAreaSetor } from "@/lib/priva/areasSetores";
import { ALERTA_RETENCAO, ETAPA1, ETAPA2, GENEROS, alertaRetencao, destinoDeclarado, formatarCicloEtapas, type CicloVida } from "@/lib/priva/cicloVida";
import { ALERTA_COERENCIA, HIPOTESES_7A, HIPOTESES_7B, alertasCoerencia, sugerir, type RotInput } from "@/lib/priva/rot";
import { DEMO_MEMBROS, DEMO_ROT } from "@/lib/priva/demo";
import { responsavelDaArea } from "@/components/priva/MembrosEmpresa";

const base = (p: Partial<RotInput> = {}): RotInput => ({
  empresa_cnpj: "00000000000100", setor: "RH", genero_verbo: "Coletar", ciclo_vida: {}, categoria_titulares: [], dados_pessoais: [],
  dados_sensiveis: ["N/A"], finalidade_especifica: "", hipotese_tratamento: "", hipotese_sensivel: null, tempo_retencao: "",
  base_prazo: "", compartilhamento: "Não Compartilhado", salvaguardas: [], infraestrutura: "Servidor Local",
  justificativa_mitigacao: null, area_setor: null, insumo: null, meio_fornecimento: null,
  papel_agente: "CONTROLADOR", contrato_controlador: null, produto_interno: null, destino_produto: null, prazo_produto: null, fundamento_produto: null, origem_compartilhamento: null, produtos_tratamento: [], ...p,
});

describe("Área › Setor", () => {
  it("monta a hierarquia e deriva a chave do ID", () => {
    expect(areaSetorCompleto("Recursos Humanos", "Seleção e Recrutamento")).toBe("Recursos Humanos › Seleção e Recrutamento");
    expect(chaveDaArea("Recursos Humanos")).toBe("RH");
    expect(exibirAreaSetor({ area_setor: null, setor: "Recepção" })).toBe("Recepção");
    expect(exibirAreaSetor({ area_setor: "Recepção › Controle de Acesso", setor: "Recepção" })).toBe("Recepção › Controle de Acesso");
    expect(AREAS_SETORES.length).toBe(7);
  });
});

describe("campo 2 em duas etapas", () => {
  it("Etapa 1 e Etapa 2 particionam os 5 gêneros sem sobreposição", () => {
    expect([...ETAPA1, ...ETAPA2].sort()).toEqual([...GENEROS].sort());
    expect(ETAPA1.filter((g) => ETAPA2.includes(g))).toEqual([]);
  });
  it("a exibição da planilha agrupa o ciclo por etapa", () => {
    const f = formatarCicloEtapas({ Coletar: ["receber"], Reter: ["arquivar"], Compartilhar: ["transferir"] });
    expect(f.e1).toBe("Coletar (receber); Reter (arquivar)");
    expect(f.e2).toBe("Compartilhar (transferir)");
    expect(formatarCicloEtapas({ Reter: ["armazenar"] }).e2).toBe("");
  });
  it("alerta de retenção perpétua: Reter sem destino dispara; com destino, não", () => {
    expect(alertaRetencao({ Reter: ["arquivar"] })).toBe(ALERTA_RETENCAO);
    expect(alertaRetencao({ Reter: ["arquivar"], Eliminar: ["eliminar"] })).toBeNull();
    expect(alertaRetencao({ Reter: ["arquivar"], Compartilhar: ["transferir"] })).toBeNull();
    expect(alertaRetencao({ Coletar: ["receber"] })).toBeNull();
  });
  it("destino declarado: compartilhamento com destinatário ou eliminação com prazo e fundamento", () => {
    expect(destinoDeclarado(base({ ciclo_vida: { Compartilhar: ["transferir"] }, compartilhamento: "Contabilidade X" }))).toBe(true);
    expect(destinoDeclarado(base({ ciclo_vida: { Compartilhar: ["transferir"] }, compartilhamento: "Não Compartilhado" }))).toBe(false);
    expect(destinoDeclarado(base({ ciclo_vida: { Eliminar: ["eliminar"] }, tempo_retencao: "6 meses", base_prazo: "Política interna" }))).toBe(true);
    expect(destinoDeclarado(base({ ciclo_vida: { Eliminar: ["eliminar"] }, tempo_retencao: "", base_prazo: "" }))).toBe(false);
    expect(destinoDeclarado(base({ ciclo_vida: { Reter: ["armazenar"] }, tempo_retencao: "5 anos", base_prazo: "CTN" }))).toBe(false);
  });
});

describe("sugestões determinísticas (item 5)", () => {
  it("nenhuma sugestão pré-seleciona: o formulário novo nasce vazio e sugerir não muta a entrada", () => {
    const f = base({ area_setor: "Recursos Humanos › Seleção e Recrutamento", insumo: "currículo", categoria_titulares: ["Candidatos"] });
    const antes = JSON.stringify(f);
    const dicas = sugerir(f);
    expect(JSON.stringify(f)).toBe(antes);
    expect(f.finalidade_especifica).toBe("");
    expect(f.hipotese_tratamento).toBe("");
    expect(dicas.length).toBeGreaterThan(0);
    expect(dicas.every((d) => d.origem.includes("tabela determinística v1"))).toBe(true);
  });
  it("a regra é determinística: mesma entrada, mesma saída", () => {
    const f = base({ area_setor: "Recursos Humanos › Seleção e Recrutamento", insumo: "currículo" });
    expect(sugerir(f)).toEqual(sugerir(f));
    expect(sugerir(f).find((d) => d.patch.finalidade_especifica)?.patch.finalidade_especifica).toBe("Seleção e recrutamento de candidatos");
  });
  it("hipótese do art. 11 só é sugerida com dado pessoal sensível declarado", () => {
    const sem = sugerir(base({ categoria_titulares: ["Colaboradores"] }));
    expect(sem.some((d) => d.patch.hipotese_sensivel)).toBe(false);
    const com = sugerir(base({ dados_sensiveis: ["Prontuário de Saúde"] }));
    expect(com.find((d) => d.patch.hipotese_sensivel)?.patch.hipotese_sensivel).toBe(HIPOTESES_7B[6]);
  });
});

describe("coerência dado × hipótese (item 6)", () => {
  it("filiação sindical + art. 11, II, d (exercício regular de direitos) alerta", () => {
    const a = alertasCoerencia(base({ dados_sensiveis: ["Filiação Sindical"], hipotese_sensivel: HIPOTESES_7B[4]! }));
    expect(a.length).toBe(1);
    expect(a[0]).toContain(ALERTA_COERENCIA);
  });
  it("filiação sindical + art. 11, II, a (obrigação legal) não alerta", () => {
    expect(alertasCoerencia(base({ dados_sensiveis: ["Filiação Sindical"], hipotese_sensivel: HIPOTESES_7B[1]! }))).toEqual([]);
  });
  it("prontuário de saúde em recrutamento alerta; em tutela da saúde, não", () => {
    expect(alertasCoerencia(base({ dados_sensiveis: ["Prontuário de Saúde"], finalidade_especifica: "Recrutamento e seleção" })).length).toBe(1);
    expect(alertasCoerencia(base({ dados_sensiveis: ["Prontuário de Saúde"], finalidade_especifica: "Acompanhamento ocupacional" }))).toEqual([]);
  });
  it("biometria + art. 11, I sem consentimento específico alerta; com indicação, não", () => {
    expect(alertasCoerencia(base({ dados_sensiveis: ["Biometria"], hipotese_sensivel: HIPOTESES_7B[0]! })).length).toBe(1);
    expect(alertasCoerencia(base({ dados_sensiveis: ["Biometria"], hipotese_sensivel: HIPOTESES_7B[0]!, justificativa_mitigacao: "Consentimento específico e destacado coletado no cadastro." }))).toEqual([]);
  });
  it("sem dado pessoal sensível, nenhum alerta", () => {
    expect(alertasCoerencia(base({ hipotese_tratamento: HIPOTESES_7A[1]! }))).toEqual([]);
  });
});

describe("demonstração cenográfica", () => {
  it("as quatro linhas do ROT demo têm Área › Setor, insumo e meio; todas com destino declarado", () => {
    for (const r of DEMO_ROT) {
      expect(r.area_setor).toContain("›");
      expect(r.insumo).toBeTruthy();
      expect(r.meio_fornecimento).toBeTruthy();
      expect(destinoDeclarado(r)).toBe(true);
    }
  });
  it("o responsável (R) da área é encontrado no cadastro de membros", () => {
    expect(responsavelDaArea(DEMO_MEMBROS, "Recursos Humanos › Folha de Pagamento")).toBe("Ana Cenográfica");
    expect(responsavelDaArea(DEMO_MEMBROS, "Marketing › Campanhas")).toBeNull();
  });
  it("o ciclo de vida das linhas demo é válido (espécies do art. 5º, X)", () => {
    for (const r of DEMO_ROT) {
      const c = r.ciclo_vida as CicloVida;
      for (const [g, es] of Object.entries(c)) for (const e of es) expect((ETAPA1.includes(g as never) || ETAPA2.includes(g as never)) && e.length > 0).toBe(true);
    }
  });
});
