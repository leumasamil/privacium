# Blueprint de Arquitetura Contínua - PRIVA 2EC SaaS

## 1. Pilares de Desenvolvimento e Tecnologias

- **Front-end:** React, TypeScript, Tailwind CSS, Lucide Icons (Design System: Visual Law corporativo refinado, sóbrio e scannable).

- **Back-end & Banco de Dados:** Supabase (PostgreSQL) com Row Level Security (RLS) habilitado de forma mandatória.

- **Strict Rule:** É expressamente proibido misturar blocos de Python ou PHP nos arquivos locais do projeto. Motores de IA externos e criptografia de volume complexa serão integrados e emulados via chamadas de API nativas em TypeScript.

## 2. Premissas de Compliance (Privacy by Design)

- **Segregação de Papéis (RBAC):** 'ADMIN_SISTEMA', 'DPO_OPERACIONAL', 'C_SUITE'.

- **Rastreabilidade Forense:** Toda leitura ou modificação de dados pessoais sensíveis DEVE registrar uma linha na tabela 'trilha_auditoria_sistema'.

- **Privacy by Default:** CPFs, CNPJs e e-mails de titulares aparecem ocultos/mascarados por padrão (ex: ***.555.***-77).

## 3. Estado da Linha de Montagem (Método BLLOCO)

O progresso é incremental e amarrado a cada CNPJ. O Bloco N+1 permanece bloqueado no front-end até que o Produto Interno Gerado (PI-0N) correspondente ao Bloco N receba o status 'CHANCELADO' via simulação de assinatura eletrônica qualificada Gov.br.
