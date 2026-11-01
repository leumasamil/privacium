- [x] Volumetria total na Trilha Forense Master + checar isolamento RLS
- [x] Cadastrar contato do encarregado por CNPJ com isolamento e auditoria.
- [x] Completar formulário ANPD, validação, envio simulado e SLA congelado.
- [x] Conectar pendências e PDFs ao contato real; verificar fluxo autenticado.
- [ ] Conectar contato à política gerada: bloqueado porque não existe gerador de política no aplicativo atual.
- [x] Unificar estado do incidente, pendências e encerramento com feedback.
- [x] Registrar etapas e encerramento atomicamente; verificar fluxo autenticado e testes.
- [x] Acrescentar referências públicas semelhantes, consulta às bases e cinco notícias no Bloco 4, isoladas de documentos e auditoria.
- [x] Verificar fontes, cache, regras de isolamento e consulta autenticada das referências.
- [x] Acrescentar catálogo de naturezas do incidente, seleção assistida e fonte normativa na comunicação ANPD.
- [x] Exibir natureza e fonte no PI-04 e PDFs, preservando comunicações anteriores.
- [x] Validar persistência, seleção e documentos com testes e navegação autenticada.
- [x] Integrar 24 medidas ANPD, sugestões por etapa e texto automático copiável.
- [x] Persistir fontes canônicas e incluir medidas no PI-04 sem alterar registros anteriores.
- [x] Verificar regras e fluxo autenticado das medidas.
- [x] Integrar categorias ROT e catálogo padrão, fontes e criticidade.
- [x] Completar foco, progresso, pendências destacadas e cores semânticas.
- [x] Verificar persistência e fluxo autenticado da Parte 4.
- [x] Completar referências existentes e monitor conservador de fornecedores.
- [x] Persistir monitor por CNPJ, decisões auditadas e cooldown sem copiar evidências externas.
- [x] Integrar alertas no Bloco 4, badges no ROT e próximo passo secundário.
- [x] Verificar isolamento, decisões e fluxo autenticado da Parte 5.
- [x] Corrigir acesso por ID ao formulário ANPD em faixa, checklist e PI-04.
- [x] Integrar 11 riscos assistidos e sugestões de medidas por vetor, com fontes e preservação das escolhas do DPO.
- [x] Validar riscos e medidas atomicamente e verificar fluxo autenticado e PDF.
- [x] Verificar RPCs e executar etapas/encerramento com sessão real.
- [x] Explicar bloqueio no modo demonstração com saída acessível.
- [x] Auditar e corrigir isolamento RLS por tabela; documentar limpeza do histórico.
- [ ] Ignorar .env e .env.*: bloqueado pelo .gitignore gerenciado somente leitura; requer edição no repositório externo.
- [x] Criar página 404 explícita e verificar navegação.
- [x] Extrair AvisoModoDemo com AlertTriangle no topo das telas e ajustar texto da página 404; verificar saída e rotas inexistentes.
- [x] Revalidar exclusões de ambiente, credenciais privadas e RLS das 23 tabelas; documentar limpeza do histórico e recomendação de rotação (exclusão bloqueada conforme pendência acima).
- [x] Corrigir retorno do login e destino seguro, com Lovable apenas na visualização incorporada.
- [x] Criar demonstração pública isolada, seed ANPD completo e ações com aviso, preservando guard e RLS.
- [x] Executar os dez critérios: b–j passaram localmente (b com resposta controlada e dica condicional sem enumerar contas); a aguarda publicação e autorização Google interativa.
- [ ] Validar login Google completo no app publicado: bloqueado pela publicação ainda não solicitada e consentimento Google interativo.
- [x] Completar seis etapas cenográficas sem envio ou encerramento e preservar bloqueio do Bloco 5.
- [x] Conferir ações demo clicáveis mesmo com validação pendente e aviso sem requisições.
- [x] Executar os seis testes do anexo: todos passaram na visualização local; fluxo demo sem requisições ao banco.
- [x] Exibir responsável cenográfico nas seis etapas do Bloco 4 e completar as evidências específicas do anexo.
- [x] Executar os sete critérios do checklist demo: a–g passaram localmente, com zero requisições ao banco ou funções internas.
- [x] Quebrar o circuito fechado do incidente: etapa 06 como consequência do envio, não pré-requisito (regra, não seed).
- [x] Demo em memória: envio ANPD simulado → etapa 06 → encerramento → chancela PI-04 → Bloco 5 na mesma sessão, delta 0 no banco.
- [x] Substituir "SLA de 72 horas" por 3 dias úteis (Res. CD/ANPD nº 15/2024, art. 6º) com contador de dias úteis.
- [x] Corrigir atalhos do Dashboard e do Bloco 4 para aba=anpd; auditar todos os atalhos.
- [x] Popular Trilho Core no demo com eventos do seed + eventos em memória com SHA-256 encadeado.
- [x] Executar provas de aceitação (a) a (j) e atualizar testes que codificavam o comportamento antigo.
- [x] Envio 2: bibliotecaTextos.ts determinística com modelos copiáveis (cabeçalho/rodapé obrigatórios) e evento de cópia na trilha.
- [x] Envio 2: PI-03 — "Copiar modelo" nos chips do Escudo, estrutura+inventário no Cryptomator, padrão de nomenclatura no BitLocker, "Copiar dossiê (modelo)".
- [x] Envio 2: PI-05 — botões de copiar nas sugestões; pedagogia normativa expansível (LGPD arts. 5º/6º/14/20/46/48; Res. 15/2024 arts. 3º e 6º).
- [ ] Envio 2: provas e2e de cópia com clipboard (e, f, h, i) — unitárias feitas; e2e de clipboard pendente.

## Envio 3 — MCI + Lei de IA
- [x] Corrigir apenas dosimetria PI-05: pesos dos PIs chancelados, desconto residual declarado, memória e valor final únicos; 179 testes unitários, 2 e2e e documento/simulador conferidos. RIPO atual não contém pontos percentuais explícitos; não converter escores em percentuais inventados.
- [x] MCI art. 15 no console pgAudit (Bloco 4) com tooltip pedagógico.
- [x] MCI art. 10 + prazo de retenção na Trilha de Auditoria.
- [x] Seção "Marco Civil da Internet" (art. 7º, VIII) no Manual de Uso.
- [x] PI-05: classificação determinística de risco de IA com "Derivado de:" e override auditado.
- [x] Inventário de sistemas de IA alimentado pelo PI-03 (sem digitação duplicada).
- [x] Painel AIA com 4 eixos + rótulo de escopo + ressalva PL 2338 em tramitação.
- [x] Testes unitários + e2e (a)–(i); provar delta 0, guards/migrations intactos.
- [x] ROT: papel do agente (Bloco 1 + por linha) e camada de produto interno com destino ancorado — TAREFA A/B/C do anexo

- [x] Etapa 2 como lista de PRT + cadastro de Terceiros (migração 0040).
- [x] Divergência art. 39 resolvida: checklist renomeado como instrumento do método; suboperador pelo art. 42, § 1º, I.
- [x] Tarefa A: finalidade sugerida v2 no campo 6, aviso de equivalência e contador de padronização.
- [ ] Tarefa B: PRT como entidade (`produtos_tratamento`/`produtos_destino`) e grafo "Cadeia de custódia".
- [ ] Tarefa C: incidente com seleção de nó e relatório "Prova de cadeia de custódia" (art. 43) — depende da B.
- [ ] Tarefa D: conferir demo /demo com lista de PRT e bloqueio — depende da B.

## Dosimetria NULL + Biblioteca normativa versionada
- [x] Parte A: `ciclos_priva.reducao_dosimetria` aceita NULL; 0→NULL; relatório exibe "não calculado"; teste.
- [x] Parte B: tabela `biblioteca_normativa` + seed (51 verificadas + 8 não verificáveis), regra de renderização, painel "Qualidade normativa" com filtro e verificação auditada, teste B.5.
- [ ] Pendência de decisão: empresa SLN tem 2 ciclos legados com redução 48% (método rejeitado); tarefa só mandou converter os zeros — aguardando orientação.

## Exclusão lógica do ROT (migração 0044)
- [x] Exclusão lógica com data, autor e motivo; grafo, PI-02 e relatório art. 43 exibem a remoção.
- [x] Grafo: "Etapa 1 receptor: ausente" para destino Interno sem receptor; nota do hash; seleção do nó auditada.
- Limitação: Linhas excluídas antes da migração 0044 não são recuperáveis — o histórico anterior tem lacunas.

## Remoção de registro de teste + prova real da seleção do nó (migração 0045)
- [x] Coluna `origem` (REAL/TESTE/DEMONSTRACAO) + `removida_do_dossie` no ROT; RPC auditada `remover_registro_de_teste` (só ADMIN_SISTEMA, justificativa obrigatória, hash na trilha).
- [x] PRIVA-TI-001 da empresa real marcada TESTE e fora do dossiê (justificativa registrada); PI-02 e grafo não a exibem mais.
- [x] Prova real na empresa de teste: incidente criado, seleção do nó gravada na trilha com hash (sem simulação) e relatório com o mesmo hash.
- [x] Regra A.5: testes automatizados nunca criam dados na empresa real — só na empresa de teste ou com rollback.

## Direitos do titular e continuidade do receptor
- [x] Registrar sete dispositivos verificados; item 9.7 e incidência normativa com separação do fomento econômico.
- [x] Índice salgado por empresa e atendimento auditado com prazos, roteamento e negativa fundamentada.
- [x] Escolha expressa no receptor, duas declarações para uso exclusivo e cadeia de múltiplos saltos.
- [x] Testes de regras/isolamento, CT-1 a CT-5 e capturas renderizadas dos fluxos reais na empresa de teste.

## Demonstração pública — titulares (concluído 2026-11-01)
- [x] Auditoria de supressão (AppShell:101 e demais `demo &&`)
- [x] Aba `titulares` na demo pública com fixtures cenográficas
- [x] Trava das duas declarações valendo também na demo
- [x] Publicação e comprovação renderizada no link público (12 provas)

## Cinco quebras de coerência do ROT
- [ ] Corrigir cabeçalho, coluna 2 e terminologia explicativa, preservando os verbos e dados existentes.
- [ ] Exibir destino pendente e impedir destino definitivo sem escolha registrada do receptor.
- [ ] Corrigir Financeiro e Recepção cenográficos e sinalizar origem excluída no Jurídico.
- [ ] Verificar regras, CT-1 a CT-5, publicar e capturar provas no link público versionado.
