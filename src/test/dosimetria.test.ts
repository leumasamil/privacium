import { describe, expect, it } from "vitest";
import { memoriaDosimetria, multaComAtenuantes, reducaoDosimetria, slaRestante, SLA_MS } from "@/lib/priva/dosimetria";

const todos = { "PI-01": 1, "PI-02": 1, "PI-03": 1, "PI-04": 1, "PI-05": 1 };
describe("dosimetria Res. CD/ANPD nº 4/2023", () => {
  it("PI-01 a PI-05 chancelados somam exatamente 75%", () => expect(reducaoDosimetria(todos)).toBe(75));
  it("PI-01 sozinho não concede os 20% (exige PI-02)", () => expect(reducaoDosimetria({ "PI-01": 1 })).toBe(0));
  it("PI-01 + PI-02 concedem 20%", () => expect(reducaoDosimetria({ "PI-01": 1, "PI-02": 1 })).toBe(20));
  it("PI-03 concede 20%", () => expect(reducaoDosimetria({ "PI-03": 1 })).toBe(20));
  it("PI-04 concede 20%", () => expect(reducaoDosimetria({ "PI-04": 1 })).toBe(20));
  it("PI-05 concede 15%", () => expect(reducaoDosimetria({ "PI-05": 1 })).toBe(15));
  it("multa de 1 milhão com 75% cai para 250 mil", () => expect(multaComAtenuantes(1_000_000, 75)).toBe(250_000));
  it("memória: 20 + 20 + 20 + 15 − (8 + 12 + 9) = 46%; base 500.000 resulta 270.000", () => {
    const m = memoriaDosimetria(todos, [
      { label: "Vazamento", pontosResiduaisNaoMitigados: 8 },
      { label: "Viés", pontosResiduaisNaoMitigados: 12 },
      { label: "Injeção", pontosResiduaisNaoMitigados: 9 },
    ], 500_000);
    expect(m.componentes.map((c) => c.percentual)).toEqual([20, 20, 20, 15]);
    expect(m.subtotal).toBe(75);
    expect(m.descontoResidual).toBe(29);
    expect(m.componentes.reduce((s, c) => s + c.percentual, 0) - m.residuais.reduce((s, r) => s + r.pontos, 0)).toBe(m.reducaoEfetiva);
    expect(m.reducaoEfetiva).toBe(46);
    expect(m.valorFinal).toBe(270_000);
    expect(m.valorFinal).toBe(500_000 * (1 - m.reducaoEfetiva / 100));
  });
  it("PI-05 não chancelado não contribui: 60 − 29 = 31%", () => {
    const { "PI-05": _pi05, ...assinados } = todos;
    const m = memoriaDosimetria(assinados, [{ label: "Residual", pontosResiduaisNaoMitigados: 29 }], 100_000);
    expect(m.componentes.map((c) => c.percentual)).toEqual([20, 20, 20, 0]);
    expect(m.reducaoEfetiva).toBe(31);
    expect(m.valorFinal).toBe(69_000);
  });
  it("teto de 75% sem riscos e piso de 0% quando desconto excede subtotal", () => {
    expect(memoriaDosimetria(todos, [], 500_000).reducaoEfetiva).toBe(75);
    const m = memoriaDosimetria({}, [{ label: "Residual", pontosResiduaisNaoMitigados: 25 }], 500_000);
    expect(m.reducaoEfetiva).toBe(0);
    expect(m.valorFinal).toBe(500_000);
  });
  it("valor final mantém centavos em vez de arredondar para reais inteiros", () => {
    expect(multaComAtenuantes(100.50, 75)).toBe(25.13);
  });
  it("sem pontos percentuais declarados não fabrica desconto a partir de escores", () => {
    const m = memoriaDosimetria(todos, [{ label: "Risco sem pontos declarados" }], 500_000);
    expect(m.descontoResidual).toBe(0);
    expect(m.reducaoEfetiva).toBe(75);
    expect(m.valorFinal).toBe(125_000);
  });
  it("prazo começa em 72h úteis (3 dias úteis) e zera após o limite", () => {
    expect(SLA_MS).toBe(72 * 3600 * 1000);
    const inicio = new Date(0).toISOString(); // qui 01/01/1970 00:00 → limite ter 06/01 00:00
    expect(slaRestante(inicio, 3600 * 1000)).toBe(71 * 3600 * 1000);
    // 80h corridas depois cai num domingo: restam 24h úteis (segunda), provando que o fim de semana não conta.
    expect(slaRestante(inicio, 80 * 3600 * 1000)).toBe(24 * 3600 * 1000);
    expect(slaRestante(inicio, 200 * 3600 * 1000)).toBe(0);
  });
});
