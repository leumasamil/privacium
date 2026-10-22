<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Shared BLLOCO progress is stored per CNPJ in `workspace_empresa` (one JSON row per company, realtime); active CNPJ and role choice stay in localStorage. Why: blueprint ties progress to each CNPJ.
- Audit entries are only written via the `registrar_trilha` security-definer RPC into `trilha_auditoria_sistema` (server-side SHA-256 chain incl. CNPJ, no update/delete grants); checked with `verificar_trilha`; opening screens with personal data logs a SELECT. Why: blueprint forensic traceability. `audit_log`/`workspace_state` are deprecated.
- Roles live in `user_roles`; first signup becomes ADMIN_SISTEMA+DPO_OPERACIONAL, later signups have no role until an admin grants one. Why: least privilege.
- `empresas` (contract/plan/status per CNPJ, auto-synced from `workspace_empresa` inserts) and `usuarios` (1:1 with profiles; `perfil_acesso` = primary role synced from `user_roles`, which remains the source of truth for multi-role RBAC). Why: blueprint data model without breaking existing progress storage.
- Audit writes go through `registrar_acesso` (forensic columns: usuario_id, acao_executada, tabela_afetada, campo_mascarado_acessado, ip_origem from request headers, timestamp_evento, hash_integridade_sha256) alongside the legacy hash chain; `registrar_trilha` wraps it. Masked-field eye clicks always log. Why: ISO 27037 accountability.
- `/painel` renders a role-specific dashboard (ADMIN: contracts/volumetria; DPO: BLLOCO onboarding; C_SUITE: ERM map, no raw personal data). Login is email/password only.
- Bloco 1 diagnosis reads `perguntas_diagnostico` (166 generated rows, fixed weight per LGPD critical question) and stores answers in `respostas_diagnostico` (one row per CNPJ+question, tied to the auditor CPF, score set by trigger, realtime). GM uses the literal 1660-point scale. `question_bank` and the shared JSON `answers` are no longer used. Why: answers must persist per click, tied to CNPJ and CPF.
