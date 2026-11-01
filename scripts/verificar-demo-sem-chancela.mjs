/**
 * Guarda de build (Tarefa 2.6): a demonstração pública NÃO pode nascer com artefato
 * chancelado. Falha o build se `DEMO_SIGNATURES` em src/lib/priva/demo.ts contiver
 * qualquer entrada — e, defensivamente, se qualquer hash de assinatura cenográfica
 * não for um SHA-256 válido de 64 caracteres hexadecimais.
 */
import { readFileSync } from "node:fs";

const fonte = readFileSync(new URL("../src/lib/priva/demo.ts", import.meta.url), "utf8");

const bloco = fonte.match(/export const DEMO_SIGNATURES[^=]*=([\s\S]*?);\n/);
if (!bloco) {
  console.error("FALHA: DEMO_SIGNATURES não localizado em src/lib/priva/demo.ts");
  process.exit(1);
}
const corpo = bloco[1];
const entradas = corpo.match(/hash\s*:/g) ?? [];
if (corpo.includes("Object.fromEntries") || entradas.length > 0) {
  console.error(`FALHA: DEMO_SIGNATURES contém ${entradas.length || "entradas geradas"} artefato(s) pré-chancelado(s). O estado inicial da demonstração deve ser "Não chancelado".`);
  process.exit(1);
}

const hashes = [...fonte.matchAll(/hash:\s*`([^`]+)`|hash:\s*"([^"]+)"/g)].map((m) => m[1] ?? m[2]);
const invalidos = hashes.filter((h) => !/^[0-9a-f]{64}$/.test(h) && !h.includes("${"));
if (invalidos.length) {
  console.error(`FALHA: hash de assinatura cenográfica inválido (não é SHA-256 de 64 hex): ${invalidos.join(", ")}`);
  process.exit(1);
}

console.log("OK: demonstração sem artefatos pré-chancelados; nenhum hash cenográfico inválido.");
