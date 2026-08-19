# Modernização visual — Nexus

## Escopo

Atualização exclusivamente visual da aplicação **Nexus — Passagem de Coleção Digital**. O fluxo, as regras de negócio, as permissões, os campos, as validações, os dados, as integrações e as ações existentes foram preservados.

## Direção aplicada

- azul-marinho profundo com grade geométrica discreta;
- superfícies em camadas de azul escuro;
- acentos controlados em azul, ciano e turquesa;
- tipografia `Space Grotesk` para hierarquia e `Inter` para operação;
- cards compactos, bordas finas, sombras suaves e alto contraste;
- estados semânticos de sucesso, atenção e erro preservados;
- símbolo Nexus vetorial próprio, formado por pontos conectados em “N”.

## Arquivos visuais

- `src/styles.css`: tokens, tema global, componentes, responsividade e acessibilidade;
- `src/components/NexusMark.jsx`: marca vetorial reutilizável;
- `src/components/Layout.jsx`: aplicação da identidade no cabeçalho e na navegação;
- `src/components/Login.jsx`: aplicação da identidade na entrada do sistema;
- `index.html`: título, cor do navegador e famílias tipográficas.

## Verificações

- build de produção executado com sucesso;
- todas as seis áreas existentes abertas pela navegação;
- revisão visual em desktop e celular;
- labels dos campos e foco visível preservados;
- estados `hover`, `focus`, `active`, `disabled` e `prefers-reduced-motion` contemplados;
- nenhum script de lint ou testes automatizados está configurado no `package.json` atual.

## Observação de ambiente

O Supabase utilizado localmente ainda precisa ter a tabela `pendencias` criada conforme `supabase/schema.sql`. Essa condição é anterior e independente da modernização visual.
