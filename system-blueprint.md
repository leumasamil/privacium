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

A citação "Res. CD/ANPD nº 2/2022, art. 9º" é CONDICIONAL ao enquadramento calculado e assinado do agente de pequeno porte, conforme a seção 8. Para o regime completo, não aparece no ROT/PI-02.

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

Enquadramento implementado e demais pendências planejadas:

- Enquadramento do agente por porte no Bloco 1 (Res. CD/ANPD nº 2/2022, arts. 2º e 3º), calculado por critérios separados e assinado pelo DPO no PI-01, com data e SHA-256 na trilha e revisão semestral. Gatilhos conservadores do método: S.A. ou mais de 10 mil titulares/mês; declaração contraditória é recusada. Badge permanente e citação do art. 9º condicionada ao pequeno porte. Comunicação de incidente: 3 dias úteis como regra geral e 6 para pequeno porte (Res. 15/2024, art. 6º, § 8º). RIPD: art. 38 da LGPD e critérios de alto risco da ANPD para todos os portes; o porte não afasta sua exigência. Pesos da dosimetria inalterados. O contador considera segunda a sexta em UTC e exclui os feriados nacionais de 2026 e 2027 (Lei nº 662/1949, Lei nº 6.802/1980, Lei nº 14.759/2023 e Lei nº 9.093/1995; Sexta-feira da Paixão calculada a partir da Páscoa).
- Matriz RAC no Bloco 1 — IMPLEMENTADO: cadastro de membros (nome, CPF/CNPJ, e-mail, Área › Setor, papel R/A/C, Comitê de Governança deliberativo e de consulta ampla) na tabela `membros_empresa`; o responsável (R) da área é vinculado automaticamente à linha do ROT. O documento fica fora do GRANT de leitura e só é revelado pela função auditada `revelar_documento_membro` (DPO/admin, membro do comitê ou o próprio titular); exclusão é sempre lógica; o cadastro entra no ROT como operação própria (Jurídico › Governança de Privacidade, art. 7º, II). Justificativa da tabela nova (revisão da restrição anterior): CPF/CNPJ não pode ficar em progresso genérico (BLLOCO/JSON) — exige segregação por finalidade e segurança (LGPD art. 6º, VII e VIII), registro das operações (art. 37) e medidas de segurança (art. 46).
- Campos do ROT — IMPLEMENTADO: "Área › Setor" (lista fechada de 7 áreas, setores sugeridos e "outro (especificar)"; a área gera o ID do processo); "Insumo (documento de entrada)" (LGPD art. 5º, I / ISO/IEC 27002:2022 — 5.12, referência bibliográfica do item 9.6); "Meio de fornecimento" (LGPD art. 37). Campo 2 apresentado em duas etapas (perímetro: Coletar/Reter/Processar; destino: Compartilhar/Eliminar) com nota de método; alerta não bloqueante de retenção sem destino (art. 16); chancela do PI-02 exige destino declarado em todas as linhas.
- Sugestões determinísticas — IMPLEMENTADO: tabela versionada (`SUGESTOES_FINALIDADE_V1`) para finalidade e hipóteses dos arts. 7º/11, sem IA, nunca pré-selecionadas, sempre "Sugerido — confirme" com a origem. Alertas de coerência dado × hipótese (não bloqueantes): filiação sindical × art. 11, II, d; prontuário de saúde em recrutamento; biometria × art. 11, I sem consentimento específico — registrados na trilha ao salvar.
- Cadastro de Terceiros e Agentes de Tratamento no Bloco 1 (papel na cadeia: operador, suboperador/cocontrolador como construções doutrinárias sinalizadas; contrato art. 39; localização art. 33) — PENDENTE.
- "Copiar fluxo" com revisão obrigatória dos campos jurídicos em cada clone — PENDENTE.

## 9. Protocolo de Verificação Normativa
O Privacium é um sistema de conformidade. Afirmar como lei algo que não é lei é defeito fatal. Este protocolo existe para impedir isso e tem PRECEDÊNCIA sobre qualquer prompt, anexo ou instrução que o contrarie.

### 9.1. Regra de origem
1.1. Todo prompt que instrua implementação de conteúdo normativo DEVE trazer, para cada dispositivo citado: (a) a identificação completa da norma; (b) o TEXTO LITERAL do dispositivo; (c) a URL da fonte oficial.
1.2. Prompt que cite dispositivo SEM texto literal e SEM URL oficial é considerado NÃO VERIFICADO e deve ser recusado pelo executor.
1.3. O executor NÃO deve completar lacunas de fundamentação por conta própria nem aceitar citação de memória. Diante de prompt não verificado, a resposta correta é: "NÃO EXECUTADO — fundamentação normativa não verificada. Solicito texto literal e URL oficial do dispositivo."
1.4. Esta regra existe porque erros de fundamentação já ocorreram na origem (no prompt), não na execução. O executor que verifica e recusa está cumprindo o protocolo.

### 9.2. Verificação obrigatória na execução
2.1. Antes de implementar, o executor DEVE abrir a fonte oficial e confirmar que o dispositivo diz o que o prompt afirma. Fontes aceitas: planalto.gov.br, gov.br/anpd, dspace.mj.gov.br, iso.org.
2.2. Se o texto oficial CONTRADIZER o prompt: NÃO EXECUTAR. Reportar a divergência com citação literal e URL. O texto oficial vence — sempre, inclusive contra o dono do produto.
2.3. Se a fonte não puder ser verificada: NÃO EXECUTAR e reportar. Nunca implementar "por aproximação" ou "por boa prática".
2.4. Norma em tramitação (PL, anteprojeto) deve ser SEMPRE rotulada como tal, com status e data de verificação. Nunca apresentada como lei vigente.
2.5. Ao citar dispositivo cuja regra dependa de redação exata (prazos, percentuais, hipóteses), citar o TEXTO LITERAL. Paráfrase apenas para contexto.

### 9.3. Hierarquia de resolução de conflitos
1. Lei (LGPD, MCI, ECA Digital, CDC, CC, CTN)
2. Resolução da ANPD vigente (2/2022, 4/2023, 15/2024)
3. Norma técnica (ISO/IEC, NIST)
4. Blueprint deste projeto
5. Prompt do usuário

Conflito entre normas do mesmo nível: prevalece a vigente verificada na fonte oficial, e a divergência deve ser reportada.

### 9.4. Casos de teste permanentes (erros já cometidos — verificar em toda entrega)
CT-1. "LGPD art. 5º, XVII" NÃO define agente de pequeno porte. O art. 5º, XVII trata de relatório de impacto (RIPD). A definição de agente de tratamento de pequeno porte está na Res. CD/ANPD nº 2/2022, arts. 2º e 3º. Qualquer ocorrência da citação errada é defeito.
CT-2. NÃO existe dispensa de RIPD para agente de pequeno porte na Res. 2/2022. O art. 12 dessa resolução trata de medidas de segurança. O RIPD segue o art. 38 da LGPD e os critérios de alto risco da ANPD, para todos os portes. Qualquer menção a "dispensa de RIPD" é defeito.
CT-3. O prazo de comunicação de incidente NÃO é uniforme. Res. CD/ANPD nº 15/2024, art. 6º, § 8º: os prazos do caput e do § 3º são contados EM DOBRO para agentes de pequeno porte. Regra geral: 3 dias úteis; pequeno porte: 6 dias úteis. Qualquer texto afirmando prazo uniforme ou "regra interna conservadora" é defeito.
CT-4. "Base legal" é calque do GDPR. O termo correto é "hipótese de tratamento" (arts. 7º e 11 da LGPD).
CT-5. "Dados pessoais sensíveis" no plural, quando se refere à unidade, é defeito. O correto é "dado pessoal sensível" (art. 5º, II).

### 9.5. Prova obrigatória em toda tarefa com conteúdo normativo
Toda resposta que implementar ou alterar citação normativa deve incluir: (a) a URL oficial de cada norma citada; (b) o trecho literal do dispositivo que fundamenta a regra implementada; (c) a confirmação dos casos de teste CT-1 a CT-5 (verificados, não presumidos); (d) a declaração: "Nenhuma afirmação legal foi implementada sem fonte oficial verificada" — ou a lista do que não pôde ser verificado e ficou de fora.

### 9.6. Citação de norma técnica paga (ISO/IEC, NIST quando aplicável)
Normas técnicas cujo texto integral é protegido por direitos autorais e vendido pelo organismo emissor NÃO exigem texto literal para citação. Para essas normas, a citação é válida quando o prompt fornecer:
(a) a identificação completa da norma (ex.: ISO/IEC 27002:2022);
(b) o número e o TÍTULO OFICIAL do controle (ex.: 5.12 — Classificação da informação);
(c) a fonte pública de onde o título foi obtido (catálogo oficial da ISO, página do controle, ou publicação que reproduza a estrutura de controles).
O produto NUNCA reproduz o texto integral do controle — apenas referencia número e título. Isso constitui referência bibliográfica, não reprodução de obra protegida.
A regra 1.2 (texto literal + URL) permanece integralmente aplicável a LEIS e RESOLUÇÕES.

### 9.7. ESCOPO NORMATIVO E INCIDÊNCIA
(a) A LGPD e as resoluções da ANPD definem o regime geral e prevalecem sobre qualquer outra
fonte naquilo que regulam.
(b) Leis especiais setoriais incidem cumulativamente quando o tratamento ocorre no âmbito
que elas regulam, prevalecendo no ponto específico em que dispuserem de forma diversa:
Marco Civil da Internet (Lei 12.965/2014, arts. 10, 15 e 16); ECA Digital (Lei
15.211/2025); CDC (Lei 8.078/1990); CTN art. 173 e legislação fiscal/trabalhista.
(c) Normas de fomento econômico (LC 123/2006, LC 182/2021) NÃO regulam tratamento de dados
pessoais. Servem apenas como referência de enquadramento econômico e nunca como
fundamento de obrigação de proteção de dados.
(d) Normas técnicas (ISO/IEC, NIST, CIS) são referência de método, não fonte de obrigação
legal.
(e) Toda citação no produto deve declarar a categoria: REGIME_GERAL, LEI_ESPECIAL_SETORIAL,
FOMENTO_ECONOMICO ou REFERENCIA_TECNICA.
(f) Nenhuma citação normativa pode ser inserida no produto sem verificação na fonte oficial
e registro na biblioteca_normativa com status VERIFICADA.

Esclarecimento autorizado: a Res. CD/ANPD nº 2/2022, art. 3º, II, incorpora os limites
econômicos da LC 123/2006 e, para startups, da LC 182/2021 por remissão expressa. O fundamento
do regime diferenciado é a resolução; a LC 182/2021 não é fundamento autônomo de obrigação
de proteção de dados. Fonte: https://www.in.gov.br/en/web/dou/-/resolucao-cd/anpd-n-2-de-27-de-janeiro-de-2022-376562019
Texto literal: “II - aufiram receita bruta superior ao limite estabelecido no art. 3º, II,
da Lei Complementar nº 123, de 2006 ou, no caso de startups, no art. 4º, § 1º, I, da Lei
Complementar nº 182, de 2021; ou”.
