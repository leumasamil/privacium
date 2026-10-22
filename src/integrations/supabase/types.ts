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
          protegido: boolean
          provedor_nuvem: string | null
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
          protegido?: boolean
          provedor_nuvem?: string | null
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
          protegido?: boolean
          provedor_nuvem?: string | null
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
          reducao_dosimetria: number
        }
        Insert: {
          ano_fiscal: number
          assinaturas?: Json
          empresa_cnpj: string
          finalizado_em?: string
          finalizado_por?: string | null
          id?: string
          reducao_dosimetria: number
        }
        Update: {
          ano_fiscal?: number
          assinaturas?: Json
          empresa_cnpj?: string
          finalizado_em?: string
          finalizado_por?: string | null
          id?: string
          reducao_dosimetria?: number
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
      incidentes_seguranca: {
        Row: {
          comunicacao: Json
          criado_por: string | null
          empresa_cnpj: string
          encerrado_em: string | null
          enviado_anpd_em: string | null
          id: string
          iniciado_em: string
          passos: boolean[]
        }
        Insert: {
          comunicacao?: Json
          criado_por?: string | null
          empresa_cnpj: string
          encerrado_em?: string | null
          enviado_anpd_em?: string | null
          id?: string
          iniciado_em?: string
          passos?: boolean[]
        }
        Update: {
          comunicacao?: Json
          criado_por?: string | null
          empresa_cnpj?: string
          encerrado_em?: string | null
          enviado_anpd_em?: string | null
          id?: string
          iniciado_em?: string
          passos?: boolean[]
        }
        Relationships: []
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
          atualizado_em: string
          base_prazo: string
          categoria_titulares: string[]
          codigo: string
          compartilhamento: string
          criado_em: string
          criado_por: string | null
          dados_pessoais: string[]
          dados_sensiveis: string[]
          empresa_cnpj: string
          finalidade_especifica: string
          genero_verbo: string
          hipotese_tratamento: string
          id: string
          infraestrutura: string
          justificativa_mitigacao: string | null
          salvaguardas: string[]
          setor: string
          tempo_retencao: string
        }
        Insert: {
          atualizado_em?: string
          base_prazo: string
          categoria_titulares?: string[]
          codigo?: string
          compartilhamento?: string
          criado_em?: string
          criado_por?: string | null
          dados_pessoais?: string[]
          dados_sensiveis?: string[]
          empresa_cnpj: string
          finalidade_especifica: string
          genero_verbo: string
          hipotese_tratamento: string
          id?: string
          infraestrutura: string
          justificativa_mitigacao?: string | null
          salvaguardas?: string[]
          setor: string
          tempo_retencao: string
        }
        Update: {
          atualizado_em?: string
          base_prazo?: string
          categoria_titulares?: string[]
          codigo?: string
          compartilhamento?: string
          criado_em?: string
          criado_por?: string | null
          dados_pessoais?: string[]
          dados_sensiveis?: string[]
          empresa_cnpj?: string
          finalidade_especifica?: string
          genero_verbo?: string
          hipotese_tratamento?: string
          id?: string
          infraestrutura?: string
          justificativa_mitigacao?: string | null
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
      cnpj_liberado: { Args: { _cnpj: string }; Returns: boolean }
      cnpj_valido: { Args: { _c: string }; Returns: boolean }
      cpf_valido: { Args: { _c: string }; Returns: boolean }
      empresa_ativa: { Args: { _cnpj: string }; Returns: boolean }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
      minha_empresa_id: { Args: never; Returns: string }
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
    },
  },
} as const
