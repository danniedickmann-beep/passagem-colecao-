# Configuração e publicação

## Aplicação

Esta versão é uma aplicação React construída com Vite. O arquivo `index.html` é somente a entrada; a aplicação está em `src/`.

```bash
npm ci
npm run dev
npm run build
```

Sem variáveis do Supabase, a aplicação entra em modo local e persiste dados no navegador.

## Supabase

1. Execute `supabase/schema.sql` no SQL Editor.
2. Copie `.env.example` para `.env`.
3. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Nunca use a chave `service_role` no site ou no GitHub Pages.

O bucket listado em `.env.example` foi preservado como referência, mas a versão React atual ainda não envia arquivos ao Storage.

### Segurança

O nome informado na tela inicial não é autenticação. O SQL fornecido permite leitura, inserção e atualização pela chave pública para preservar o funcionamento do MVP. Publique somente em ambiente controlado. Para exposição pública, implemente Supabase Auth e substitua as políticas antes do lançamento.

## GitHub Pages

O workflow `.github/workflows/deploy-pages.yml` constrói e publica a pasta `dist` a cada push na branch `main`.

No repositório GitHub:

1. configure Pages com a fonte **GitHub Actions**;
2. crie os secrets `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`;
3. opcionalmente crie a variável `VITE_SUPABASE_BUCKET` com `passagem-colecao`;
4. execute manualmente o workflow ou faça push na `main`.

O arquivo `vite.config.js` usa caminhos relativos, compatíveis com o subdiretório padrão do GitHub Pages.

## Versão anterior

`index-legacy.html` foi mantido somente como referência de migração. Ele não é publicado pelo build Vite e contém um schema antigo com políticas públicas; não use suas instruções de configuração.
