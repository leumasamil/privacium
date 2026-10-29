import { describe, expect, it } from "vitest";
import { faixaGM, GLOSSARIO, termo } from "@/lib/priva/glossario";
describe("glossário e faixas do GM", () => {
  it("faixas 0–25 Inicial, 26–50 Em desenvolvimento, 51–75 Tática, 76–100 Otimizada", () => {
    expect(faixaGM(25).nome).toBe("Inicial");
    expect(faixaGM(26).nome).toBe("Em desenvolvimento");
    expect(faixaGM(60).nome).toBe("Tática");
    expect(faixaGM(76).nome).toBe("Otimizada");
  });
  it("traduz as siglas obrigatórias", () => {
    for (const id of ["pi", "5w2h", "trilho-core", "chancela", "score", "eventos", "rot", "ripd", "dpo", "rls", "sha256"]) expect(termo(id)?.definicao).toBeTruthy();
  });
  it("nunca usa 'dado sensível' isolado", () => {
    expect(JSON.stringify(GLOSSARIO)).not.toMatch(/dado sensível/i);
  });
});
