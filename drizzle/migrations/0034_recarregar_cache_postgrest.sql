-- Recarrega o cache de esquema do PostgREST para que os GRANTs em nível de coluna da migração 0033 tenham efeito imediato.
NOTIFY pgrst, 'reload schema';