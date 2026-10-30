import { describe, expect, it } from "vitest";
import { BIBLIOTECA_TEXTOS, CABECALHO_MODELO, RODAPE_MODELO, textoCompleto, enveloparModelo, VERSAO_TEXTOS, type TextoId } from "@/lib/privacium/bibliotecaTextos";

const IDS: TextoId[] = ["politica-ia", "clausula-llm", "rot-llm", "convencao-hostname", "inventario-cofre", "estrutura-pasta-rot", "dossie-pi03"];

describe("biblioteca de textos determinística", () => {
  it("cobre os sete modelos exigidos, com fonte e PI de origem", () => {
    expect(Object.keys(BIBLIOTECA_TEXTOS).sort()).toEqual([...IDS].sort());
    for (const id of IDS) {
      const t = BIBLIOTECA_TEXTOS[id];
      expect(t.corpo.length).toBeGreaterThan(100);
      expect(t.fonte).toBeTruthy();
      expect(t.pi).toMatch(/^PI-0[1-5]$/);
    }
  });
  it("mesma entrada gera o mesmo texto (determinismo)", () => {
    expect(textoCompleto(BIBLIOTECA_TEXTOS["politica-ia"])).toBe(textoCompleto(BIBLIOTECA_TEXTOS["politica-ia"]));
    expect(VERSAO_TEXTOS).toBe("2026.10-1");
  });
  it("cópia sai com cabeçalho e rodapé obrigatórios", () => {
    const t = BIBLIOTECA_TEXTOS["dossie-pi03"];
    const completo = textoCompleto(t);
    expect(completo.startsWith(CABECALHO_MODELO(t))).toBe(true);
    expect(completo).toContain("MODELO SUGERIDO PELO PRIVACIUM · Origem: PI-03 (Book de Evidências Tecnológicas e Contratuais) · Fonte: LGPD art. 46 / ISO/IEC 27701 · Revise e adapte antes de assinar.");
    expect(completo.endsWith(RODAPE_MODELO)).toBe(true);
    expect(RODAPE_MODELO).toBe("Este é um modelo, não um parecer. A responsabilidade pela adequação é do controlador.");
  });
  it("nenhum modelo pré-preenche fato verificável (ID, hostname real ou hash)", () => {
    for (const id of IDS) {
      const corpo = BIBLIOTECA_TEXTOS[id].corpo;
      expect(corpo).not.toMatch(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/);
      expect(corpo).not.toMatch(/[0-9a-f]{64}/);
      expect(corpo).not.toMatch(/SN-[A-Z0-9]{6,}/);
    }
  });
  it("enveloparModelo aplica o mesmo envelope a textos ad hoc (PI-05)", () => {
    const env = enveloparModelo("Texto X", "PI-05", "ISO/IEC 42001");
    expect(env).toContain("Origem: PI-05 (Escudo Jurídico de Dosimetria) · Fonte: ISO/IEC 42001");
    expect(env.endsWith(RODAPE_MODELO)).toBe(true);
  });
});
