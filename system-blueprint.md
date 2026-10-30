# Blueprint de Arquitetura Contínua - Privacium SaaS

## 0. Identidade da Marca

- Marca do produto: Privacium (domínio oficial: privacium.com.br)
- Metodologia proprietária: Método BLLOCO (inalterada)

## 1. Pilares de Desenvolvimento e Tecnologias

- **Front-end:** React, TypeScript, Tailwind CSS, Lucide Icons (Design System: Visual Law corporativo refinado, sóbrio e scannable).

- **Back-end & Banco de Dados:** Supabase (PostgreSQL) com Row Level Security (RLS) habilitado de forma mandatória.

- **Strict Rule:** É expressamente proibido misturar blocos de Python ou PHP nos arquivos locais do projeto. Motores de IA externos e criptografia de volume complexa serão integrados e emulados via chamadas de API nativas em TypeScript.

## 2. Premissas de Compliance (Privacy by Design)

- **Segregação de Papéis (RBAC):** 'ADMIN_SISTEMA', 'DPO_OPERACIONAL', 'C_SUITE'.

- **Rastreabilidade Forense:** Toda leitura ou modificação de dado pessoal sensível DEVE registrar uma linha na tabela 'trilha_auditoria_sistema'.

- **Privacy by Default:** CPFs, CNPJs e e-mails de titulares aparecem ocultos/mascarados por padrão (ex: ***.555.***-77).

## 3. Estado da Linha de Montagem (Método BLLOCO)

O progresso é incremental e amarrado a cada CNPJ. O Bloco N+1 permanece bloqueado no front-end até que o Produto Interno Gerado (PI-0N) correspondente ao Bloco N receba o status 'CHANCELADO' via simulação de assinatura eletrônica qualificada Gov.br.

## 4. Pesos da Dosimetria

- Atenuação máxima de 75%: PI-01+02 = 20%, PI-03 = 20%, PI-04 = 20%, PI-05 = 15%.
- Antes da chancela do PI-05, sua contribuição é 0% e o subtotal é 60% quando os demais PIs estão chancelados.
- Redução efetiva = soma dos percentuais dos PIs chancelados − pontos residuais declarados no RIPO. Risco residual SUBTRAI, nunca soma. O teto de 75% nunca é excedido.
- Escores de probabilidade × impacto do RIPO NÃO são percentuais e não viram desconto sem declaração explícita.
- A memória de cálculo é exibida no PI-05 e validada por teste: soma − residuais = redução; valor final = base × (1 − redução/100).

## 5. Regras dos Modelos Copiáveis

- Cabeçalho obrigatório: "MODELO SUGERIDO PELO PRIVACIUM · Origem: <PI> · Fonte: <controle/norma> · Revise e adapte antes de assinar."
- Rodapé obrigatório: "Este é um modelo, não um parecer. A responsabilidade pela adequação é do controlador."
- Textos determinísticos em biblioteca estática (`bibliotecaTextos.ts`), sem IA generativa em runtime. A cópia gera evento na trilha com hash SHA-256.
- Padrões nunca preenchem ID, hostname ou hash.
- Pontos de uso: Bloco 3 (Política de IA, Cláusula de fornecedor, Entrada de ROT, Convenção de nomenclatura, Copiar dossiê) e Bloco 4 (riscos e medidas do formulário ANPD).

## 6. Ciclo de Vida do Dado Pessoal

O campo 2 do ROT, "Ciclo de vida (gênero × espécie)", permite seleção múltipla de gêneros e espécies. Esta seção documenta a estrutura já implementada e publicada.

Agrupamento didático dos 20 verbos do art. 5º, X da LGPD: espécies = verbos literais da lei; gêneros = agrupamento do método.

- COLETAR: coletar + receber, extrair, produzir, classificar.
- RETER: arquivar, armazenar.
- PROCESSAR: utilizar, acessar, avaliar ou controlar, modificar, reproduzir.
- COMPARTILHAR: comunicar, transferir, difundir, transmitir, distribuir.
- ELIMINAR: eliminar (verbo único).

Regras implementadas: o banco recusa espécie fora do elenco (teste com "vender"); o campo antigo recebe o primeiro gênero marcado por compatibilidade; exibição "Coletar › receber, classificar | ...".

Citações ISO por gênero: Coletar → 5.12 · Reter → 8.10 · Processar → 5.10 e 8.11 · Compartilhar → 5.14 · Eliminar → 8.10 e 7.10.

Registro de pendência: a citação "Res. CD/ANPD nº 2/2022, art. 9º" hoje aparece de forma incondicional em todas as linhas do ROT, inclusive para agentes de grande porte. Deve se tornar CONDICIONAL ao enquadramento do agente, conforme a seção 8.

## 7. Terminologia Obrigatória da LGPD

Estas regras valem para todo o produto:

- "Hipótese de tratamento" (arts. 7º e 11), nunca "base legal" (calque do GDPR).
- "Dado pessoal" e "dado pessoal sensível" no singular (art. 5º, I e II).
- Saída do perímetro: "comunicar, transferir, difundir" (art. 5º, X). "Compartilhar" somente como rótulo de gênero, nunca como termo jurídico.
- "Controlador" / "agente de tratamento", nunca "controlador de dados".
- "Titular", nunca "titular de dados".
- "Incidente de segurança", nunca "incidente de dados".
- "Área › Setor" como hierarquia.

## 8. Pendências Estruturais

Roadmap documental: os itens abaixo ainda não estão implementados.

- Enquadramento do agente por porte no Bloco 1 (critérios do art. 5º, XVII da LGPD e art. 3º da Res. 2/2022), assinado pelo DPO no PI-01, com efeito transversal nos blocos 2, 4 e 5 e citação da Res. 2/2022 condicionada a esse enquadramento.
- Matriz RAC no Bloco 1 (Membros: nome, CPF/CNPJ, e-mail, Área › Setor, papel R/A/C).
- Campos do ROT: "Área › Setor"; "Insumo (documento de entrada)"; "Meio de fornecimento".
- Sugestões determinísticas para Finalidade e hipóteses dos arts. 7º/11, nunca pré-selecionadas, sempre "Sugerido — confirme".
- Cadastro de Terceiros e Agentes de Tratamento no Bloco 1 (papel na cadeia: operador, suboperador/cocontrolador como construções doutrinárias sinalizadas; contrato art. 39; localização art. 33) + colunas 10A/10B no ROT.
- "Copiar fluxo" com revisão obrigatória dos campos jurídicos em cada clone.
