import { describe, expect, it } from "vitest";
import { validarANPD, restanteANPD, type ComunicacaoANPD } from "@/lib/priva/anpd";
const valido: ComunicacaoANPD = { natureza: "Ransomware com criptografia de ativos", categorias: ["Nome"], titulares: "1", riscos: "R".repeat(30), medidas: "M".repeat(30) };
const etapas = [true, true, true, true, true, false];
describe("Comunicação ANPD", () => {
  it("exige categoria do ROT", () => expect(validarANPD({ ...valido, categorias: [] }, "contato@exemplo.org", etapas).map(x => x.campo)).toContain("categorias"));
  it("exige mínimo 1 titular inteiro", () => { for (const titulares of ["0", "-1", "1.5"]) expect(validarANPD({ ...valido, titulares }, "contato@exemplo.org", etapas).map(x => x.campo)).toContain("titulares"); expect(validarANPD(valido, "contato@exemplo.org", etapas)).toEqual([]); });
  it("exige 30 caracteres em riscos", () => expect(validarANPD({ ...valido, riscos: "R".repeat(29) }, "contato@exemplo.org", etapas).map(x => x.campo)).toContain("riscos"));
  it("exige 30 caracteres em medidas", () => expect(validarANPD({ ...valido, medidas: "M".repeat(29) }, "contato@exemplo.org", etapas).map(x => x.campo)).toContain("medidas"));
  it("exige contato cadastrado", () => expect(validarANPD(valido, "", etapas).map(x => x.campo)).toContain("encarregado"));
  it("exige as cinco etapas anteriores", () => { for (let i = 0; i < 5; i++) expect(validarANPD(valido, "contato@exemplo.org", etapas.map((p,j) => j === i ? false : p)).map(x => x.campo)).toContain(`etapa-${i}`); });
  it("prazo de 3 dias úteis congela no envio e ignora fim de semana", () => {
    // Conhecimento qui 01/01/2026 00:00 → limite ter 06/01 00:00 (sex, seg e ter úteis).
    // Enviado sex 02/01 00:00 → restam 48h úteis (sex 24h + seg 24h); sáb/dom não contam.
    expect(restanteANPD("2026-01-01T00:00:00Z", "2026-01-02T00:00:00Z", Date.parse("2026-01-10T00:00:00Z"))).toBe(48 * 3600000);
    // Sábado 03/01 12:00: restam 24h úteis (segunda inteira) — o fim de semana não consome prazo.
    expect(restanteANPD("2026-01-01T00:00:00Z", null, Date.parse("2026-01-03T12:00:00Z"))).toBe(24 * 3600000);
    // Segunda 05/01 00:00: ainda restam 24h úteis; com 72h corridas estaria zerado.
    expect(restanteANPD("2026-01-01T00:00:00Z", null, Date.parse("2026-01-05T00:00:00Z"))).toBe(24 * 3600000);
    // Depois do limite (ter 06/01 00:00): zero.
    expect(restanteANPD("2026-01-01T00:00:00Z", null, Date.parse("2026-01-07T00:00:00Z"))).toBe(0);
    expect(validarANPD(valido, "contato@exemplo.org", etapas)).toEqual([]);
  });
  it("a etapa 06 nunca é pré-requisito do envio: validação exige só as etapas 01 a 05", () => {
    expect(validarANPD(valido, "contato@exemplo.org", [true, true, true, true, true, false])).toEqual([]);
  });
});
