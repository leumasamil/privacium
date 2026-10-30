import { describe, expect, it } from "vitest";
import { computeGM, riskZone, type Question } from "@/lib/priva/data";
import { sanitize } from "@/components/priva/AIShield";

const q = (id: string, weight: number): Question => ({ id, department: "TI", principle: "x", text: "x", weight });

describe("GM", () => {
  it("SIM soma o peso, NÃO soma zero, sobre o teto real do banco", () => {
    const bank = [q("a", 10), q("b", 6)];
    const r = computeGM({ a: true, b: false }, bank);
    expect(r.score).toBe(10);
    expect(r.gm).toBeCloseTo((10 / 16) * 100);
  });
  it("faixas de risco", () => {
    expect(riskZone(40).tone).toBe("destructive");
    expect(riskZone(41).tone).toBe("warning");
    expect(riskZone(75).tone).toBe("warning");
    expect(riskZone(75.9).tone).toBe("warning");
    expect(riskZone(76).tone).toBe("success");
  });
});

describe("Escudo de IA", () => {
  it("CPF e e-mail não saem no pacote", () => {
    const { out, vault } = sanitize("CPF 123.456.789-09 e a@b.com");
    expect(out).not.toContain("123.456.789-09");
    expect(out).not.toContain("a@b.com");
    expect(out).toMatch(/\[CPF_TOKEN_\d{4}\]/);
    expect(out).toMatch(/\[EMAIL_TOKEN_\d{4}\]/);
    expect(vault).toHaveLength(2);
  });
});

import { maskCPF as _mc, maskCNPJ as _mj, isValidCNPJ as _vj } from "@/lib/priva/data";
describe("Privacy by Default (blueprint)", () => {
  it("CPF mascarado no padrão ***.555.***-77", () => {
    expect(_mc("123.555.789-77")).toBe("***.555.***-77");
  });
  it("CNPJ mascarado esconde a raiz", () => {
    expect(_mj("11.222.333/0001-81")).toBe("**.222.***/****-81");
  });
  it("valida dígitos do CNPJ", () => {
    expect(_vj("11.222.333/0001-81")).toBe(true);
    expect(_vj("11.222.333/0001-82")).toBe(false);
  });
});

import { isValidCPF as _vc } from "@/lib/priva/data";
describe("CPF do auditor", () => {
  it("valida dígitos do CPF", () => {
    expect(_vc("529.982.247-25")).toBe(true);
    expect(_vc("529.982.247-24")).toBe(false);
  });
});

describe("Teto real 1414", () => {
  it("76% de 1414 entra na Zona Verde", () => {
    const bank = [q("a", 1075), q("b", 339)];
    const r = computeGM({ a: true }, bank);
    expect(r.bankMax).toBe(1414);
    expect(riskZone(r.gm).tone).toBe("success");
  });
});

import { isRisky, normalizeHipoteses, validateRot, type RotInput } from "@/lib/priva/rot";
describe("ROT · travas de risco", () => {
  const base: RotInput = { empresa_cnpj: "11222333000181", setor: "RH", genero_verbo: "Coletar", ciclo_vida: { Coletar: ["receber"] }, categoria_titulares: ["Colaboradores"], dados_pessoais: ["Nome"],
    dados_sensiveis: ["N/A"], finalidade_especifica: "Folha", hipotese_tratamento: "Art. 7º, II – Obrigação legal/regulatória", tempo_retencao: "5 anos",
    base_prazo: "Art. 12 da CLT", compartilhamento: "Não Compartilhado", salvaguardas: [], infraestrutura: "Servidor Local", justificativa_mitigacao: null, hipotese_sensivel: null };
  it("menores de idade ou dado pessoal sensível acionam a tarja vermelha", () => {
    expect(isRisky(base)).toBe(false);
    expect(isRisky({ ...base, categoria_titulares: ["Menores de Idade"] })).toBe(true);
    expect(isRisky({ ...base, dados_sensiveis: ["Biometria"] })).toBe(true);
  });
  it("linha de risco exige justificativa", () => {
    expect(validateRot({ ...base, categoria_titulares: ["Menores de Idade"] })).toMatch(/justificativa/);
    expect(validateRot({ ...base, categoria_titulares: ["Menores de Idade"], justificativa_mitigacao: "Acesso restrito RBAC e criptografia AES-256" })).toBeNull();
  });
  it("7A exige hipótese do art. 7º", () => {
    expect(validateRot({ ...base, hipotese_tratamento: "" })).toMatch(/7A/);
  });
  it("dado pessoal sensível exige 7B do art. 11", () => {
    const j = "Acesso restrito RBAC e criptografia AES-256";
    expect(validateRot({ ...base, dados_sensiveis: ["Biometria"], justificativa_mitigacao: j })).toMatch(/7B/);
    expect(validateRot({ ...base, dados_sensiveis: ["Biometria"], justificativa_mitigacao: j, hipotese_sensivel: "Art. 11, I – Consentimento específico e destacado" })).toBeNull();
  });
  it("sem dado pessoal sensível o 7B é limpo", () => {
    expect(normalizeHipoteses({ ...base, hipotese_sensivel: "Art. 11, I – x" }).hipotese_sensivel).toBeNull();
    expect(validateRot({ ...base, hipotese_sensivel: "Art. 11, I – x" })).toMatch(/7B/);
  });
  it("proíbe jargões europeus", () => {
    expect(validateRot({ ...base, finalidade_especifica: "conforme a base legal" })).toMatch(/proibido/);
  });
});

import { EXEMPLO_PROMPT, restore } from "@/components/priva/AIShield";
describe("Escudo de IA · nomes e reversão", () => {
  it("tokeniza nome, CPF e e-mail do exemplo e reverte no endpoint", () => {
    const { out, vault } = sanitize(EXEMPLO_PROMPT);
    expect(out).toBe(out.replace(/João da Silva|123\.456\.789-00|joao@email\.com/g, "X"));
    expect(out).toContain("[NOME_TOKEN_01]");
    expect(out).toMatch(/\[CPF_TOKEN_\d{4}\]/);
    expect(out).toMatch(/\[EMAIL_TOKEN_\d{4}\]/);
    expect(restore(out, vault)).toBe(EXEMPLO_PROMPT);
  });
});
