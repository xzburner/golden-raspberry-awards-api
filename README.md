# Golden Raspberry Awards API

API RESTful para leitura da lista de indicados e vencedores da categoria **Pior Filme** do Golden Raspberry Awards.
Ao iniciar, a aplicação lê o arquivo CSV de filmes e grava os dados em um banco **SQLite em memória** (módulo nativo `node:sqlite` do próprio Node.js: nenhuma instalação externa nem compilação é necessária).

## Stack

- Node.js 22.13+ e TypeScript
- Express 5
- SQLite em memória (`node:sqlite`, embutido no Node.js)
- `csv-parse` para leitura do CSV
- Vitest + Supertest para os testes de integração

## Pré-requisitos

- **Node.js 22.13 ou superior** (com npm). Testado com Node 22 e 24.

> O Node pode exibir `ExperimentalWarning: SQLite is an experimental feature`. É apenas um aviso do módulo `node:sqlite` e não afeta o funcionamento.

## Como rodar

```bash
git clone https://github.com/xzburner/golden-raspberry-awards-api.git
cd golden-raspberry-awards-api
npm install
npm start
```

A API sobe em `http://localhost:8080` e carrega o arquivo `data/movielist.csv`.

Variáveis de ambiente opcionais:

| Variável             | Padrão                | Descrição                          |
| -------------------- | --------------------- | ---------------------------------- |
| `PORT`               | `8080`                | Porta HTTP                         |
| `MOVIELIST_CSV_PATH` | `data/movielist.csv`  | Caminho do CSV carregado no início |

Exemplo com outro arquivo:

```bash
# Linux/macOS
MOVIELIST_CSV_PATH=/caminho/outro.csv npm start
# Windows (PowerShell)
$env:MOVIELIST_CSV_PATH="C:\caminho\outro.csv"; npm start
```

Para desenvolvimento com recarga automática: `npm run dev`. Para rodar a versão compilada: `npm run build` e depois `npm run start:prod`.

## Como rodar os testes

```bash
npm test
```

São 30 testes, todos de integração, conforme pedido: cada teste sobe a aplicação inteira (CSV → banco em memória → HTTP) e valida as respostas da API.

- `tests/award-intervals.default-dataset.test.ts`: confere o resultado exato com o CSV fornecido na proposta.
- `tests/award-intervals.scenarios.test.ts`: roda outros conjuntos de dados (empates, mesmo produtor em min e max, várias vitórias, linhas fora de ordem, separadores `,` e `and`, nenhum produtor com duas vitórias, CSV vazio, duas vitórias no mesmo ano).
- `tests/api-contract.test.ts`: rota raiz, verbos e códigos HTTP (200, 400, 404, 405) e validação do CSV ao iniciar.

## Endpoints

### `GET /`

Ponto de entrada da API: retorna nome, descrição e links para os recursos disponíveis.

```json
{
  "name": "Golden Raspberry Awards API",
  "description": "Nominees and winners of the Worst Picture category of the Golden Raspberry Awards.",
  "links": {
    "awardIntervals": { "href": "/producers/award-intervals", "method": "GET" },
    "movies": { "href": "/movies{?year,winner}", "method": "GET", "templated": true },
    "movie": { "href": "/movies/{id}", "method": "GET", "templated": true }
  }
}
```

### `GET /producers/award-intervals`

Retorna o produtor com o **maior** intervalo entre dois prêmios consecutivos e o que obteve dois prêmios **mais rápido**. Em caso de empate, todos os empatados são retornados.

```bash
curl http://localhost:8080/producers/award-intervals
# Windows (PowerShell): curl.exe http://localhost:8080/producers/award-intervals
```

Resposta `200 OK` com o CSV fornecido:

```json
{
  "min": [
    { "producer": "Joel Silver", "interval": 1, "previousWin": 1990, "followingWin": 1991 }
  ],
  "max": [
    { "producer": "Matthew Vaughn", "interval": 13, "previousWin": 2002, "followingWin": 2015 }
  ]
}
```

### `GET /movies`

Lista os filmes. Filtros opcionais: `year` (inteiro) e `winner` (`true`/`false`).

```bash
curl "http://localhost:8080/movies?winner=true&year=1990"
```

### `GET /movies/{id}`

Retorna um filme. `404 Not Found` se não existir.

### Códigos de resposta

| Código | Quando                                                    |
| ------ | --------------------------------------------------------- |
| 200    | Consulta realizada                                        |
| 400    | Parâmetro inválido (ex.: `/movies/abc`, `?winner=talvez`) |
| 404    | Recurso ou rota inexistente                               |
| 405    | Verbo não suportado (resposta inclui o header `Allow`)    |

## Regras de negócio

- Só os filmes com `winner = yes` (sem diferenciar maiúsculas/minúsculas) contam como prêmio.
- A coluna `producers` é separada por vírgula e pela palavra `and` (ex.: `A, B and C` → `A`, `B`, `C`). Nomes que contêm "and" no meio (ex.: `Alexandra`) não são quebrados.
- O intervalo é calculado apenas entre prêmios **consecutivos** de um mesmo produtor, independente da ordem das linhas no CSV.
- Se um produtor ganhar dois prêmios no mesmo ano (dois filmes), isso conta como intervalo `0`.
- Se nenhum produtor tiver dois prêmios, a resposta é `{ "min": [], "max": [] }`.
- CSV com ano inválido, título vazio ou coluna obrigatória faltando interrompe a inicialização com uma mensagem de erro indicando a linha.

## Arquitetura

```
src/
├── server.ts              # ponto de entrada (porta, encerramento)
├── application.ts         # monta banco + importação do CSV + HTTP
├── config.ts              # variáveis de ambiente
├── database/connection.ts # SQLite em memória + schema normalizado
├── importer/              # leitura/validação do CSV e carga em transação
├── repositories/          # consultas SQL (filmes e intervalos de produtores)
└── http/                  # app Express, rotas, erros e middlewares
```

O cálculo dos intervalos é feito em uma única consulta SQL com função de janela (`LAG`) sobre os anos de vitória de cada produtor; em seguida são filtrados os intervalos iguais ao mínimo e ao máximo global.

## Uso de IA

O registro das interações com o agente de IA está em [`docs/AI_INTERACTIONS.md`](docs/AI_INTERACTIONS.md).
