import { createFileRoute } from '@tanstack/react-router';
import { SolicitacoesTitular } from '@/components/priva/views/SolicitacoesTitular';
export const Route = createFileRoute('/_authenticated/solicitacoes-titular')({
  head: () => ({ meta: [
    { title: 'Solicitações de titulares — Privacium' },
    { name: 'description', content: 'Atendimento aos direitos do titular com localização protegida, prazos diferenciados e trilha auditada.' },
    { property: 'og:title', content: 'Solicitações de titulares — Privacium' },
    { property: 'og:description', content: 'Atendimento aos direitos do titular com localização protegida, prazos diferenciados e trilha auditada.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }), component: SolicitacoesTitular,
});