import { describe, expect, it } from "vitest";
import { AJUDA } from "@/lib/priva/ajuda";
describe("ajuda 5W2H", () => {
  it.each([1, 2, 3, 4, 5])("bloco %i tem ao menos 5 passos", (n) => {
    expect(AJUDA[n]!.passos.length).toBeGreaterThanOrEqual(5);
  });
});
