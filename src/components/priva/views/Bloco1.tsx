import { avisarAcaoDemo } from '@/lib/priva/demoAction';
import { AjudaTarefa } from "@/components/priva/AjudaTarefa";
import { AJUDA } from "@/lib/priva/ajuda";
import { useState } from "react";
import { DEPARTMENTS, computeGM, riskZone } from "@/lib/priva/data";
import { useHerdadas, useMeuCpf, useQuestions, useResponder, useRespostas } from "@/lib/priva/questions";
import { useQueryClient } from "@tanstack/react-query";
import { History } from "lucide-react";
import { isValidCPF, maskCNPJ } from "@/lib/priva/data";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { usePriva } from "@/lib/priva/store";
import { Masked, PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";



const ZONE_BG = { destructive: "bg-destructive", warning: "bg-warning", success: "bg-success" } as const;
const ZONE_TEXT = { destructive: "text-destructive", warning: "text-warning-foreground", success: "text-success" } as const;

function Gauge({ gm, tone }: { gm: number; tone: keyof typeof ZONE_BG }) {
  const angle = -90 + (Math.min(gm, 100) / 100) * 180;
  return (
    <svg viewBox="0 0 120 70" className="h-20 w-32">
      <path d="M10 60 A50 50 0 0 1 50.5 11" className="stroke-destructive" strokeWidth="10" fill="none" />
      <path d="M50.5 11 A50 50 0 0 1 93 25" className="stroke-warning" strokeWidth="10" fill="none" />
      <path d="M93 25 A50 50 0 0 1 110 60" className="stroke-success" strokeWidth="10" fill="none" />
      <g transform={`rotate(${angle} 60 60)`} className="transition-transform duration-500">
        <line x1="60" y1="60" x2="60" y2="18" className={cn("stroke-current", ZONE_TEXT[tone])} strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx="60" cy="60" r="5" className="fill-primary" />
    </svg>
  );
}

export function Bloco1() {
  const { cnpj, empresas, userId, email, log, demo } = usePriva();
  const questions = useQuestions();
  const answers = useRespostas(cnpj);
  const herdadas = useHerdadas(cnpj);
  const qc = useQueryClient();
  const { cpf, loading, salvar } = useMeuCpf(userId);
  const responder = useResponder(cnpj, cpf);
  const [dept, setDept] = useState<string>(DEPARTMENTS[0]);
  const [cpfInput, setCpfInput] = useState("");
  const [cpfErr, setCpfErr] = useState("");
  const { gm, score, bankMax } = computeGM(answers, questions);
  const zone = riskZone(gm);
  const answered = questions.filter((q) => q.id in answers).length;
  const qs = questions.filter((q) => q.department === dept);
  const razao = empresas.find((e) => e.cnpj === cnpj)?.razao_social ?? "";

  const answer = async (id: string, v: boolean) => {
    if (demo) return avisarAcaoDemo();
    const err = await responder([{ pergunta_id: id, resposta: v ? "SIM" : "NÃO" }]);
    if (err) toast.error(err);
    else void qc.invalidateQueries({ queryKey: ["herdadas", cnpj] });
    if (!err) log("UPDATE", "respostas_diagnostico", `Pergunta ${id.slice(0, 8)}=${v ? "SIM" : "NÃO"}`);
  };

  if (!cnpj) return <Panel title="Diagnóstico de entrada"><p className="text-sm text-muted-foreground">Cadastre ou selecione um CNPJ no menu lateral para iniciar o diagnóstico.</p></Panel>;
  if (!loading && !cpf) {
    return (
      <Panel title="Identificação do auditor responsável" className="max-w-md">
        <p className="mb-3 text-sm text-muted-foreground">Cada resposta é amarrada ao CNPJ auditado e ao CPF do auditor. Informe seu CPF para continuar.</p>
        <form className="flex gap-2" onSubmit={async (e) => {
          e.preventDefault();
          if (!isValidCPF(cpfInput)) return setCpfErr("CPF inválido.");
          const err = await salvar(cpfInput);
          setCpfErr(err ?? "");
          if (!err) log("UPDATE", "usuarios", "Cadastro do CPF do auditor", "cpf");
        }}>
          <Input value={cpfInput} onChange={(e) => setCpfInput(e.target.value)} placeholder="000.000.000-00" />
          <Button type="submit">Salvar</Button>
        </form>
        {cpfErr && <p className="mt-2 text-sm text-destructive">{cpfErr}</p>}
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Bloco 1 · (P) Ciclo Privacium Semestral" title="Preparar a Privacidade">
        Diagnóstico de Entrada pela LGPD. SIM soma o peso de criticidade da pergunta; NÃO soma zero.
      </PageHeader>
      <AjudaTarefa {...AJUDA[1]} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border-l-4 border-primary bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Empresa sob auditoria</p>
          <p className="mt-1 text-lg font-semibold text-primary">{razao || "—"}</p>
          <p className="mt-1">CNPJ <Masked kind="cnpj" value={cnpj} /></p>
        </div>
        <div className="rounded-md border-l-4 border-primary bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Auditor responsável</p>
          <p className="mt-1 text-lg font-semibold text-primary">{email}</p>
          <p className="mt-1">CPF {cpf ? <Masked kind="cpf" value={cpf} /> : "…"}</p>
        </div>
      </div>

      {/* Card flutuante de resultado */}
      <div className="sticky top-0 z-10 -mx-2 rounded-md border bg-card/95 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-6">
          <Gauge gm={gm} tone={zone.tone} />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Grau de Maturidade</p>
            <p className={cn("font-mono text-3xl font-semibold", ZONE_TEXT[zone.tone])}>{gm.toFixed(1)}%</p>
            <Tag tone={zone.tone}>{zone.label}</Tag>
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            <p>GM = (SA / Score Perfeito Real) × 100</p>
            <p className="mt-1 text-foreground">GM = ({score} / {bankMax}) × 100 = {gm.toFixed(1)}%</p>
          </div>
          <div className="ml-auto min-w-48 flex-1">
            <div className="flex justify-between text-xs text-muted-foreground"><span>Progresso</span><span className="font-mono">{answered}/{questions.length}</span></div>
            <div className="mt-1 h-2 rounded-sm bg-muted"><div className={cn("h-2 rounded-sm transition-all", ZONE_BG[zone.tone])} style={{ width: `${questions.length ? (answered / questions.length) * 100 : 0}%` }} /></div>
            <Button variant="link" size="sm" className="h-auto px-0" onClick={async () => {
              if (demo) return avisarAcaoDemo();
              const err = await responder(questions.map((q, i) => ({ pergunta_id: q.id, resposta: (i * 13) % 10 < 6 ? "SIM" : "NÃO" })));
              if (err) toast.error(err);
              else log("INSERT", "respostas_diagnostico", "Preenchimento de demonstração");
            }}>Preencher demonstração</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <nav className="space-y-1">
          {DEPARTMENTS.map((d) => {
            const list = questions.filter((q) => q.department === d);
            const a = list.filter((q) => q.id in answers).length;
            return (
              <button key={d} onClick={() => setDept(d)} className={cn(
                "flex w-full items-center justify-between rounded-sm border-l-4 px-3 py-2 text-left text-sm transition-colors",
                d === dept ? "border-primary bg-card font-semibold text-primary" : "border-transparent hover:bg-card",
              )}>
                {d}<span className="font-mono text-xs text-muted-foreground">{a}/{list.length}</span>
              </button>
            );
          })}
        </nav>

        <Panel id="diagnostico" title={`${dept} · ${qs.length} perguntas`}>
          {!questions.length && <p className="text-sm text-muted-foreground">Carregando banco de perguntas…</p>}
          <ul className="space-y-3">
            {qs.map((q) => (
              <li key={q.id} className="rounded-sm border bg-background p-4">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs text-muted-foreground">Q{questions.indexOf(q) + 1}</span>
                  <div className="flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{q.principle} · peso de criticidade {q.weight}</p>
                    <p className="mt-1 text-sm">{q.text}</p>
                    {herdadas.has(q.id) && <span title="Resposta herdada do ciclo anterior. Confirme ou altere." className="mt-1 inline-flex items-center gap-1 rounded-sm border border-dashed px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground"><History className="h-3 w-3" /> Histórico</span>}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button size="lg" variant={answers[q.id] === true ? "default" : "outline"} onClick={() => void answer(q.id, true)}>SIM {answers[q.id] === true && `+${q.weight}`}</Button>
                  <Button size="lg" variant={answers[q.id] === false ? "default" : "outline"} onClick={() => void answer(q.id, false)}>NÃO</Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {herdadas.size > 0 && <p className="rounded-sm border border-dashed bg-card p-3 text-sm"><History className="mr-1 inline h-4 w-4" /><b>Delta de Riscos:</b> {herdadas.size} respostas vieram do ciclo anterior. Revise e altere só o que mudou no negócio; depois finalize e colete as duas assinaturas do novo PI-01.</p>}
      <PIOutput pi="PI-01: Dossiê Legal de Alinhamento de Privacidade" ready={questions.length > 0 && answered === questions.length} readyHint={`Responda todas as perguntas (${answered}/${questions.length}).`}>
        <h3 className="font-semibold">1. Resultado do diagnóstico</h3>
        <p>Empresa: {razao} · CNPJ {maskCNPJ(cnpj)} · Auditor: {email}</p>
        <p>Grau de Maturidade: <b>{gm.toFixed(1)}%</b> ({score}/{bankMax}) — {zone.label}.</p>
        <h3 className="mt-4 font-semibold">2. Aderência por departamento</h3>
        <ul className="list-disc pl-5">
          {DEPARTMENTS.map((d) => {
            const s = questions.filter((q) => q.department === d);
            return <li key={d}>{d}: {s.filter((q) => answers[q.id]).length}/{s.length} controles atendidos</li>;
          })}
        </ul>
        <h3 className="mt-4 font-semibold">3. Fundamentação</h3>
        <p>Lei 13.709/2018 (LGPD), ISO/IEC 27701:2019 e Resolução CD/ANPD nº 2/2022.</p>
      </PIOutput>
    </div>
  );
}
