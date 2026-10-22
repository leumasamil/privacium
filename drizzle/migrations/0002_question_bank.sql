create table public.question_bank (
  id int primary key,
  department text not null,
  principle text not null,
  text text not null,
  weight int not null check (weight between 1 and 10)
);
grant select on public.question_bank to authenticated;
grant all on public.question_bank to service_role;
alter table public.question_bank enable row level security;
create policy "members read questions" on public.question_bank for select to authenticated using (public.has_any_role(auth.uid()));
create policy "admin manage questions" on public.question_bank for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

insert into public.question_bank (id, department, principle, text, weight) values
(1, 'RH', 'Especificação da Finalidade', 'Existe finalidade explícita e registrada para a coleta de dados de saúde em prontuários de funcionários?', 8),
(2, 'TI', 'Especificação da Finalidade', 'Os sistemas lógicos isolam e registram as finalidades exclusivas de uso das ferramentas de IA Generativa corporativa?', 10),
(3, 'Marketing', 'Limitação de Dados', 'O formulário de captação de leads em landing pages coleta apenas nome e e-mail, excluindo dados excessivos ou sensíveis?', 7),
(4, 'Recepção', 'Limitação de Dados', 'A ficha física ou digital de entrada predial dispensa a coleta de biometria caso o titular opte por identificação manual?', 9),
(5, 'Jurídico', 'Hipótese de Tratamento', '100% dos processos mapeados no ROT estão associados textualmente aos Artigos 7º ou 11 da LGPD, banindo o termo ''base legal''?', 10),
(6, 'TI', 'Segurança da Informação', 'Todos os endpoints e notebooks corporativos ativos possuem criptografia de volume inteira BitLocker com PIN de inicialização configurado?', 10),
(7, 'TI', 'Segurança da Informação', 'Planilhas de RH e arquivos contendo dados sensíveis estão armazenados dentro de cofres criptografados locais via Cryptomator antes do upload para a nuvem?', 10),
(8, 'Compras', 'Compartilhamento com Terceiros', 'Todos os fornecedores e operadores terceiros assinaram aditivos contratuais CPC baseados nas cláusulas-padrão da Resolução CD/ANPD nº 19/2024?', 9);

insert into public.question_bank (id, department, principle, text, weight)
select
  9 + n,
  (array['RH','TI','Marketing','Compras','Recepção','Jurídico','Financeiro'])[n % 7 + 1],
  (array['Especificação da Finalidade','Limitação de Dados','Hipótese de Tratamento','Segurança da Informação','Retenção e Eliminação','Transparência','Compartilhamento com Terceiros','Responsabilização'])[(n / 35) % 8 + 1],
  replace(
    (array['Existe finalidade documentada para o tratamento de %s?','A coleta de %s se limita ao mínimo necessário?','O tratamento de %s está vinculado a uma hipótese dos artigos 7º ou 11 da LGPD?','Há controle de acesso e criptografia aplicados a %s?','Existe prazo de retenção e rotina de eliminação para %s?','Os titulares são informados de forma clara sobre o uso de %s?','O compartilhamento de %s com terceiros está formalizado em contrato?','Há evidência registrada de conformidade no tratamento de %s?'])[(n / 35) % 8 + 1],
    '%s',
    (array[
      array['currículos de candidatos','dados de saúde ocupacional','folha de pagamento','dependentes de colaboradores','registros de ponto biométrico'],
      array['logs de acesso','backups','contas privilegiadas','ferramentas de IA generativa','estações de trabalho'],
      array['listas de e-mail marketing','cookies do site','leads de landing pages','pesquisas de satisfação','imagens de clientes em campanhas'],
      array['cadastro de fornecedores','contratos com operadores','dados de representantes de fornecedores','due diligence de terceiros','notas de compra'],
      array['fichas de visitantes','imagens de CFTV','crachás de acesso','agenda de visitas','dados de entregadores'],
      array['processos judiciais','atendimento a titulares','contratos com clientes','comunicações à ANPD','pareceres de privacidade'],
      array['dados bancários de clientes','cobrança e inadimplência','notas fiscais','análise de crédito','reembolsos de colaboradores']
    ])[n % 7 + 1][(n / 7) % 5 + 1]
  ),
  ((n * 37) % 10) + 1
from generate_series(0, 157) as n;