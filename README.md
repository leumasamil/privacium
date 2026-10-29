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

A remoção de versões antigas exige `git filter-repo` em uma cópia isolada, por exemplo `git filter-repo --path .env --path-glob '.env.*' --invert-paths`. Não execute no projeto conectado: reescrever o histórico publicado pode apagar o histórico do Lovable. Planeje a limpeza e a reconexão antes de qualquer envio forçado. Esta atualização não reescreveu o histórico nem alterou o arquivo de ambiente gerenciado.

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
