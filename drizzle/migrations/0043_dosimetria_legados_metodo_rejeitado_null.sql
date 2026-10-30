-- CRITÉRIO DE IDENTIFICAÇÃO (Tarefa A.2):
-- O único gravador de ciclos_priva.reducao_dosimetria foi o simulador do Bloco 5 com o método
-- rejeitado (pesos 20/20/20/15, teto 75%). Desde a migração 0042 o fechamento grava NULL e não
-- existe nenhum método verificado de cálculo. Logo, TODO valor não nulo — qualquer que seja
-- (0, 48 ou outro) — foi produzido pelo método rejeitado e é convertido para NULL ("não calculado").
UPDATE public.ciclos_priva SET reducao_dosimetria = NULL WHERE reducao_dosimetria IS NOT NULL;

-- Trava: nenhum percentual pode ser gravado enquanto não houver método verificado (art. 13 da Res. CD/ANPD nº 4/2023).
ALTER TABLE public.ciclos_priva
  ADD CONSTRAINT ciclos_priva_dosimetria_nao_calculada CHECK (reducao_dosimetria IS NULL);

COMMENT ON COLUMN public.ciclos_priva.reducao_dosimetria IS
  'NULL = não calculado. Valores do método rejeitado (20/20/20/15, teto 75%) convertidos para NULL; CHECK impede novos percentuais até haver método verificado.';