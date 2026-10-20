# Registro de interações com IA

Este projeto foi desenvolvido com o **Claude** (Anthropic), modelo `claude-opus-5-5`, atuando como agente intermediário, tirando dúvidas e verificando padrões.

## 1. Prompts do desenvolvedor

| # | Prompt / decisão                                                                                            |
| - | ----------------------------------------------------------------------------------------------------------- |
| #  | Prompt / decisão |
| -- | ---------------- |
| 1  | "Li o PDF do teste. Entendi que preciso de uma API que lê o CSV na inicialização, grava num banco em memória e expõe os intervalos de prêmios dos produtores. Quero usar Node.js + TypeScript. Antes de codar, me diga quais casos de borda você vê no CSV." |
| 2  | “Vamos usar:sqlite que já é embuitido no Node. Quero um schema normalizado: filmes, produtores, estúdios e tabelas de ligação. Me mostre o schema antes de criar.” |
| 3  | “Analise o CSV e me liste os padrões de separação dos produtores.” |
| 4  | “Separe por vírgula e pela palavra ‘and’, sem quebrar nomes como ‘Alexandra’. Se o CSV tiver um ano inválido, quero que a aplicação falhe ao iniciar, indicando a linha.” |
| 5  | “Quero calcular os intervalos direto no SQL. Me explique como funcionaria com função de janela.” |
| 6  | “Em caso de empate, retorne todos. Duas vitórias no mesmo ano contam como intervalo 0.” |
| 7  | “Implemente seguindo o nível 2 de Richardson: GET, códigos 200, 400, 404 e 405.” |
| 8  | “Me liste os cenários que um avaliador poderia testar com outros dados.” |
| 9 | “Revise meus testes e implemente os outros cenários seguindo o mesmo padrão.” |
| 10 | “Revise meu README: está claro como rodar e testar? Falta alguma regra de negócio?” |

## 2. O que o agente fez

1. **Leitura do enunciado**: Analisou o CSV com um script: total de linhas, valores da coluna winner, separadores, aspas, anos e linhas vazias.
2. **Perguntas antes de começar**: pesquisou as opções. Se você deixar, instalo cada uma num projeto de teste no seu PC, para ver se o npm install passa. Não crio nada no projeto ainda.
3. **Escolhas técnicas**:
   - Express 5 + `node:sqlite` (SQLite embutido no Node.js, `:memory:`) + `csv-parse`.
   - Schema normalizado (`movies`, `producers`, `studios` e tabelas de ligação), carga em uma única transação.
   - Cálculo dos intervalos em SQL com `LAG()` (função de janela), retornando todos os empates de mínimo e máximo.
   - Nível 2 de Richardson: recursos (`/movies`, `/movies/{id}`, `/producers/award-intervals`), verbo GET, códigos 200/400/404/405 e header `Allow`.
4. **Verificação independente**: o resultado da API com o CSV fornecido (min: Joel Silver 1990→1991; max: Matthew Vaughn 2002→2015) foi conferido com um script Python separado, que fez o mesmo cálculo sem usar o código do projeto.
5. **Testes de integração** (Vitest + Supertest), 28 casos: dataset da proposta, conjuntos alternativos (empates, mesmo produtor em min e max, ordem das linhas, separadores, vitórias no mesmo ano, sem vencedores repetidos, CSV vazio) e contrato HTTP.
6. **Documentação**: README com instruções de execução e testes, regras de negócio e arquitetura.

## 3. Decisões de regra de negócio tomadas

- **Duas vitórias no mesmo ano** contam como intervalo `0` (são dois prêmios consecutivos).
- **Empates** retornam todos os produtores/intervalos empatados, ordenados por produtor e ano.
- **Linhas fora de ordem** no CSV não afetam o resultado (ordenação feita no SQL).
- **CSV inválido** (ano não numérico, título vazio, coluna faltando) interrompe a inicialização com mensagem indicando a linha, em vez de ignorar dados silenciosamente.

## 4. Revisão humana

O desenvolvedor é responsável pela revisão final do código gerado, com os mesmos critérios de uma revisão de código tradicional.
