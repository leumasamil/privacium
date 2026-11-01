import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  BIBLIOTECA_NORMATIVA,
  PADROES_NAO_VERIFICADOS,
  citacaoVerificada,
  normaDaCitacao,
  referenciaGenerica,
} from "@/lib/priva/bibliotecaNormativa";

/** Varre o código do produto (sem testes nem arquivos gerados). */
function* arquivosProduto(dir: string): Generator<string> {
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) {
      if (nome === "test" || nome === "integrations" || nome === "node_modules") continue;
      yield* arquivosProduto(p);
    } else if (/\.(ts|tsx)$/.test(nome)) {
      yield p;
    }
  }
}

describe("Biblioteca normativa versionada", () => {
  it("seed inclui os sete dispositivos de direitos do titular, com URL e motivo", () => {
    expect(BIBLIOTECA_NORMATIVA.length).toBe(66);
    const ver = BIBLIOTECA_NORMATIVA.filter((e) => e.status === "VERIFICADA");
    const nv = BIBLIOTECA_NORMATIVA.filter((e) => e.status === "NAO_VERIFICAVEL");
    expect(ver.length).toBe(58);
    expect(nv.length).toBe(8);
    for (const e of ver) {
      expect(e.texto_literal?.length).toBeGreaterThan(20);
      expect(e.url_oficial).toMatch(/^https:\/\//);
      expect(['2026-10-30','2026-11-01']).toContain(e.verificado_em);
    }
    for (const e of nv) {
      expect(e.texto_literal).toBeNull();
      expect(e.observacao).toBeTruthy();
    }
  });

  it("regra B.3: citação verificada renderiza; não verificada rende só a referência genérica", () => {
    expect(citacaoVerificada("LGPD art. 20")).toBe(true);
    expect(citacaoVerificada("LGPD art. 46")).toBe(true);
    expect(citacaoVerificada("MCI art. 10")).toBe(true);
    expect(citacaoVerificada("MCI art. 15")).toBe(true);
    expect(citacaoVerificada("Res. CD/ANPD nº 15/2024, art. 6º, § 8º")).toBe(true);
    expect(citacaoVerificada("Res. CD/ANPD nº 2/2022, art. 9º")).toBe(true);
    // Não verificadas: apenas referência genérica
    expect(citacaoVerificada("ISO/IEC 42001")).toBe(false);
    expect(citacaoVerificada("ISO/IEC 27701")).toBe(false);
    expect(citacaoVerificada("ISO/IEC 27037")).toBe(false);
    expect(citacaoVerificada("CIS Control 03")).toBe(false);
    expect(citacaoVerificada("NIST SP 800-61r3")).toBe(false);
    expect(citacaoVerificada("Res. CMN nº 4.658/2018")).toBe(false);
    expect(referenciaGenerica("ISO/IEC 27002 — 8.9")).toBe("ISO/IEC 27002:2022");
    expect(referenciaGenerica("CIS Control 16")).toBe("CIS Controls v8");
    expect(normaDaCitacao("LGPD art. 5º, XVII")).toBe("LGPD");
  });

  it("B.5: nenhum texto do produto renderiza identificador específico de citação não verificada", () => {
    const violacoes: string[] = [];
    for (const arquivo of arquivosProduto("src")) {
      // A própria biblioteca registra os identificadores pendentes; não é texto renderizado.
      if (arquivo.endsWith("bibliotecaNormativa.ts")) continue;
      const conteudo = readFileSync(arquivo, "utf8");
      for (const { rotulo, padrao } of PADROES_NAO_VERIFICADOS) {
        const m = conteudo.match(padrao);
        if (m) violacoes.push(`${arquivo}: ${rotulo} → "${m[0]}"`);
      }
    }
    expect(violacoes).toEqual([]);
  });

  it("toda citação passada ao componente CitacaoNormativa existe na biblioteca", () => {
    const usos: string[] = [];
    for (const arquivo of arquivosProduto("src")) {
      const conteudo = readFileSync(arquivo, "utf8");
      for (const m of conteudo.matchAll(/CitacaoNormativa citacao="([^"]+)"/g)) usos.push(m[1]!);
    }
    expect(usos.length).toBeGreaterThan(5);
    for (const u of usos) expect(normaDaCitacao(u), `citação sem norma mapeada: ${u}`).not.toBeNull();
  });
});
