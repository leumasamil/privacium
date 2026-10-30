import { PageHeader, Panel } from "@/components/priva/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BLOCKS } from "@/lib/priva/data";
import { HIPOTESES_7A, HIPOTESES_7B } from "@/lib/priva/rot";

const T = "Manual de Uso — Privacium";
const D = "Guias 5W2H por bloco do Método BLLOCO, quadro art. 7º × art. 11, classificação de dados, glossário LGPD e FAQ.";


const GUIAS: Record<number, [string, string][]> = {
  1: [["O quê", "Responder às 166 perguntas do diagnóstico por setor e categoria LGPD."], ["Por quê", "Medir o Grau de Maturidade (GM) e a zona de risco da empresa."], ["Quem", "DPO / Encarregado, com apoio dos gestores de cada setor."], ["Onde", "Bloco 1, abas por setor; cada resposta fica salva no CNPJ ativo e no CPF do auditor."], ["Quando", "No início de cada Ciclo Privacium Semestral (Delta de Riscos herda as respostas anteriores)."], ["Como", "Marcar Sim/Não em cada pergunta e assinar o PI-01."], ["Quanto", "GM = pontos obtidos ÷ soma dos pesos (1.414). Meta: 76% ou mais (zona verde)."]],
  2: [["O quê", "Inventariar cada operação de tratamento nos 12 campos do ROT (art. 37)."], ["Por quê", "Comprovar a hipótese de tratamento de cada dado pessoal e dado pessoal sensível."], ["Quem", "DPO, com o gestor do processo; Diretoria assina junto."], ["Onde", "Bloco 2 · Planilha mestre. O ID Processo é gerado pelo sistema."], ["Quando", "Sempre que um processo novo surgir ou mudar; revisão a cada semestre."], ["Como", "Preencher os campos 1 a 12; o 7A (art. 7º) é sempre obrigatório e o 7B (art. 11) só quando há dado pessoal sensível."], ["Quanto", "PI-02 exige duas assinaturas: DPO e Diretoria."]],
  3: [["O quê", "Registrar salvaguardas técnicas: criptografia de endpoints, cofres e Escudo de IA."], ["Por quê", "Atender ao art. 46 (medidas de segurança)."], ["Quem", "DPO com a equipe de TI."], ["Onde", "Bloco 3 · ativos de segurança."], ["Quando", "Após o PI-02 chancelado."], ["Como", "Cadastrar equipamentos e cofres; chaves de recuperação só são vistas por DPO/Admin, com registro na trilha."], ["Quanto", "Cobertura de criptografia em 100% dos ativos com dado pessoal sensível."]],
  4: [["O quê", "Vigiar acessos (lotes de auditoria) e tratar incidentes."], ["Por quê", "Cumprir o art. 48 (comunicação de incidente à ANPD)."], ["Quem", "DPO e célula de resposta."], ["Onde", "Bloco 4 · console de auditoria e incidentes."], ["Quando", "Mensalmente (lotes) e em até 72 h após um incidente."], ["Como", "Seguir as 6 etapas do incidente e gerar o formulário ANPD."], ["Quanto", "Prazo de 72 horas para comunicação."]],
  5: [["O quê", "Elaborar o RIPD, calcular a dosimetria e fechar o ciclo."], ["Por quê", "Reduzir eventual multa (Resolução CD/ANPD nº 4/2023) e provar boa-fé."], ["Quem", "DPO e Diretoria."], ["Onde", "Bloco 5."], ["Quando", "Ao final do semestre."], ["Como", "Preencher o RIPD, conferir os atenuantes e finalizar o ciclo."], ["Quanto", "Atenuação máxima de 75% (PI-01+02 = 20%, PI-03 = 20%, PI-04 = 20%, PI-05 = 15%)."]],
};

const GLOSSARIO: [string, string][] = [
  ["Dado pessoal (art. 5º, I)", "Informação relacionada a pessoa natural identificada ou identificável."],
  ["Dado pessoal sensível (art. 5º, II)", "Dado pessoal sobre origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato ou a organização de caráter religioso, filosófico ou político, dado referente à saúde ou à vida sexual, dado genético ou biométrico, quando vinculado a uma pessoa natural."],
  ["Dado anonimizado (art. 5º, III)", "Dado relativo a titular que não possa ser identificado, considerando meios técnicos razoáveis. Não é dado pessoal, salvo se a anonimização puder ser revertida (art. 12)."],
  ["Titular (art. 5º, V)", "Pessoa natural a quem se referem os dados pessoais."],
  ["Controlador (art. 5º, VI)", "Quem toma as decisões sobre o tratamento."],
  ["Operador (art. 5º, VII)", "Quem realiza o tratamento em nome do controlador."],
  ["Encarregado (art. 5º, VIII)", "Canal de comunicação entre controlador, titulares e ANPD (DPO)."],
  ["Tratamento (art. 5º, X)", "Toda operação com dados pessoais: coleta, uso, acesso, armazenamento, compartilhamento, eliminação etc."],
  ["Hipótese de Tratamento (arts. 7º e 11)", "Autorização legal que permite tratar o dado. No ROT: 7A para dado pessoal e 7B para dado pessoal sensível."],
  ["RIPD (art. 5º, XVII)", "Relatório de Impacto à Proteção de Dados Pessoais."],
  ["ROT (art. 37)", "Registro das Operações de Tratamento mantido pelo controlador e pelo operador."],
];

const FAQ: [string, string][] = [
  ["Por que o campo 7 é dividido em 7A e 7B?", "A LGPD separa as hipóteses: o art. 7º vale para dado pessoal e o art. 11 para dado pessoal sensível. Um mesmo processo pode tratar os dois tipos, por isso cada um tem seu campo."],
  ["Quando o 7B fica bloqueado?", "Quando o campo 5 está como \"N/A\". Ao marcar qualquer dado pessoal sensível, o 7B passa a ser obrigatório; ao voltar para \"N/A\", ele é limpo automaticamente."],
  ["Posso usar o legítimo interesse para dado pessoal sensível?", "Não. O legítimo interesse (art. 7º, IX) e a proteção do crédito (art. 7º, X) não existem no art. 11."],
  ["Por que não consigo salvar o processo?", "O formulário diz exatamente o que falta: a mensagem em vermelho indica o campo pendente e como preenchê-lo (ex.: \"Preencha o campo 9 (Base do Prazo) para salvar — ele é obrigatório quando o campo 8 está preenchido.\"). Linhas com menores de idade ou dado pessoal sensível também exigem justificativa das medidas mitigadoras."],
  ["As sugestões automáticas são obrigatórias?", "Não. São atalhos com base no que já foi preenchido; o DPO sempre confere e decide."],
  ["Dado anonimizado precisa entrar no ROT?", "Em regra não, pois não é dado pessoal. Registre o processo de anonimização em si, que é tratamento de dado pessoal."],
  ["O que é registrado na trilha de auditoria?", "Toda leitura de tela com dado pessoal, toda alteração e cada clique para revelar um dado mascarado, com hash SHA-256 encadeado."],
];

export function Manual({ aba }: { aba?: string | undefined }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Transversal · Método BLLOCO" title="Manual de Uso">
        Como operar cada bloco do Ciclo Privacium Semestral, com terminologia estrita da LGPD.
      </PageHeader>
      <Tabs defaultValue={aba ?? "guias"}>
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="guias">Guias 5W2H</TabsTrigger>
          <TabsTrigger value="quadro">Art. 7º × Art. 11</TabsTrigger>
          <TabsTrigger value="naturezas">Classificação</TabsTrigger>
          <TabsTrigger value="glossario">Glossário</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="aviso">Aviso legal</TabsTrigger>
        </TabsList>

        <TabsContent value="guias" className="space-y-4">
          {BLOCKS.map((b) => (
            <Panel key={b.n} id={`bloco-${b.n}-guia`} title={`Bloco ${b.n} · (${b.letter}) ${b.title}`}>
              <table className="w-full text-sm"><tbody>
                {(GUIAS[b.n] ?? []).map(([k, v]) => (
                  <tr key={k} className="border-b last:border-0"><th className="w-28 py-2 pr-4 text-left align-top font-mono text-xs uppercase text-muted-foreground">{k}</th><td className="py-2">{v}</td></tr>
                ))}
              </tbody></table>
              <p className="mt-3 text-xs text-muted-foreground">Saída: {b.pi}</p>
            </Panel>
          ))}
        </TabsContent>

        <TabsContent value="quadro">
          <Panel title="Quadro comparativo · campo 7A × campo 7B">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="font-semibold text-primary">7A · Art. 7º — dado pessoal</p>
                <ul className="mt-2 space-y-1 text-sm">{HIPOTESES_7A.map((h) => <li key={h} className="border-b py-1">{h}</li>)}</ul>
              </div>
              <div>
                <p className="font-semibold text-primary">7B · Art. 11 — dado pessoal sensível</p>
                <ul className="mt-2 space-y-1 text-sm">{HIPOTESES_7B.map((h) => <li key={h} className="border-b py-1">{h}</li>)}</ul>
              </div>
            </div>
            <ul className="mt-6 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>No art. 11, o consentimento deve ser <b>específico e destacado</b>, para finalidades específicas.</li>
              <li>Legítimo interesse (7º, IX) e proteção do crédito (7º, X) <b>não</b> têm correspondente no art. 11.</li>
              <li>A prevenção à fraude e segurança do titular (11, II, g) existe só no art. 11.</li>
              <li>Dado de menor de idade segue o art. 14: consentimento específico de ao menos um dos pais ou responsável legal.</li>
            </ul>
          </Panel>
        </TabsContent>

        <TabsContent value="naturezas">
          <Panel title="Guia de classificação · três naturezas">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Dado pessoal", "Art. 5º, I", "Nome, CPF, RG, e-mail, telefone, endereço, dados bancários, imagem.", "Campo 4 · hipótese no 7A."],
                ["Dado pessoal sensível", "Art. 5º, II", "Saúde, biometria, dado genético, origem racial ou étnica, convicção religiosa, opinião política, filiação sindical, vida sexual.", "Campo 5 · hipótese obrigatória no 7B · tarja vermelha."],
                ["Dado anonimizado", "Art. 5º, III", "Estatísticas agregadas sem possibilidade razoável de reidentificação.", "Fora do ROT, salvo se a anonimização puder ser revertida (art. 12)."],
              ].map(([t, a, ex, rot]) => (
                <div key={t} className="rounded-sm border p-4">
                  <p className="font-semibold text-primary">{t}</p>
                  <p className="font-mono text-xs text-muted-foreground">{a}</p>
                  <p className="mt-2 text-sm">{ex}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{rot}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Pergunta-chave: <b>o dado identifica a pessoa?</b> Se não, é dado anonimizado. Se sim, <b>está na lista do art. 5º, II?</b> Se sim, é dado pessoal sensível; caso contrário, dado pessoal.</p>
          </Panel>
        </TabsContent>

        <TabsContent value="glossario">
          <Panel title="Glossário LGPD">
            <dl className="space-y-3 text-sm">{GLOSSARIO.map(([t, d]) => <div key={t}><dt className="font-semibold text-primary">{t}</dt><dd className="text-muted-foreground">{d}</dd></div>)}</dl>
          </Panel>
        </TabsContent>

        <TabsContent value="faq">
          <Panel title="Perguntas frequentes">
            <Accordion type="single" collapsible>
              {FAQ.map(([q, a]) => <AccordionItem key={q} value={q}><AccordionTrigger className="text-left text-sm">{q}</AccordionTrigger><AccordionContent className="text-sm text-muted-foreground">{a}</AccordionContent></AccordionItem>)}
            </Accordion>
          </Panel>
        </TabsContent>

        <TabsContent value="aviso">
          <Panel title="Aviso legal">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Este manual e as sugestões automáticas da plataforma Privacium têm caráter orientativo e não substituem parecer jurídico.
              A escolha da hipótese de tratamento e a classificação de cada dado são de responsabilidade do controlador e do seu Encarregado.
              As referências seguem a Lei nº 13.709/2018 (LGPD) e as resoluções da ANPD vigentes na data de publicação; confira sempre o texto oficial atualizado.
            </p>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
