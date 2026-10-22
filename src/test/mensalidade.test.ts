import { describe, expect, it } from "vitest";
import { MENSALIDADE } from "@/components/priva/RoleDashboards";

describe("mensalidades oficiais", () => {
  it("CORE custa R$ 450,00", () => expect(MENSALIDADE["CORE"]).toBe(450));
  it("ENTERPRISE custa R$ 2.450,00", () => expect(MENSALIDADE["ENTERPRISE"]).toBe(2450));
});
