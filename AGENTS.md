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
