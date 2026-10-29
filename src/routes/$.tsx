import { createFileRoute } from '@tanstack/react-router';
import { RotaNaoEncontrada } from '@/components/priva/RotaNaoEncontrada';

export const Route = createFileRoute('/$')({
  head: () => ({ meta: [
    { title: 'Rota não encontrada — Privacium' },
    { name: 'description', content: 'Página não encontrada na plataforma Privacium. Volte ao painel de governança de privacidade.' },
    { property: 'og:title', content: 'Rota não encontrada — Privacium' },
    { property: 'og:description', content: 'Página não encontrada na plataforma Privacium. Volte ao painel de governança de privacidade.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: RotaNaoEncontrada,
});