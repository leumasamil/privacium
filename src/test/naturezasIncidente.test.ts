import { describe, expect, it } from "vitest";
import { GRUPOS_NATUREZAS, NATUREZAS, OUTRO, PADRAO_RANSOMWARE, VERSAO_NATUREZAS, linhasNaturezas, naturezaInicial, vincularNatureza } from "@/lib/priva/naturezasIncidente";
import { prepararComunicacaoANPD, validarANPD, type ComunicacaoANPD } from "@/lib/priva/anpd";
const form: ComunicacaoANPD = { natureza: PADRAO_RANSOMWARE, categorias: ["Nome"], titulares: "1", riscos: "R".repeat(30), medidas: "M".repeat(30) };
describe("Catálogo ANPD Parte 2", () => {
  it("contém 22 naturezas distintas em seis grupos com 4, 5, 4, 3, 3 e 3 itens", () => {
    expect(NATUREZAS).toHaveLength(22); expect(new Set(NATUREZAS.map(n => n.valor)).size).toBe(22);
    expect(GRUPOS_NATUREZAS.map(g => g.itens.length)).toEqual([4, 5, 4, 3, 3, 3]);
  });
  it("vincula cada grupo à fonte exigida sem aceitar opção inventada", () => {
    expect(GRUPOS_NATUREZAS.map(g => [...new Set(g.itens.map(n => n.fonte_normativa))])).toEqual([
      ["NIST SP 800-61r3"], ["NIST SP 800-61r3 / MITRE ATT&CK"], ["NIST SP 800-61r3 / ENISA"], ["NIST SP 800-61r3"], ["MITRE ATT&CK / CISA KEV"], ["Descrição própria do DPO"],
    ]); expect(vincularNatureza("inventada")).toBeUndefined();
  });
  it("sugere ransomware apenas no formulário novo e preserva o legado enviado", () => {
    expect(naturezaInicial(undefined, false)).toBe(PADRAO_RANSOMWARE);
    expect(naturezaInicial("Ransomware", false)).toBe(PADRAO_RANSOMWARE);
    expect(naturezaInicial("Ransomware", true)).toBe("Ransomware");
  });
  it("exige uma principal do catálogo", () => expect(validarANPD({ ...form, natureza: "livre" }, "dpo@exemplo.org", [true,true,true,true,true]).map(m => m.campo)).toContain("natureza"));
  it("exige descrição de Outro principal ou secundário", () => {
    for (const f of [{ ...form, natureza: OUTRO }, { ...form, naturezasSecundarias: [OUTRO] }]) {
      expect(validarANPD(f, "dpo@exemplo.org", [true,true,true,true,true]).map(m => m.campo)).toContain("natureza-outro");
      expect(validarANPD({ ...f, naturezaOutro: "Ocorrência descrita pelo encarregado" }, "dpo@exemplo.org", [true,true,true,true,true])).toEqual([]);
    }
  });
  it("impede principal repetida e secundárias duplicadas ou desconhecidas", () => {
    for (const naturezasSecundarias of [[PADRAO_RANSOMWARE], ["DDoS", "DDoS"], ["inventada"]]) expect(validarANPD({ ...form, naturezasSecundarias }, "dpo@exemplo.org", [true,true,true,true,true]).map(m => m.campo)).toContain("natureza");
  });
  it("persiste pares e versão e disponibiliza ambas as fontes ao dossiê e PDF", () => {
    const p = prepararComunicacaoANPD({ ...form, naturezasSecundarias: ["Zero-day"] });
    expect(p.natureza_principal).toEqual({ valor: PADRAO_RANSOMWARE, fonte_normativa: "NIST SP 800-61r3" });
    expect(p.naturezas_secundarias).toEqual([{ valor: "Zero-day", fonte_normativa: "MITRE ATT&CK / CISA KEV" }]);
    expect(p.taxonomia_versao).toBe(VERSAO_NATUREZAS);
    expect(linhasNaturezas(p)).toEqual([`Natureza: ${PADRAO_RANSOMWARE} (NIST SP 800-61r3)`, "Natureza secundária: Zero-day (MITRE ATT&CK / CISA KEV)"]);
  });
  it("não atribui fonte retroativa a comunicação antiga", () => expect(linhasNaturezas({ natureza: "Ransomware" })).toEqual(["Natureza: Ransomware (Fonte não registrada na comunicação original)"]));
});