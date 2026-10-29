# Privacium

Plataforma de governança de privacidade pelo Método BLLOCO.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://screenshot-snap-replica-93.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5223f7f5-d76b-43ef-b885-09f7baf593fd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Arquivos de ambiente e histórico público

O `.gitignore` gerenciado pelo ambiente está somente leitura e ainda não ignora `.env` e `.env.*`. Essas duas linhas precisam ser acrescentadas no repositório externo. Isso não remove arquivos já rastreados nem versões antigas. A chave publishable é pública por natureza: a proteção dos dados depende de autenticação, permissões e RLS, não de escondê-la.

A remoção de versões antigas deve ser planejada em uma cópia isolada, com backup seguro e coordenação da conexão GitHub/Lovable. O procedimento solicitado para remover `.env` é:

```sh
git filter-repo --path .env --invert-paths
git push --force
```

Se também existirem variantes no histórico, use **em lugar do primeiro comando**:

```sh
git filter-repo --path .env --path-glob '.env.*' --invert-paths
```

Esses caminhos são relativos à raiz; arquivos de ambiente em subpastas precisam de caminhos adicionais. Confira o remoto e a branch antes do envio: `filter-repo` pode remover o remoto `origin`, que precisa ser reconfigurado na cópia isolada. A limpeza deve abranger todas as branches e tags que contenham os arquivos; um único `git push --force` não garante isso. Cópias em forks e caches externos também não são removidas por esse procedimento.

**Atenção:** isso reescreve o histórico e pode apagar o histórico do projeto no Lovable. Todos os clones devem ser refeitos após a limpeza; não mescle novamente commits antigos. Não execute esses comandos no ambiente conectado. Nenhum comando de reescrita ou envio foi executado nesta atualização.

### Rotação da chave publishable

Recomenda-se avaliar a rotação preventiva da chave publishable e revogar a anterior após atualizar a configuração e verificar o aplicativo publicado. Ela é pública por natureza e aparece no navegador; sua exposição, isoladamente, não equivale ao vazamento de uma chave privada. URL e identificador do projeto também não são segredos. RLS e autenticação continuam obrigatórios. Este projeto usa Lovable Cloud, sem acesso a um painel externo do provedor: solicite a rotação pelo Lovable, não por um painel externo. A rotação **não foi executada** nesta auditoria.

## Auditoria completa de RLS — 29/10/2026

Consulta de catálogo ao banco atual: **23/23 tabelas do schema público com RLS ativo**; nenhuma delas concede SELECT a `anon`. Não foi necessário habilitar RLS em qualquer tabela. Os schemas gerenciados de autenticação e armazenamento não foram alterados e não fazem parte desta lista de tabelas da aplicação.

Na tabela abaixo, **Sim** significa que existe política permissiva aplicável ao comando, incluindo políticas `ALL`; **Não** significa que não existe política permissiva para ele. Isso não concede o comando por si só: também são necessários GRANT, cargo, políticas restritivas e validações. Admin significa `ADMIN_SISTEMA`, validado no banco.

| Tabela | RLS | SELECT | INSERT | UPDATE | DELETE | Filtro por CNPJ / escopo |
| --- | --- | --- | --- | --- | --- | --- |
| `ativos_seguranca` | Ativo | Sim | Sim | Sim | Sim | Sim, CNPJ próprio; exceção admin. |
| `audit_log` | Ativo | Sim | Não | Não | Não | Não; legado restrito ao admin. |
| `chaves_recuperacao` | Ativo | Sim | Sim | Sim | Sim | Sim, pelo CNPJ do ativo; exceção admin. |
| `ciclos_priva` | Ativo | Sim | Sim | Não | Não | Sim, CNPJ próprio; exceção admin. |
| `empresas` | Ativo | Sim | Não | Sim | Não | Leitura pela empresa vinculada (`empresa_id`), equivalente ao CNPJ; alteração só admin. |
| `encarregado_dpo` | Ativo | Sim | Sim | Sim | Não | Sim, CNPJ próprio; exceção admin. |
| `faturamento_saas` | Ativo | Sim | Sim | Sim | Sim | Não; todas as operações são exclusivas do admin. |
| `incidentes_seguranca` | Ativo | Sim | Sim | Sim | Sim | Sim, CNPJ próprio; exceção admin. UPDATE direto sem GRANT; etapas/envio/encerramento por RPC. |
| `lotes_pgaudit` | Ativo | Sim | Sim | Sim | Sim | Sim, CNPJ próprio; exceção admin. |
| `metricas_uso_ia` | Ativo | Sim | Sim | Sim | Sim | Não; todas as operações são exclusivas do admin. |
| `monitor_fornecedores` | Ativo | Sim | Não | Não | Não | Sim, CNPJ próprio; exceção admin. Escrita por funções autorizadas. |
| `monitor_verificacoes` | Ativo | Sim | Não | Não | Não | Sim, CNPJ próprio; exceção admin. Escrita por funções autorizadas. |
| `perguntas_diagnostico` | Ativo | Sim | Sim | Sim | Sim | Não; catálogo comum, leitura por membros e escrita só admin. |
| `profiles` | Ativo | Sim | Não | Sim | Não | Não; SELECT próprio/admin, UPDATE apenas próprio. |
| `question_bank` | Ativo | Sim | Sim | Sim | Sim | Não; catálogo comum, leitura por membros e escrita só admin. |
| `registro_operacoes` | Ativo | Sim | Sim | Sim | Sim | Sim, CNPJ próprio; exceção admin. |
| `respostas_diagnostico` | Ativo | Sim | Sim | Sim | Não | Sim, CNPJ próprio; exceção admin. |
| `ripd_ia` | Ativo | Sim | Sim | Sim | Sim | Sim, CNPJ próprio; exceção admin. |
| `trilha_auditoria_sistema` | Ativo | Sim | Não | Não | Não | Sim, CNPJ próprio; exceção admin. Escrita direta revogada; somente RPC auditada. |
| `user_roles` | Ativo | Sim | Sim | Não | Sim | Não; SELECT próprio/admin, atribuição e remoção só admin. |
| `usuarios` | Ativo | Sim | Não | Sim | Não | SELECT próprio/admin; UPDATE próprio/admin, mudança de vínculo empresarial apenas admin. |
| `workspace_empresa` | Ativo | Sim | Sim | Sim | Não | SELECT/UPDATE por CNPJ próprio/admin; criação por admin ou DPO ainda sem empresa, validada por trigger. |
| `workspace_state` | Ativo | Sim | Sim | Sim | Não | Não; legado restrito ao admin. |

Esta auditoria verifica políticas e privilégios atuais, não substitui testes de todas as operações com duas contas DPO de empresas distintas nem uma revisão completa das funções com privilégios elevados.

## Verificação de ações e acesso — 29/10/2026

As RPCs `registrar_etapa_incidente` e `encerrar_incidente` já existiam. O teste autenticado encontrou falta de `INSERT` para declarar incidentes; a permissão foi corrigida mantendo as políticas de acesso. Cinco chamadas de etapa retornaram HTTP 204; encerramento incompleto retornou `encerrado: false` e duas pendências; depois do envio simulado, retornou HTTP 200 e `encerrado: true`. Releitura confirmou seis evidências, encerramento e oito eventos com hashes SHA-256. O incidente de teste foi removido; os eventos de teste ficaram na trilha imutável. O incidente original não foi alterado.

As assinaturas do PI-04 continuam **depois** do encerramento; exigir assinaturas antes criaria bloqueio circular. As evidências continuam em `etapas_registro`, sem inventar uma segunda estrutura.

| Tabela solicitada | RLS e isolamento verificados |
| --- | --- |
| `usuarios` | RLS ativo; leitura própria/admin; alteração de vínculo empresarial restrita ao admin. |
| `empresas` | RLS ativo; leitura limitada à empresa vinculada, com exceção do admin. |
| `rot` | Não existe com esse nome; `registro_operacoes` tem RLS e filtro restritivo por CNPJ. |
| `trilha_auditoria_sistema` | RLS ativo; leitura por CNPJ/admin; escrita direta revogada, somente RPC. |
| `incidentes_seguranca` | RLS ativo; filtro restritivo por CNPJ e validações próprias nas RPCs. |
| `encarregado_dpo` | RLS ativo; leitura/edição por empresa e cargo autorizado. |
| `kanban` | Não existe como tabela; armazenado em `workspace_empresa.data`, protegido por CNPJ. |
| `incidente_etapas` | Não existe; `incidentes_seguranca.etapas_registro` usa o mesmo isolamento e RPC auditada. |
| `lotes_pgaudit` | RLS ativo; filtro restritivo por CNPJ. |

Também foram restringidos por empresa ativos, chaves de recuperação, respostas de diagnóstico, ciclos, RIPD e monitor de fornecedores. As 23 tabelas públicas têm RLS ativo e não concedem leitura a `anon`. Tabelas administrativas/catálogos/perfis mantêm regras específicas de cargo ou proprietário; tabelas legadas ficam limitadas ao admin. Esta verificação confirmou configuração e fluxo com a sessão disponível; não substitui teste entre duas contas DPO de empresas distintas.

Modo demonstração: faixa âmbar fixa, explicação e botão de saída verificados; formulário por ID não fica carregando indefinidamente. Rota `/$`: página explícita “Rota não encontrada”, sem redirecionar automaticamente para login.
