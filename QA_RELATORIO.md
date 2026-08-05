# Relatório de QA — versão 2.0.0

Data: 05/08/2026

## Resultado

O build de produção foi gerado com sucesso. A aplicação está preparada tecnicamente para GitHub Pages e para conectar ao Supabase por variáveis de ambiente.

## Validado

- entrada Vite em `index.html` e aplicação React em `src/`;
- build de produção com 80 módulos transformados;
- referências de CSS e JavaScript relativas no `dist/index.html`;
- funcionamento previsto em modo local sem variáveis do Supabase;
- cadastro, atualização, histórico e decisões revisados no código;
- proteção contra cliques duplicados durante gravações;
- tratamento de erro na gravação da passagem;
- fluxo de Ajustes com encaminhamento e encerramento;
- schema mínimo coerente com as consultas da aplicação;
- `.env`, dependências e artefatos de build ignorados pelo Git;
- workflow de GitHub Pages preparado;
- nenhuma credencial real encontrada no código da nova aplicação.

## Correções realizadas durante o QA

- adicionada configuração de assets compatível com subdiretórios do GitHub Pages;
- corrigido o fluxo que ficava sem saída ao chegar em Ajustes;
- impedidas atualizações locais de peças inexistentes;
- adicionados estados de salvamento e mensagens de falha;
- removida a indicação incorreta de “IA ativa”;
- atualizada a documentação antiga de configuração;
- separado o schema atual das instruções legadas.

## Bloqueios antes de publicação pública

1. **Autenticação:** a tela inicial registra apenas um nome. Ela não confirma a identidade da pessoa.
2. **RLS pública:** para o MVP funcionar sem autenticação, o schema permite leitura e escrita com a chave anônima. Isso deve ser usado somente em ambiente controlado.
3. **Supabase validado de ponta a ponta:** conexão, estrutura, leitura, inserção de peça, inserção de histórico, atualização, exclusão e cascata foram testadas. A peça e o evento temporários foram removidos; a verificação final retornou zero registros de QA.

A política temporária `qa_exclusao_pecas`, usada exclusivamente para a limpeza do teste, foi removida após a validação.
4. **Fluxograma oficial:** o documento recebido informa que o fluxograma definitivo ainda não foi anexado; as decisões atuais precisam de validação das áreas responsáveis.
5. **Transação:** a atualização da peça e a gravação do evento são duas operações. Uma função transacional no Supabase é recomendada para evitar divergência em falhas raras entre as duas chamadas.

## Recomendação de liberação

- **Ambiente interno controlado:** pode seguir para homologação após configurar e testar o Supabase real.
- **Internet aberta:** não publicar antes de implementar Supabase Auth e políticas RLS por usuário/equipe.
