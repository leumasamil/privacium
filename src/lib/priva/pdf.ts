import { jsPDF } from "jspdf";

export type Carimbo = { hash: string; ts: string; assinante: string; cnpj: string; cpf: string };

/** Linhas do rodapé forense (ISO 27037) impressas em todas as páginas do PI. */
export function rodapeForense(c: Carimbo): string[] {
  return [
    `SHA-256: ${c.hash}`,
    `Timestamp: ${new Date(c.ts).toISOString()} · CNPJ ${c.cnpj} · CPF auditor ${c.cpf}`,
    `Assinatura Gov.br (simulada): ${c.assinante}`,
  ];
}

/** Gera o PDF Visual Law de um Produto Interno: quebra de linha e de página automáticas, rodapé em todas as páginas. */
export function gerarPdfPI(titulo: string, texto: string, c: Carimbo): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 18, TOP = 34, BOTTOM = 262;
  const cabecalho = () => {
    doc.setFillColor(26, 26, 26); doc.rect(0, 0, W, 22, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text(doc.splitTextToSize(titulo, W - 2 * M)[0], M, 10);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text("Emitido pelo Ecossistema de Governança Privacium", M, 16);
  };
  cabecalho();
  doc.setTextColor(26, 26, 26); doc.setFontSize(10);
  let y = TOP;
  for (const par of texto.split(/\n+/).map((s) => s.trim()).filter(Boolean)) {
    for (const linha of doc.splitTextToSize(par, W - 2 * M) as string[]) {
      if (y > BOTTOM) { doc.addPage(); cabecalho(); doc.setTextColor(26, 26, 26); doc.setFontSize(10); y = TOP; }
      doc.text(linha, M, y); y += 5;
    }
    y += 2;
  }
  const total = doc.getNumberOfPages();
  const rod = rodapeForense(c);
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(200, 200, 200); doc.line(M, 270, W - M, 270);
    doc.setFont("courier", "normal"); doc.setFontSize(6.5); doc.setTextColor(80, 80, 80);
    rod.forEach((l, i) => doc.text(doc.splitTextToSize(l, W - 2 * M - 20)[0], M, 275 + i * 4));
    doc.text(`${p}/${total}`, W - M, 287, { align: "right" });
  }
  return doc;
}
