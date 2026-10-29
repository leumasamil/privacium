# Privacium

Plataforma de governança de privacidade pelo Método BLLOCO.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://screenshot-snap-replica-93.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5223f7f5-d76b-43ef-b885-09f7baf593fd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Arquivos de ambiente e histórico público

O `.gitignore` gerenciado pelo ambiente está somente leitura e ainda não ignora `.env` e `.env.*`. Essas duas linhas precisam ser acrescentadas no repositório externo. Isso não remove arquivos já rastreados nem versões antigas. A chave publishable é pública por natureza: a proteção dos dados depende de autenticação, permissões e RLS, não de escondê-la.

A remoção de versões antigas exige `git filter-repo` em uma cópia isolada, por exemplo `git filter-repo --path .env --path-glob '.env.*' --invert-paths`. Não execute no projeto conectado: reescrever o histórico publicado pode apagar o histórico do Lovable. Planeje a limpeza e a reconexão antes de qualquer envio forçado. Esta atualização não reescreveu o histórico nem alterou o arquivo de ambiente gerenciado.
