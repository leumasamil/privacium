import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RotaNaoEncontrada() {
  return <main className="flex min-h-screen items-center justify-center bg-background p-6">
    <div className="max-w-md text-center">
      <p className="font-mono text-7xl font-bold text-muted-foreground">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-foreground">Rota não encontrada</h1>
      <p className="mt-2 text-muted-foreground">Esta página não existe na plataforma Privacium.</p>
      <Button asChild className="mt-6"><Link to="/painel"><ArrowLeft className="h-4 w-4" /> Voltar ao painel</Link></Button>
    </div>
  </main>;
}