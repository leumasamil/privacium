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
- Bloco 1 diagnosis reads `perguntas_diagnostico` (166 generated rows, fixed weight per LGPD critical question) and stores answers in `respostas_diagnostico` (one row per CNPJ+question, tied to the auditor CPF, score set by trigger, realtime). GM divides by the real sum of all question weights. `question_bank` and the shared JSON `answers` are no longer used. Why: answers must persist per click, tied to CNPJ and CPF.
- Bloco 2 ROT lives in `registro_operacoes` (one row per process per CNPJ; a trigger generates PRIVA-<SETOR>-NNN, enforces Art. 7º/11 hipótese, rejects European jargon, and requires a mitigation justification on risky rows). PI-02 needs two signatures (DPO + Diretoria) before it becomes CHANCELADO. The old JSON `inventory` is no longer used. Why: Art. 37 ROT with server-side rule enforcement.
- Bloco 3 assets live in `ativos_seguranca` (ENDPOINT/COFRE per CNPJ); BitLocker recovery keys are in a separate `chaves_recuperacao` table readable only by DPO/ADMIN and loaded on demand with an audit log. Folder integrity hash = SHA-256 of root + sorted paths. The old JSON `assets` is no longer used. The cycle is named "Ciclo PRIVA" (never PDCA) in UI copy.
- Blocos 4/5 persist per CNPJ in `lotes_pgaudit` (monthly audit batches + SHA-256), `incidentes_seguranca` (72h SLA, 6 steps, ANPD form), `ripd_ia` and `ciclos_priva` (one row per finished fiscal year; finishing clears signatures to reopen Bloco 1). Dosimetry rules live in `src/lib/priva/dosimetria.ts` (75% cap). Why: blueprint requires per-CNPJ realtime persistence.
- Super-admin data (`faturamento_saas`, `metricas_uso_ia`) is ADMIN_SISTEMA-only via RLS; rows auto-created per empresa by trigger; GM per company via `admin_gm_empresas` RPC; AI shield usage via `registrar_uso_ia`; suspended companies are blocked server-side by RESTRICTIVE `cnpj_liberado` policies on every per-CNPJ table (admin bypasses); DPOs read only the trail of their own `usuarios.empresa_id`, set by admin in Membros or on first company creation. Why: multi-tenant isolation.
