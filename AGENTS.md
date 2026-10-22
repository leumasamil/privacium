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

- PRIVA 2EC shared state lives in one `workspace_state` row (JSON) synced via realtime; per-user role choice stays in localStorage. Why: single-tenant prototype, simple sharing.
- Audit entries are only written via the `append_audit` security-definer RPC (server-side SHA-256 chain, no update/delete grants); integrity is checked with `verify_audit_chain`. Why: immutable ISO 27037 trail.
- Roles live in `user_roles`; first signup becomes admin+dpo, later signups have no role until an admin grants one. Why: least privilege.
