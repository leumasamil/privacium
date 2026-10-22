import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Check, FileText, Lock, ScanEye, ShieldCheck, Gavel, ClipboardList } from "lucide-react";
import { PrivaciumLogo } from "@/components/priva/Logo";

const DEMO_MAIL = "mailto:contato@privacium.com.br?subject=Solicita%C3%A7%C3%A3o%20de%20Demonstra%C3%A7%C3%A3o%20ao%20Vivo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Privacium — Governança contínua de privacidade e LGPD" },
      { name: "description", content: "Programa contínuo de conformidade LGPD: Escudo Digital de IA, logs forenses SHA-256 e redução de até 75% em multas da ANPD." },
      { property: "og:title", content: "Privacium — Governança contínua de privacidade e LGPD" },
      { property: "og:description", content: "Transforme a conformidade com a LGPD em um programa contínuo de alta performance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const PASSOS = [
  { n: "01", t: "Preparar", icon: ClipboardList, d: "Diagnóstico de Entrada com 166 perguntas ponderadas e cálculo instantâneo da Nota Fiscal de Risco." },
  { n: "02", t: "Registrar", icon: FileText, d: "Registro de Operações de Tratamento (ROT · Art. 37) com travas lógicas e alerta vermelho para dados sensíveis e de menores." },
  { n: "03", t: "Implementar", icon: Lock, d: "Criptografia centralizada (BitLocker/Cryptomator) e Escudo Digital Proxy de IA que tokeniza dados em tráfego." },
  { n: "04", t: "Vigiar", icon: ScanEye, d: "Logs forenses imutáveis com hash SHA-256 (ISO 27037) e Plano de Resposta a Incidentes com SLA de 72 horas." },
  { n: "05", t: "Auditar", icon: Gavel, d: "RIPD algorítmico (ISO 42001) e Simulador de Dosimetria com abatimento de até 75% (Resolução CD/ANPD nº 4/2023)." },
];

const PLANOS = [
  { nome: "Core", publico: "PMEs e Agentes de Pequeno Porte (ATPPs)", preco: "R$ 450,00", itens: ["Esteira BLLOCO ágil", "Diagnóstico de Entrada", "Relatórios Visuais", "Emissão de PIs regulatórios"] },
  { nome: "Enterprise", publico: "Grandes Corporações", preco: "R$ 2.450,00", destaque: true, itens: ["Todos os recursos Core", "Módulo C-Suite (KPIs e atas de comitê)", "SDLC Seguro com dados sintéticos (Faker)", "Data Profiling contra Amianto Digital", "Regras contratuais internacionais"] },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <PrivaciumLogo size="sm" className="text-primary" />
          <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
            <a href="#problema" className="hover:text-foreground">O problema</a>
            <a href="#metodo" className="hover:text-foreground">Método</a>
            <a href="#planos" className="hover:text-foreground">Planos</a>
            <a href="#contato" className="hover:text-foreground">Contato</a>
          </nav>
          <Link to="/auth" className="rounded-sm border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground">Acessar Plataforma</Link>
        </div>
      </header>

      <section className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <p className="font-mono text-xs uppercase tracking-[0.25em]">Privacy by Design · ISO/IEC 27701 · 27037 · 42001</p>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight text-sidebar-accent-foreground md:text-6xl">
            Transforme a conformidade com a LGPD em um programa contínuo de alta performance.
          </h1>
          <p className="mt-6 max-w-3xl text-lg">
            Monitore o ciclo de vida dos dados, bloqueie vazamentos em inteligências artificiais com o Escudo Digital Proxy e reduza em até 75% o valor de eventuais multas administrativas da ANPD com a Metodologia PRIVA.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href={DEMO_MAIL} className="inline-flex items-center gap-2 rounded-sm bg-sidebar-primary px-6 py-3 font-medium text-sidebar-primary-foreground hover:opacity-90">
              Solicitar Demonstração ao Vivo <ArrowRight className="h-4 w-4" />
            </a>
            <Link to="/auth" className="rounded-sm border border-sidebar-border px-6 py-3 font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent">Acessar Plataforma</Link>
          </div>
        </div>
      </section>

      <section id="problema" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">O problema invisível</p>
        <h2 className="mt-3 text-3xl font-semibold">A LGPD não é um documento. É uma operação.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-md border-l-4 border-destructive bg-secondary p-6">
            <p className="flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="h-5 w-5" /> Conformidade estática</p>
            <p className="mt-3 text-sm text-muted-foreground">Empresas tratam a LGPD como projeto pontual — um “entregável de Word/PDF” arquivado. Seis meses depois, processos, sistemas e fornecedores mudaram e o documento já não prova nada perante a ANPD.</p>
          </div>
          <div className="rounded-md border-l-4 border-destructive bg-secondary p-6">
            <p className="flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="h-5 w-5" /> Risco 2026: dados em prompts de IA</p>
            <p className="mt-3 text-sm text-muted-foreground">Colaboradores colam CPFs, dados de clientes e segredos de negócio em ferramentas de Inteligência Artificial — sem auditoria, sem rastro e sem controle de vazamento.</p>
          </div>
        </div>
      </section>

      <section id="metodo" className="scroll-mt-20 border-y bg-secondary">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">A solução · Método BLLOCO</p>
          <h2 className="mt-3 text-3xl font-semibold">Ciclo Privacium Semestral: 5 passos contínuos</h2>
          <ol className="mt-12 grid gap-4 md:grid-cols-5">
            {PASSOS.map((p) => (
              <li key={p.n} className="group rounded-md border bg-card p-5 transition hover:-translate-y-1 hover:border-primary">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{p.n}</span>
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 text-lg font-semibold">{p.t}</p>
                <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Planos recorrentes</p>
        <h2 className="mt-3 text-3xl font-semibold">Preço transparente, sem surpresas</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {PLANOS.map((pl) => (
            <div key={pl.nome} className={`rounded-md border p-8 ${pl.destaque ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>
              <p className="font-mono text-xs uppercase tracking-widest opacity-70">Plano {pl.nome}</p>
              <p className="mt-1 text-sm opacity-80">{pl.publico}</p>
              <p className="mt-6 text-4xl font-semibold">{pl.preco}<span className="text-base font-normal opacity-70"> / mês</span></p>
              <ul className="mt-6 space-y-3 text-sm">
                {pl.itens.map((i) => <li key={i} className="flex gap-2"><Check className="h-4 w-4 shrink-0" /> {i}</li>)}
              </ul>
              <a href={DEMO_MAIL} className={`mt-8 inline-flex w-full justify-center rounded-sm px-4 py-3 text-sm font-medium ${pl.destaque ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"}`}>Solicitar Demonstração</a>
            </div>
          ))}
        </div>
      </section>

      <footer id="contato" className="scroll-mt-20 bg-sidebar text-sidebar-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3">
          <div>
            <PrivaciumLogo size="sm" className="text-sidebar-accent-foreground" />
            <p className="mt-4 text-sm">privacium.com.br</p>
          </div>
          <nav className="flex flex-col gap-2 text-sm">
            <a href="#metodo" className="hover:text-sidebar-accent-foreground">Método BLLOCO</a>
            <a href="#planos" className="hover:text-sidebar-accent-foreground">Planos</a>
            <Link to="/auth" className="hover:text-sidebar-accent-foreground">Acessar Plataforma</Link>
          </nav>
          <form action="mailto:contato@privacium.com.br" method="post" encType="text/plain" className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase tracking-widest" htmlFor="email-contato">Contato corporativo</label>
            <input id="email-contato" name="email" type="email" required placeholder="seu.nome@empresa.com.br" className="rounded-sm border border-sidebar-border bg-sidebar-accent px-3 py-2 text-sm text-sidebar-accent-foreground" />
            <button className="rounded-sm bg-sidebar-primary px-3 py-2 text-sm font-medium text-sidebar-primary-foreground">Quero ser contatado</button>
          </form>
        </div>
        <p className="mx-auto max-w-6xl border-t border-sidebar-border px-6 py-6 text-[11px] leading-relaxed">
          <ShieldCheck className="mr-1 inline h-3 w-3" /> A infraestrutura Privacium opera sob os pilares de Privacy by Design e rastreabilidade forense (ISO/IEC 27037), com trilha de auditoria imutável por hash SHA-256. As estimativas de redução de multa seguem a Resolução CD/ANPD nº 4/2023 e não constituem garantia de resultado em processo fiscalizatório.
        </p>
      </footer>
    </div>
  );
}
