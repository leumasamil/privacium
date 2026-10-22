import { describe, expect, it } from "vitest";
import { computeGM, riskZone, type Question } from "@/lib/priva/data";
import { sanitize } from "@/components/priva/AIShield";

const q = (id: number, weight: number): Question => ({ id, department: "TI", principle: "x", text: "x", weight });

describe("GM", () => {
  it("SIM soma o peso, NÃO soma zero, na régua de 1660", () => {
    const bank = [q(1, 10), q(2, 6)];
    const r = computeGM({ 1: true, 2: false }, bank);
    expect(r.raw).toBe(10);
    expect(r.score).toBe(Math.round((10 / 16) * 1660));
  });
  it("faixas de risco", () => {
    expect(riskZone(40).tone).toBe("destructive");
    expect(riskZone(41).tone).toBe("warning");
    expect(riskZone(75).tone).toBe("warning");
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
