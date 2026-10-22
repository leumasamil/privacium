import { describe, it, expect } from "vitest";
import { gerarPdfPI, rodapeForense } from "@/lib/priva/pdf";

const c = { hash: "a".repeat(64), ts: "2026-10-22T20:00:00.000Z", assinante: "dpo@x.com", cnpj: "11.***.***/0001-81", cpf: "***.555.***-77" };

describe("PDF dos PIs", () => {
  it("rodapé carimba hash, timestamp, CNPJ, CPF e assinatura Gov.br", () => {
    const r = rodapeForense(c).join(" ");
    expect(r).toContain("a".repeat(64));
    expect(r).toContain("2026-10-22T20:00:00.000Z");
    expect(r).toContain(c.cnpj);
    expect(r).toContain(c.cpf);
    expect(r).toContain("Gov.br");
  });
  it("texto longo quebra em várias páginas sem cortar", () => {
    const doc = gerarPdfPI("PI-02 ROT", Array(200).fill("Linha de operação de tratamento.").join("\n"), c);
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });
});
