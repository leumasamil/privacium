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

- Brand: Privacium (privacium.com.br), never "PRIVA 2EC"; consistent identity.

- BLLOCO: realtime `workspace_empresa` JSON per CNPJ; localStorage holds active CNPJ/role to preserve company-bound progress.
- Audit entries are only written via the `registrar_trilha` security-definer RPC into `trilha_auditoria_sistema` (server-side SHA-256 chain incl. CNPJ, no update/delete grants); checked with `verificar_trilha`; opening screens with personal data logs a SELECT. Why: blueprint forensic traceability. `audit_log`/`workspace_state` are deprecated.
- `user_roles`: first signup ADMIN_SISTEMA+DPO_OPERACIONAL, later signups roleless until admin assignment; least privilege.
- `empresas` (contract/plan/status per CNPJ, auto-synced from `workspace_empresa` inserts) and `usuarios` (1:1 with profiles; `perfil_acesso` = primary role synced from `user_roles`, which remains the source of truth for multi-role RBAC). Why: blueprint data model without breaking existing progress storage.
- Audit writes go through `registrar_acesso` (forensic columns: usuario_id, acao_executada, tabela_afetada, campo_mascarado_acessado, ip_origem from request headers, timestamp_evento, hash_integridade_sha256) alongside the legacy hash chain; `registrar_trilha` wraps it. Masked-field eye clicks always log. Why: ISO 27037 accountability.
- `/painel`: ADMIN contracts/volumetria; DPO BLLOCO; C_SUITE ERM, no raw personal data. Email/password and managed OAuth redirect only with a confirmed session to safe internal destinations.
- Diagnosis uses perguntas_diagnostico and respostas_diagnostico per CNPJ/question/CPF; trigger scores and realtime apply. GM divides by all weights, never question_bank or JSON answers. Why: attributable persistent scoring.
- Bloco 2 ROT lives in `registro_operacoes` (one row per process per CNPJ; a trigger generates PRIVA-<SETOR>-NNN, enforces Art. 7º/11 hipótese, rejects European jargon, and requires a mitigation justification on risky rows). PI-02 needs two signatures (DPO + Diretoria) before it becomes CHANCELADO. The old JSON `inventory` is no longer used. Why: Art. 37 ROT with server-side rule enforcement.
- Bloco 3 assets live in `ativos_seguranca` (ENDPOINT/COFRE per CNPJ); BitLocker recovery keys are in a separate `chaves_recuperacao` table readable only by DPO/ADMIN and loaded on demand with an audit log. Folder integrity hash = SHA-256 of root + sorted paths. The old JSON `assets` is no longer used. The cycle is named "Ciclo PRIVA" (never PDCA) in UI copy.
- Blocos 4/5 persist per CNPJ in `lotes_pgaudit` (monthly audit batches + SHA-256), `incidentes_seguranca` (72h SLA, 6 steps, ANPD form), `ripd_ia` and `ciclos_priva` (one row per finished fiscal year; finishing clears signatures to reopen Bloco 1). Dosimetry rules live in `src/lib/priva/dosimetria.ts` (75% cap). Why: blueprint requires per-CNPJ realtime persistence.
- Super-admin data (`faturamento_saas`, `metricas_uso_ia`) is ADMIN_SISTEMA-only via RLS; rows auto-created per empresa by trigger; GM per company via `admin_gm_empresas` RPC; AI shield usage via `registrar_uso_ia`; suspended companies are blocked server-side by RESTRICTIVE `cnpj_liberado` policies on every per-CNPJ table (admin bypasses); DPOs read only the trail of their own `usuarios.empresa_id`, set by admin in Membros or on first company creation. Why: multi-tenant isolation.
- Public /demo: static fixtures, shared views, AppLink tabs, toast-only operations; guard untouched. Demo-only step presentation never changes submission/closure rules. Authenticated exit restores real data. Why: isolation without false evidence.
- ROT field 7 is split: `hipotese_tratamento` = 7A (art. 7º, dado pessoal, always required) and `hipotese_sensivel` = 7B (art. 11, required only when a dado pessoal sensível is listed, cleared otherwise); legacy rows with art. 11 in 7A are migrated on edit. Rules live in `src/lib/priva/rot.ts` and the DB trigger. Why: LGPD separates arts. 7º and 11.
- DPO public contact is stored per company in `encarregado_dpo`, separately from login credentials; changes are audited by trigger. ANPD submissions use `enviar_comunicacao_anpd` to validate ROT categories, tenant, contact and response steps and append the audit atomically. Why: prevent forged contacts and incomplete or unaudited communications.
- Block 4 reads one CNPJ snapshot through useEstadoBloco4 and derives incident state exclusively through carregarEstadoIncidente; step evidence and closure use audited transactional RPCs. PI-04 signatures follow incident closure, never precede it. Why: prevent conflicting states, unaudited closure and circular BLLOCO prerequisites.
- External DTOs are authenticated, RLS-scoped, read-only and cached; comparisons stay outside PIOutput, audit and progress. ANPD catalogs use DB-canonicalized JSON pairs and shared PI-04 formatters; legacy submissions stay intact. Categories come from linked ROT, with closed fallback for empty fields; stage evidence is required. Suggestions respect DPO deselection.
- Supplier references persist only in isolated monitor tables; server-only matching follows authenticated tenant/role authorization and a DB cooldown. Decision RPCs audit internal IDs/states only; explicit own-impact confirmation creates a clean incident. Monitor never feeds PI documents, blockers or progress.

- ANPD has a standalone authenticated incident-ID route (un-nested from Block 4) and shared pending links; risk selections are DB-canonicalized with required case details, while vector suggestions never prove completed actions. Why: reliable crisis navigation, normative traceability and no false evidence.
- AppShell mounts sticky AvisoModoDemo above content; navigation wraps and missing paths share a 404. Why: explain inert controls and preserve routing failures.
- Tenant tables require restrictive company policies beyond role checks; only admins change company linkage and audit writes use RPCs. Why: prevent cross-company access.
- Glossary terms and dashboard indicators come from one shared glossary module. Why: no bare acronyms; every metric shows definition, formula and action.
