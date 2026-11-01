import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
const sessionText = process.env["LOVABLE_BROWSER_SUPABASE_SESSION_JSON"];
const url = import.meta.env["VITE_SUPABASE_URL"];
const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
describe.skipIf(!sessionText || !url || !key)("ROT: coerência no banco, somente empresa de teste", () => {
  it("recusa destino antes da escolha e permite destino após declaração auditada", async () => {
    if (!sessionText) throw new Error("Sessão ausente");
    const token = (JSON.parse(sessionText) as { access_token: string }).access_token;
    const db = createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
    const ids: string[] = [];
    const base = {
      empresa_cnpj: "98765432000198", setor: "TI", area_setor: "Tecnologia da Informação › Suporte",
      genero_verbo: "Coletar", ciclo_vida: { Coletar: ["receber"] }, categoria_titulares: ["Clientes"], dados_pessoais: ["Nome"], dados_sensiveis: ["N/A"],
      finalidade_especifica: "Teste isolado de coerência do ROT", hipotese_tratamento: "Art. 7º, V – Execução de contrato ou procedimentos preliminares",
      tempo_retencao: "1 ano", base_prazo: "Política interna", compartilhamento: "Não Compartilhado", salvaguardas: ["Criptografia"], infraestrutura: "Servidor Local",
      papel_agente: "CONTROLADOR", origem: "TESTE", insumo: "Relatório cenográfico", meio_fornecimento: "API/sistema", produtos_tratamento: [],
    };
    try {
      const producao = await db.from("registro_operacoes").insert({ ...base, ciclo_vida: { Coletar: ["produzir"] } });
      expect(producao.error?.message).toContain("produzir sem PRT");
      const origem = await db.from("registro_operacoes").insert(base).select("id,codigo").single();
      expect(origem.error).toBeNull();
      if (!origem.data) throw new Error("Origem de teste ausente");
      ids.push(origem.data.id);
      const receptor = { ...base, origem_compartilhamento: { estado: "insumo recebido", linha_origem_id: origem.data.id, codigo_origem: origem.data.codigo, area_setor_origem: base.area_setor } };
      const negado = await db.from("registro_operacoes").insert({ ...receptor, ciclo_vida: { Coletar: ["receber"], Eliminar: ["eliminar"] } });
      expect(negado.error?.message).toContain("aguardando decisão do receptor");
      const criado = await db.from("registro_operacoes").insert(receptor).select("id").single();
      expect(criado.error).toBeNull();
      if (!criado.data) throw new Error("Receptor de teste ausente");
      ids.push(criado.data.id);
      const id = criado.data.id;
      const destino = { tipo: "ELIMINACAO", prazo: "1 ano", fundamento: "Política interna" };
      const semEscolha = await db.from("registro_operacoes").update({ produtos_tratamento: [{ nome: "Relatório receptor", destino }] }).eq("id", id);
      expect(semEscolha.error?.message).toContain("aguardando decisão do receptor");
      const cadastro = await db.from("registro_operacoes").update({ produtos_tratamento: [{ nome: "Relatório receptor", destino: null }] }).eq("id", id);
      expect(cadastro.error).toBeNull();
      const escolha = await db.rpc("declarar_continuacao_receptor", { _rot_id: id, _declaracao: { tipo: "NOVO_PRT" } });
      expect(escolha.error).toBeNull();
      const completo = await db.from("registro_operacoes").update({ produtos_tratamento: [{ nome: "Relatório receptor", destino }], ciclo_vida: { Coletar: ["receber"], Eliminar: ["eliminar"] } }).eq("id", id);
      expect(completo.error).toBeNull();
      const lido = await db.from("registro_operacoes").select("continuacao_receptor,produtos_tratamento").eq("id", id).single();
      expect(lido.data?.continuacao_receptor).toMatchObject({ tipo: "NOVO_PRT" });
      expect(lido.data?.produtos_tratamento).toEqual([{ nome: "Relatório receptor", destino }]);
    } finally {
      for (const id of ids.reverse()) {
        const limpeza = await db.rpc("remover_registro_de_teste", { _rot_id: id, _justificativa: "Fim de teste automatizado de coerência, exclusivamente na empresa de teste" });
        expect(limpeza.error).toBeNull();
      }
    }
  });
});