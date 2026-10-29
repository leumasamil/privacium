import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { carregarReferencias } from './referenciasExternas.server';

export const consultarReferenciasExternas = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ cnpj: z.string().regex(/^\d{14}$/) }).parse(input))
  .handler(async ({ data, context }) => {
    setResponseHeader('Cache-Control', 'private, no-store');
    // Só confirma acesso por RLS; nunca escreve auditoria de dados de terceiro.
    const { data: empresa, error } = await context.supabase.from('workspace_empresa').select('cnpj').eq('cnpj', data.cnpj).maybeSingle();
    if (error || !empresa) throw new Error('Empresa indisponível para esta consulta.');
    return carregarReferencias(data.cnpj);
  });