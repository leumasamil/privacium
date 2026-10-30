import { describe, expect, it } from "vitest";
import { computeGM, riskZone, type Question } from "@/lib/priva/data";
import { demoAnswers, DEMO_SIGNATURES, DEMO_MULTA_BASE } from "@/lib/priva/demo";
import { multaComAtenuantes, reducaoDosimetria } from "@/lib/priva/dosimetria";

const deps = ["RH", "TI", "Marketing", "Compras", "Recepção", "Jurídico", "Financeiro"];
const ws = [10, 9, 8, 7];
// 166 perguntas com pesos 10/9/8/7 somando 1414 (mesma distribuição do banco)
const qs: Question[] = Array.from({ length: 166 }, (_, i) => ({ id: `q${i}`, department: deps[i % 7]!, principle: "", text: "", weight: ws[i % 4]! }));
let soma = qs.reduce((s, q) => s + q.weight, 0);
for (let i = 0; soma !== 1414; i++) { const q = qs[i]!; const d = soma > 1414 ? -1 : 1; if (q.weight + d >= 7 && q.weight + d <= 10) { q.weight += d; soma += d; } }

describe("Modo Demonstração", () => {
  it("diagnóstico marca exatamente 1075 de 1414 pontos e fica na zona verde", () => {
    const r = computeGM(demoAnswers(qs), qs);
    expect(r.score).toBe(1075);
    expect(r.bankMax).toBe(1414);
    expect(riskZone(r.gm).tone).toBe("success");
  });
  it("multa de R$ 100.000 cai para R$ 25.000 com todos os PIs chancelados", () => {
    expect(multaComAtenuantes(DEMO_MULTA_BASE, reducaoDosimetria({ ...DEMO_SIGNATURES, "PI-05": 1 }))).toBe(25_000);
  });
});
