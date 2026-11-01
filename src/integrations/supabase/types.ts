export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ativos_seguranca: {
        Row: {
          atualizado_em: string
          criado_em: string
          criado_por: string | null
          descricao: string
          empresa_cnpj: string
          estrutura_pasta: string | null
          hash_integridade: string | null
          id: string
          identificador: string
          localizacao: string | null
          protegido: boolean
          provedor_nuvem: string | null
          responsavel: string | null
          tipo: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          descricao?: string
          empresa_cnpj: string
          estrutura_pasta?: string | null
          hash_integridade?: string | null
          id?: string
          identificador: string
          localizacao?: string | null
          protegido?: boolean
          provedor_nuvem?: string | null
          responsavel?: string | null
          tipo: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          descricao?: string
          empresa_cnpj?: string
          estrutura_pasta?: string | null
          hash_integridade?: string | null
          id?: string
          identificador?: string
          localizacao?: string | null
          protegido?: boolean
          provedor_nuvem?: string | null
          responsavel?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "ativos_seguranca_empresa_cnpj_fkey"
            columns: ["empresa_cnpj"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["cnpj"]
          },
        ]
      }
      audit_log: {
        Row: {
          detail: string
          hash: string
          op: string
          prev_hash: string
          role: Database["public"]["Enums"]["app_role"]
          seq: number
          target: string
          ts: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          detail: string
          hash: string
          op: string
          prev_hash: string
          role: Database["public"]["Enums"]["app_role"]
          seq?: number
          target: string
          ts?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          detail?: string
          hash?: string
          op?: string
          prev_hash?: string
          role?: Database["public"]["Enums"]["app_role"]
          seq?: number
          target?: string
          ts?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      biblioteca_normativa: {
        Row: {
          atualizado_em: string
          categoria: Database["public"]["Enums"]["categoria_normativa"]
          criado_em: string
          id: string
          identificador: string
          norma: string
          observacao: string | null
          status: Database["public"]["Enums"]["status_normativo"]
          texto_literal: string | null
          url_oficial: string | null
          verificado_em: string | null
          verificado_por: string | null
        }
        Insert: {
          atualizado_em?: string
          categoria: Database["public"]["Enums"]["categoria_normativa"]
          criado_em?: string
          id?: string
          identificador: string
          norma: string
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_normativo"]
          texto_literal?: string | null
          url_oficial?: string | null
          verificado_em?: string | null
          verificado_por?: string | null
        }
        Update: {
          atualizado_em?: string
          categoria?: Database["public"]["Enums"]["categoria_normativa"]
          criado_em?: string
          id?: string
          identificador?: string
          norma?: string
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_normativo"]
          texto_literal?: string | null
          url_oficial?: string | null
          verificado_em?: string | null
          verificado_por?: string | null
        }
        Relationships: []
      }
      chaves_recuperacao: {
        Row: {
          ativo_id: string
          chave: string
          registrado_em: string
          registrado_por: string | null
        }
        Insert: {
          ativo_id: string
          chave: string
          registrado_em?: string
          registrado_por?: string | null
        }
        Update: {
          ativo_id?: string
          chave?: string
          registrado_em?: string
          registrado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chaves_recuperacao_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: true
            referencedRelation: "ativos_seguranca"
            referencedColumns: ["id"]
          },
        ]
      }
      ciclos_priva: {
        Row: {
          ano_fiscal: number
          assinaturas: Json
          empresa_cnpj: string
          finalizado_em: string
          finalizado_por: string | null
          id: string
          reducao_dosimetria: number | null
        }
        Insert: {
          ano_fiscal: number
          assinaturas?: Json
          empresa_cnpj: string
          finalizado_em?: string
          finalizado_por?: string | null
          id?: string
          reducao_dosimetria?: number | null
        }
        Update: {
          ano_fiscal?: number
          assinaturas?: Json
          empresa_cnpj?: string
          finalizado_em?: string
          finalizado_por?: string | null
          id?: string
          reducao_dosimetria?: number | null
        }
        Relationships: []
      }
      empresas: {
        Row: {
          cnpj: string
          data_cadastro: string
          id: string
          plano_assinatura: string
          razao_social: string
          status: string
        }
        Insert: {
          cnpj: string
          data_cadastro?: string
          id?: string
          plano_assinatura?: string
          razao_social?: string
          status?: string
        }
        Update: {
          cnpj?: string
          data_cadastro?: string
          id?: string
          plano_assinatura?: string
          razao_social?: string
          status?: string
        }
        Relationships: []
      }
      encarregado_dpo: {
        Row: {
          atualizado_em: string
          email: string
          empresa_cnpj: string
          endereco: string | null
          nome: string
          publicar_contato: boolean
          telefone: string | null
        }
        Insert: {
          atualizado_em?: string
          email: string
          empresa_cnpj: string
          endereco?: string | null
          nome: string
          publicar_contato?: boolean
          telefone?: string | null
        }
        Update: {
          atualizado_em?: string
          email?: string
          empresa_cnpj?: string
          endereco?: string | null
          nome?: string
          publicar_contato?: boolean
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encarregado_dpo_empresa_cnpj_fkey"
            columns: ["empresa_cnpj"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["cnpj"]
          },
        ]
      }
      enquadramentos_agente: {
        Row: {
          assinado_em: string
          assinado_por: string
          criterios: Json
          empresa_cnpj: string
          hash_sha256: string
          id: string
          porte: string
        }
        Insert: {
          assinado_em?: string
          assinado_por: string
          criterios: Json
          empresa_cnpj: string
          hash_sha256: string
          id?: string
          porte: string
        }
        Update: {
          assinado_em?: string
          assinado_por?: string
          criterios?: Json
          empresa_cnpj?: string
          hash_sha256?: string
          id?: string
          porte?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquadramentos_agente_assinado_por_fkey"
            columns: ["assinado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquadramentos_agente_empresa_cnpj_fkey"
            columns: ["empresa_cnpj"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["cnpj"]
          },
        ]
      }
      faturamento_saas: {
        Row: {
          criado_em: string
          data_vencimento: string
          empresa_id: string
          id: string
          link_fatura_simulado: string
          status_pagamento: string
          valor_mensalidade: number
        }
        Insert: {
          criado_em?: string
          data_vencimento?: string
          empresa_id: string
          id?: string
          link_fatura_simulado?: string
          status_pagamento?: string
          valor_mensalidade?: number
        }
        Update: {
          criado_em?: string
          data_vencimento?: string
          empresa_id?: string
          id?: string
          link_fatura_simulado?: string
          status_pagamento?: string
          valor_mensalidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "faturamento_saas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      incidencia_normativa: {
        Row: {
          biblioteca_normativa_id: string
          campo: string
          categoria: Database["public"]["Enums"]["categoria_normativa"]
          condicao: string
          id: string
          identificador: string
          norma: string
          obrigatoria: boolean
        }
        Insert: {
          biblioteca_normativa_id: string
          campo: string
          categoria: Database["public"]["Enums"]["categoria_normativa"]
          condicao?: string
          id?: string
          identificador: string
          norma: string
          obrigatoria?: boolean
        }
        Update: {
          biblioteca_normativa_id?: string
          campo?: string
          categoria?: Database["public"]["Enums"]["categoria_normativa"]
          condicao?: string
          id?: string
          identificador?: string
          norma?: string
          obrigatoria?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "incidencia_normativa_biblioteca_normativa_id_fkey"
            columns: ["biblioteca_normativa_id"]
            isOneToOne: false
            referencedRelation: "biblioteca_normativa"
            referencedColumns: ["id"]
          },
        ]
      }
      incidentes_seguranca: {
        Row: {
          comunicacao: Json
          comunicacao_atrasada: boolean
          criado_por: string | null
          empresa_cnpj: string
          encerrado_em: string | null
          enviado_anpd_em: string | null
          etapas_registro: Json
          id: string
          iniciado_em: string
          passos: boolean[]
          prazo_dias_uteis: number | null
          processo_id: string | null
        }
        Insert: {
          comunicacao?: Json
          comunicacao_atrasada?: boolean
          criado_por?: string | null
          empresa_cnpj: string
          encerrado_em?: string | null
          enviado_anpd_em?: string | null
          etapas_registro?: Json
          id?: string
          iniciado_em?: string
          passos?: boolean[]
          prazo_dias_uteis?: number | null
          processo_id?: string | null
        }
        Update: {
          comunicacao?: Json
          comunicacao_atrasada?: boolean
          criado_por?: string | null
          empresa_cnpj?: string
          encerrado_em?: string | null
          enviado_anpd_em?: string | null
          etapas_registro?: Json
          id?: string
          iniciado_em?: string
          passos?: boolean[]
          prazo_dias_uteis?: number | null
          processo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidentes_seguranca_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "registro_operacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      lotes_pgaudit: {
        Row: {
          conteudo: string
          empresa_cnpj: string
          gerado_em: string
          gerado_por: string | null
          hash_sha256: string | null
          id: string
          linhas: number
          mes_referencia: string
        }
        Insert: {
          conteudo: string
          empresa_cnpj: string
          gerado_em?: string
          gerado_por?: string | null
          hash_sha256?: string | null
          id?: string
          linhas?: number
          mes_referencia: string
        }
        Update: {
          conteudo?: string
          empresa_cnpj?: string
          gerado_em?: string
          gerado_por?: string | null
          hash_sha256?: string | null
          id?: string
          linhas?: number
          mes_referencia?: string
        }
        Relationships: []
      }
      membros_empresa: {
        Row: {
          area_setor: string | null
          ativo: boolean
          atualizado_em: string
          criado_em: string
          documento: string
          email: string
          empresa_id: string
          id: string
          membro_comite: boolean
          nome: string
          papel_rac: string | null
          tipo_documento: string
        }
        Insert: {
          area_setor?: string | null
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          documento: string
          email: string
          empresa_id: string
          id?: string
          membro_comite?: boolean
          nome: string
          papel_rac?: string | null
          tipo_documento: string
        }
        Update: {
          area_setor?: string | null
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          documento?: string
          email?: string
          empresa_id?: string
          id?: string
          membro_comite?: boolean
          nome?: string
          papel_rac?: string | null
          tipo_documento?: string
        }
        Relationships: [
          {
            foreignKeyName: "membros_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas_uso_ia: {
        Row: {
          atualizado_em: string
          empresa_id: string
          id: string
          limite_mensal_tokens: number
          quantidade_bloqueios_vazamento: number
          volume_tokens_sinteticos_gerados: number
        }
        Insert: {
          atualizado_em?: string
          empresa_id: string
          id?: string
          limite_mensal_tokens?: number
          quantidade_bloqueios_vazamento?: number
          volume_tokens_sinteticos_gerados?: number
        }
        Update: {
          atualizado_em?: string
          empresa_id?: string
          id?: string
          limite_mensal_tokens?: number
          quantidade_bloqueios_vazamento?: number
          volume_tokens_sinteticos_gerados?: number
        }
        Relationships: [
          {
            foreignKeyName: "metricas_uso_ia_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      monitor_fornecedores: {
        Row: {
          ativo_id: string | null
          avaliado_em: string | null
          avaliado_por: string | null
          campo_origem: string
          contas_afetadas: number
          data_vazamento: string
          empresa_cnpj: string
          estado: string
          fonte: string
          fornecedor_nome: string
          id: string
          incidente_proprio_id: string | null
          justificativa: string | null
          processo_rot_id: string | null
          referencia_chave: string
          tipos_dados: string[]
          triagem: Json
          url_referencia: string
          verificado_em: string
        }
        Insert: {
          ativo_id?: string | null
          avaliado_em?: string | null
          avaliado_por?: string | null
          campo_origem: string
          contas_afetadas?: number
          data_vazamento: string
          empresa_cnpj: string
          estado?: string
          fonte?: string
          fornecedor_nome: string
          id?: string
          incidente_proprio_id?: string | null
          justificativa?: string | null
          processo_rot_id?: string | null
          referencia_chave: string
          tipos_dados?: string[]
          triagem?: Json
          url_referencia: string
          verificado_em?: string
        }
        Update: {
          ativo_id?: string | null
          avaliado_em?: string | null
          avaliado_por?: string | null
          campo_origem?: string
          contas_afetadas?: number
          data_vazamento?: string
          empresa_cnpj?: string
          estado?: string
          fonte?: string
          fornecedor_nome?: string
          id?: string
          incidente_proprio_id?: string | null
          justificativa?: string | null
          processo_rot_id?: string | null
          referencia_chave?: string
          tipos_dados?: string[]
          triagem?: Json
          url_referencia?: string
          verificado_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitor_fornecedores_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativos_seguranca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitor_fornecedores_empresa_cnpj_fkey"
            columns: ["empresa_cnpj"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["cnpj"]
          },
          {
            foreignKeyName: "monitor_fornecedores_incidente_proprio_id_fkey"
            columns: ["incidente_proprio_id"]
            isOneToOne: false
            referencedRelation: "incidentes_seguranca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitor_fornecedores_processo_rot_id_fkey"
            columns: ["processo_rot_id"]
            isOneToOne: false
            referencedRelation: "registro_operacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      monitor_verificacoes: {
        Row: {
          empresa_cnpj: string
          erro: boolean
          sucesso_em: string | null
          tentativa_em: string | null
        }
        Insert: {
          empresa_cnpj: string
          erro?: boolean
          sucesso_em?: string | null
          tentativa_em?: string | null
        }
        Update: {
          empresa_cnpj?: string
          erro?: boolean
          sucesso_em?: string | null
          tentativa_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monitor_verificacoes_empresa_cnpj_fkey"
            columns: ["empresa_cnpj"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["cnpj"]
          },
        ]
      }
      perguntas_diagnostico: {
        Row: {
          enunciado: string
          id: string
          ordem: number
          peso_criticidade: number
          questao_critica: string
          setor: string
        }
        Insert: {
          enunciado: string
          id?: string
          ordem: number
          peso_criticidade: number
          questao_critica: string
          setor: string
        }
        Update: {
          enunciado?: string
          id?: string
          ordem?: number
          peso_criticidade?: number
          questao_critica?: string
          setor?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      question_bank: {
        Row: {
          department: string
          id: number
          principle: string
          text: string
          weight: number
        }
        Insert: {
          department: string
          id: number
          principle: string
          text: string
          weight: number
        }
        Update: {
          department?: string
          id?: number
          principle?: string
          text?: string
          weight?: number
        }
        Relationships: []
      }
      registro_operacoes: {
        Row: {
          area_setor: string | null
          assinatura_etapa1: Json | null
          assinatura_etapa2: Json | null
          atualizado_em: string
          base_prazo: string
          categoria_titulares: string[]
          ciclo_vida: Json
          codigo: string
          compartilhamento: string
          contrato_controlador: string | null
          criado_em: string
          criado_por: string | null
          dados_pessoais: string[]
          dados_sensiveis: string[]
          destino_produto: Json | null
          empresa_cnpj: string
          excluido_em: string | null
          excluido_por: string | null
          finalidade_especifica: string
          fundamento_produto: string | null
          genero_verbo: string
          hipotese_sensivel: string | null
          hipotese_tratamento: string
          id: string
          infraestrutura: string
          insumo: string | null
          justificativa_mitigacao: string | null
          meio_fornecimento: string | null
          motivo_exclusao: string | null
          origem: Database["public"]["Enums"]["origem_registro"]
          origem_compartilhamento: Json | null
          papel_agente: string
          prazo_produto: string | null
          produto_interno: string | null
          produtos_tratamento: Json
          removida_do_dossie: boolean
          salvaguardas: string[]
          setor: string
          tempo_retencao: string
        }
        Insert: {
          area_setor?: string | null
          assinatura_etapa1?: Json | null
          assinatura_etapa2?: Json | null
          atualizado_em?: string
          base_prazo: string
          categoria_titulares?: string[]
          ciclo_vida?: Json
          codigo?: string
          compartilhamento?: string
          contrato_controlador?: string | null
          criado_em?: string
          criado_por?: string | null
          dados_pessoais?: string[]
          dados_sensiveis?: string[]
          destino_produto?: Json | null
          empresa_cnpj: string
          excluido_em?: string | null
          excluido_por?: string | null
          finalidade_especifica: string
          fundamento_produto?: string | null
          genero_verbo: string
          hipotese_sensivel?: string | null
          hipotese_tratamento: string
          id?: string
          infraestrutura: string
          insumo?: string | null
          justificativa_mitigacao?: string | null
          meio_fornecimento?: string | null
          motivo_exclusao?: string | null
          origem?: Database["public"]["Enums"]["origem_registro"]
          origem_compartilhamento?: Json | null
          papel_agente?: string
          prazo_produto?: string | null
          produto_interno?: string | null
          produtos_tratamento?: Json
          removida_do_dossie?: boolean
          salvaguardas?: string[]
          setor: string
          tempo_retencao: string
        }
        Update: {
          area_setor?: string | null
          assinatura_etapa1?: Json | null
          assinatura_etapa2?: Json | null
          atualizado_em?: string
          base_prazo?: string
          categoria_titulares?: string[]
          ciclo_vida?: Json
          codigo?: string
          compartilhamento?: string
          contrato_controlador?: string | null
          criado_em?: string
          criado_por?: string | null
          dados_pessoais?: string[]
          dados_sensiveis?: string[]
          destino_produto?: Json | null
          empresa_cnpj?: string
          excluido_em?: string | null
          excluido_por?: string | null
          finalidade_especifica?: string
          fundamento_produto?: string | null
          genero_verbo?: string
          hipotese_sensivel?: string | null
          hipotese_tratamento?: string
          id?: string
          infraestrutura?: string
          insumo?: string | null
          justificativa_mitigacao?: string | null
          meio_fornecimento?: string | null
          motivo_exclusao?: string | null
          origem?: Database["public"]["Enums"]["origem_registro"]
          origem_compartilhamento?: Json | null
          papel_agente?: string
          prazo_produto?: string | null
          produto_interno?: string | null
          produtos_tratamento?: Json
          removida_do_dossie?: boolean
          salvaguardas?: string[]
          setor?: string
          tempo_retencao?: string
        }
        Relationships: [
          {
            foreignKeyName: "registro_operacoes_empresa_cnpj_fkey"
            columns: ["empresa_cnpj"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["cnpj"]
          },
        ]
      }
      respostas_diagnostico: {
        Row: {
          empresa_cnpj: string
          id: string
          pergunta_id: string
          pontuacao_obtida: number
          resposta_binaria: string
          timestamp_resposta: string
          usuario_cpf: string
        }
        Insert: {
          empresa_cnpj: string
          id?: string
          pergunta_id: string
          pontuacao_obtida?: number
          resposta_binaria: string
          timestamp_resposta?: string
          usuario_cpf: string
        }
        Update: {
          empresa_cnpj?: string
          id?: string
          pergunta_id?: string
          pontuacao_obtida?: number
          resposta_binaria?: string
          timestamp_resposta?: string
          usuario_cpf?: string
        }
        Relationships: [
          {
            foreignKeyName: "respostas_diagnostico_empresa_cnpj_fkey"
            columns: ["empresa_cnpj"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["cnpj"]
          },
          {
            foreignKeyName: "respostas_diagnostico_pergunta_id_fkey"
            columns: ["pergunta_id"]
            isOneToOne: false
            referencedRelation: "perguntas_diagnostico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_diagnostico_usuario_cpf_fkey"
            columns: ["usuario_cpf"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["cpf"]
          },
        ]
      }
      ripd_ia: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          empresa_cnpj: string
          escudo_digital: string
          riscos: Json
          sistema_avaliado: string
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          empresa_cnpj: string
          escudo_digital?: string
          riscos?: Json
          sistema_avaliado?: string
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          empresa_cnpj?: string
          escudo_digital?: string
          riscos?: Json
          sistema_avaliado?: string
        }
        Relationships: []
      }
      terceiros_empresa: {
        Row: {
          ativo: boolean
          atualizado_em: string
          checklist_art39: Json
          clausulas_art39: boolean
          cnpj: string
          contrato_vigente: boolean
          criado_em: string
          data_contrato: string | null
          empresa_id: string
          encarregado_contato: string | null
          hipotese_art33: string | null
          id: string
          operador_principal_id: string | null
          papel_cadeia: string
          razao_social: string
          transferencia_internacional: boolean
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          checklist_art39?: Json
          clausulas_art39?: boolean
          cnpj: string
          contrato_vigente?: boolean
          criado_em?: string
          data_contrato?: string | null
          empresa_id: string
          encarregado_contato?: string | null
          hipotese_art33?: string | null
          id?: string
          operador_principal_id?: string | null
          papel_cadeia: string
          razao_social: string
          transferencia_internacional?: boolean
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          checklist_art39?: Json
          clausulas_art39?: boolean
          cnpj?: string
          contrato_vigente?: boolean
          criado_em?: string
          data_contrato?: string | null
          empresa_id?: string
          encarregado_contato?: string | null
          hipotese_art33?: string | null
          id?: string
          operador_principal_id?: string | null
          papel_cadeia?: string
          razao_social?: string
          transferencia_internacional?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "terceiros_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terceiros_empresa_operador_principal_id_fkey"
            columns: ["operador_principal_id"]
            isOneToOne: false
            referencedRelation: "terceiros_empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      trilha_auditoria_sistema: {
        Row: {
          acao_executada: string | null
          campo_mascarado_acessado: string | null
          cnpj: string | null
          detail: string
          hash: string
          hash_integridade_sha256: string | null
          id: string
          ip_origem: string | null
          op: string
          prev_hash: string
          role: Database["public"]["Enums"]["app_role"] | null
          seq: number
          tabela_afetada: string | null
          target: string
          timestamp_evento: string | null
          ts: string
          user_email: string | null
          user_id: string | null
          usuario_id: string | null
        }
        Insert: {
          acao_executada?: string | null
          campo_mascarado_acessado?: string | null
          cnpj?: string | null
          detail: string
          hash: string
          hash_integridade_sha256?: string | null
          id?: string
          ip_origem?: string | null
          op: string
          prev_hash: string
          role?: Database["public"]["Enums"]["app_role"] | null
          seq?: number
          tabela_afetada?: string | null
          target: string
          timestamp_evento?: string | null
          ts?: string
          user_email?: string | null
          user_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao_executada?: string | null
          campo_mascarado_acessado?: string | null
          cnpj?: string | null
          detail?: string
          hash?: string
          hash_integridade_sha256?: string | null
          id?: string
          ip_origem?: string | null
          op?: string
          prev_hash?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          seq?: number
          tabela_afetada?: string | null
          target?: string
          timestamp_evento?: string | null
          ts?: string
          user_email?: string | null
          user_id?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trilha_auditoria_sistema_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          cargo: string
          cpf: string | null
          data_criacao: string
          email: string
          empresa_id: string | null
          id: string
          nome: string
          perfil_acesso: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          cargo?: string
          cpf?: string | null
          data_criacao?: string
          email: string
          empresa_id?: string | null
          id: string
          nome?: string
          perfil_acesso?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          cargo?: string
          cpf?: string | null
          data_criacao?: string
          email?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          perfil_acesso?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_empresa: {
        Row: {
          cnpj: string
          created_at: string
          data: Json
          razao_social: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cnpj: string
          created_at?: string
          data?: Json
          razao_social?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cnpj?: string
          created_at?: string
          data?: Json
          razao_social?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      workspace_state: {
        Row: {
          data: Json
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          data?: Json
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          data?: Json
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_gm_empresas: {
        Args: never
        Returns: {
          cnpj: string
          gm: number
        }[]
      }
      append_audit: {
        Args: {
          _detail: string
          _op: string
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: {
          detail: string
          hash: string
          op: string
          prev_hash: string
          role: Database["public"]["Enums"]["app_role"]
          seq: number
          target: string
          ts: string
          user_email: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "audit_log"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      assinar_enquadramento: {
        Args: { _cnpj: string; _criterios: Json }
        Returns: {
          assinado_em: string
          assinado_por: string
          criterios: Json
          empresa_cnpj: string
          hash_sha256: string
          id: string
          porte: string
        }
        SetofOptions: {
          from: "*"
          to: "enquadramentos_agente"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      assinar_etapa_rot: {
        Args: { _etapa: number; _rot_id: string }
        Returns: Json
      }
      avaliar_fornecedor: {
        Args: {
          _estado: string
          _id: string
          _justificativa?: string
          _triagem?: Json
        }
        Returns: string
      }
      calcular_porte_agente: { Args: { _criterios: Json }; Returns: string }
      catalogo_categorias_anpd: {
        Args: never
        Returns: {
          fonte_normativa: string
          sensivel: boolean
          valor: string
        }[]
      }
      catalogo_medidas_anpd: {
        Args: never
        Returns: {
          fonte_normativa: string
          ordem: number
          valor: string
        }[]
      }
      catalogo_riscos_anpd: {
        Args: never
        Returns: {
          descricao: string
          fonte_normativa: string
          ordem: number
          valor: string
        }[]
      }
      ciclo_vida_valido: { Args: { c: Json }; Returns: boolean }
      cnpj_liberado: { Args: { _cnpj: string }; Returns: boolean }
      cnpj_valido: { Args: { _c: string }; Returns: boolean }
      cpf_valido: { Args: { _c: string }; Returns: boolean }
      empresa_ativa: { Args: { _cnpj: string }; Returns: boolean }
      encerrar_incidente: { Args: { _incidente: string }; Returns: Json }
      enquadramento_vigente: { Args: { _cnpj: string }; Returns: boolean }
      enviar_comunicacao_anpd: {
        Args: { _form: Json; _incidente: string; _processo: string }
        Returns: string
      }
      excluir_linha_rot: {
        Args: { _motivo: string; _rot_id: string }
        Returns: Json
      }
      fonte_natureza_anpd: { Args: { _valor: string }; Returns: string }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      iniciar_verificacao_fornecedores: {
        Args: { _cnpj: string }
        Returns: boolean
      }
      limite_anpd_uteis: {
        Args: { _dias: number; _inicio: string }
        Returns: string
      }
      list_members: {
        Args: never
        Returns: {
          display_name: string
          email: string
          id: string
          roles: Database["public"]["Enums"]["app_role"][]
        }[]
      }
      meu_cpf: { Args: never; Returns: string }
      minha_empresa_cnpj: { Args: never; Returns: string }
      minha_empresa_id: { Args: never; Returns: string }
      prazo_agente_anpd: { Args: { _cnpj: string }; Returns: number }
      registrar_acesso: {
        Args: {
          _campo: string
          _cnpj: string
          _detail: string
          _op: string
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: {
          acao_executada: string | null
          campo_mascarado_acessado: string | null
          cnpj: string | null
          detail: string
          hash: string
          hash_integridade_sha256: string | null
          id: string
          ip_origem: string | null
          op: string
          prev_hash: string
          role: Database["public"]["Enums"]["app_role"] | null
          seq: number
          tabela_afetada: string | null
          target: string
          timestamp_evento: string | null
          ts: string
          user_email: string | null
          user_id: string | null
          usuario_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "trilha_auditoria_sistema"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      registrar_etapa_incidente: {
        Args: { _concluida?: boolean; _etapa: number; _incidente: string }
        Returns: undefined
      }
      registrar_falha_login: { Args: { _email: string }; Returns: undefined }
      registrar_trilha: {
        Args: {
          _cnpj: string
          _detail: string
          _op: string
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: {
          acao_executada: string | null
          campo_mascarado_acessado: string | null
          cnpj: string | null
          detail: string
          hash: string
          hash_integridade_sha256: string | null
          id: string
          ip_origem: string | null
          op: string
          prev_hash: string
          role: Database["public"]["Enums"]["app_role"] | null
          seq: number
          tabela_afetada: string | null
          target: string
          timestamp_evento: string | null
          ts: string
          user_email: string | null
          user_id: string | null
          usuario_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "trilha_auditoria_sistema"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      registrar_uso_ia: {
        Args: { _bloqueios: number; _cnpj: string; _tokens: number }
        Returns: undefined
      }
      remover_registro_de_teste: {
        Args: { _justificativa: string; _rot_id: string }
        Returns: Json
      }
      revelar_cnpj_terceiro: { Args: { _id: string }; Returns: string }
      revelar_documento_membro: { Args: { _id: string }; Returns: string }
      verificar_citacao_normativa: {
        Args: { _id: string; _texto: string; _url: string }
        Returns: {
          atualizado_em: string
          categoria: Database["public"]["Enums"]["categoria_normativa"]
          criado_em: string
          id: string
          identificador: string
          norma: string
          observacao: string | null
          status: Database["public"]["Enums"]["status_normativo"]
          texto_literal: string | null
          url_oficial: string | null
          verificado_em: string | null
          verificado_por: string | null
        }
        SetofOptions: {
          from: "*"
          to: "biblioteca_normativa"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verificar_trilha: {
        Args: never
        Returns: {
          broken_at: number
          ok: boolean
          total: number
        }[]
      }
      verify_audit_chain: {
        Args: never
        Returns: {
          broken_at: number
          ok: boolean
          total: number
        }[]
      }
      volumetria: {
        Args: never
        Returns: {
          ativas: number
          empresas: number
          perguntas: number
          registros_trilha: number
          usuarios: number
        }[]
      }
    }
    Enums: {
      app_role: "ADMIN_SISTEMA" | "DPO_OPERACIONAL" | "C_SUITE"
      categoria_normativa:
        | "REGIME_GERAL"
        | "LEI_ESPECIAL_SETORIAL"
        | "FOMENTO_ECONOMICO"
        | "REFERENCIA_TECNICA"
      origem_registro: "REAL" | "TESTE" | "DEMONSTRACAO"
      status_normativo:
        | "VERIFICADA"
        | "PENDENTE"
        | "DIVERGENTE"
        | "NAO_VERIFICAVEL"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ADMIN_SISTEMA", "DPO_OPERACIONAL", "C_SUITE"],
      categoria_normativa: [
        "REGIME_GERAL",
        "LEI_ESPECIAL_SETORIAL",
        "FOMENTO_ECONOMICO",
        "REFERENCIA_TECNICA",
      ],
      origem_registro: ["REAL", "TESTE", "DEMONSTRACAO"],
      status_normativo: [
        "VERIFICADA",
        "PENDENTE",
        "DIVERGENTE",
        "NAO_VERIFICAVEL",
      ],
    },
  },
} as const
