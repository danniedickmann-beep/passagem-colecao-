# Mapeamento para inclusão do user flow

Data do levantamento: 05/08/2026

> Referência da versão React: a entrada é `index.html`, os fluxos ficam em `src/config/flow.js`, a persistência em `src/services/repository.js` e a interface em `src/components/`. As menções abaixo a blocos e funções do antigo `index.html` descrevem somente `index-legacy.html`.

## Limite da fonte recebida

O texto fornecido define as regras de interpretação do novo fluxo, mas não contém o fluxograma oficial com os nomes das ações, perguntas dos losangos, saídas, retornos e encerramentos. Por isso, este levantamento não atribui comportamentos às ramificações ainda não recebidas.

Para implementar as regras específicas, é necessário anexar o fluxograma mais recente em imagem ou PDF legível.

## Mapeamento da implementação atual

| Elemento do fluxo | Implementação atual | Alteração necessária | Arquivos afetados | Mudança no banco |
|---|---|---|---|---|
| Entrada no sistema | Modal solicita apenas o nome operacional e inicia o app | Manter; completar validações somente se o fluxograma indicar outras condições | `index.html` | A confirmar |
| Validação inicial | Cadastro valida somente o campo Artigo; os demais erros são mostrados por toast | Preservar campos válidos, mostrar erro junto ao campo e impedir registros parciais/duplicados conforme as regras oficiais | `index.html` | Provável índice/regra de unicidade, a confirmar |
| Tela central operacional | A listagem de cards, filtros e pipeline concentra as peças, mas não oferece seleção explícita de ramificações | Evoluir a área central para mostrar fluxos disponíveis, em andamento, bloqueados e concluídos por peça, sem confundi-la com o dashboard | `index.html` | Sim, para estado por fluxo/eventos |
| Visão resumida do andamento | Pipeline fixo `Cadastro → Em análise → Passagem → Mostruário → Pós-mostruário` | Manter apenas como filtro/resumo; retirar seu papel de motor do fluxo | `index.html` | Não diretamente |
| Direcionamento da peça | `NEXT_STATUS` força um próximo status único e `mudarStatus` aceita saltos pelo stepper | Substituir por transições permitidas e decisões derivadas do fluxograma oficial | `index.html` | Sim |
| Decisão | Não existe entidade de decisão; status pode ser alterado diretamente | Criar pergunta, opções oficiais, resultado persistido, autoria/data e destino | `index.html` | Sim |
| Retorno/reprocessamento | Reabre sempre para análise, com motivo; dados anteriores são mantidos | Generalizar o retorno para o ponto indicado no fluxo e registrar ocorrência/versão sem apagar histórico | `index.html` | Sim |
| Encerramentos | Há um único status `encerrado` | Diferenciar encerramento de ação, análise, apresentação, acompanhamento, ramificação e peça | `index.html` | Sim |
| Envio de dados entre fluxos | Todos os módulos usam a mesma peça e tabelas relacionadas; não há registro explícito de origem/destino | Manter referências compartilhadas e registrar origem, destino e versão dos dados enviados | `index.html` | Sim |
| Cadastro/preparação | Já contém artigo, matéria-prima, coleção, linha, categoria, Nova/Repeat, desenho, passagem, complexidade e lacre | Reutilizar. Conferir no fluxograma a indicação de mostruário/sem mostruário e demais campos ausentes | `index.html` | Possivelmente |
| Peça Repeat | Vincula peça de origem e herda passagem/desenho quando vazios | Permitir revisar dados herdados e visualizar histórico anterior separado do contexto atual | `index.html` | Possivelmente |
| Passagem/apresentação | Aba de passagem, comentários e modo telão usam a mesma peça | Acrescentar decisões, pontos de atenção, encaminhamento e retorno previstos no fluxo oficial | `index.html` | Sim |
| Mostruário/acompanhamento | Pendências, observações e apontamentos existem; responsáveis gerais existem | Incluir oficina/inspetor no contexto correto, ocorrências, uploads e decisões oficiais | `index.html` | Sim |
| Pós-mostruário | Feedback de qualidade, corte, costura, acabamento, ressalvas, ocorrências e ajustes | Conectar entradas anteriores e implementar retornos/encerramento da ramificação | `index.html` | Sim |
| Estado operacional | Um único `fluxo_atual` e saúde operacional calculada | Derivar estado por eventos e por ramificação, preservando compatibilidade com filtros atuais | `index.html` | Sim |
| Histórico orientado a eventos | `historico_peca` registra tipo, descrição, usuário, extras e data | Expandir os extras estruturados com fluxo, etapa, decisão, resultado, origem/destino, antes/depois e motivo | `index.html` | Sim, incremental |
| Dashboard | Consolida o `fluxo_atual`, saúde, pendências, lacre e complexidade | Alimentar indicadores pelos eventos do novo fluxo, mantendo drill-down para as peças | `index.html` | Sim |

## Pontos de integração no código

- Interface central e pipeline: bloco `#pipelineEl`, listagem `#grid` e navegação lateral.
- Modelo atual do fluxo: `STATUS_LABELS`, `NEXT_STATUS`, `NEXT_LABEL` e `STATUS_ORDER`.
- Abertura da peça: `abrirWs`, `renderHero`, `renderNextAction` e `renderVisao`.
- Transições: `mudarStatus` e `reabrirPeca`.
- Persistência: `pecas.fluxo_atual`, `historico_peca` e as tabelas relacionadas.
- Passagem: `renderPassagem`, `salvarPassagem` e modo telão.

## Implementação realizada nesta versão

- Central operacional adicionada, com seleção da peça e cinco fluxos relacionados.
- Pipeline existente preservado apenas como visão resumida e filtro.
- Avanço automático substituído por decisões explícitas dentro do workspace.
- Retornos exigem motivo e preservam os registros anteriores.
- Decisões registram pergunta, resposta, destino, usuário e contexto no histórico.
- Schema incremental criado para `fluxo_execucoes` e `fluxo_decisoes`.
- Stepper da visão geral deixou de permitir saltos diretos de status.

## Próximas evoluções

Após receber o fluxograma oficial:

1. transcrever os nós, decisões, saídas e retornos sem alterar nomes;
2. validar a transcrição antes de codificar pontos ambíguos;
3. revisar os rótulos das decisões com as áreas responsáveis;
4. detalhar oficina, inspetor e ocorrências na ramificação de mostruário;
5. alimentar os indicadores do dashboard diretamente por `fluxo_decisoes` e `fluxo_execucoes`.
