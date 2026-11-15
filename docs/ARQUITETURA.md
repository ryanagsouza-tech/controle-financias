# Arquitetura

O app roda inteiro no navegador. Não há servidor. Os dados ficam no IndexedDB do aparelho.

## Camadas

Cada módulo só importa de camadas abaixo dele. Isso evita dependências circulares.

```
constantes  <  util  <  estado  <  dados  <  calculos  <  armazenamento
            <  tema  <  ui  <  views  <  render  <  acoes  <  eventos / mapa  <  main
```

| Módulo | Pode usar o navegador? | O que faz |
|---|---|---|
| `constantes`, `util`, `dados`, `calculos` | Não | Regras puras. São as mais testadas |
| `armazenamento` | IndexedDB | Grava, lê e guarda pontos de restauração |
| `views` | Não | Devolve texto HTML, nunca mexe no DOM |
| `render`, `ui`, `acoes`, `main` | Sim | Desenham, abrem janelas e reagem a toques |

## Fluxo de um toque

1. A tela traz `data-click="adicionarLanc"` (gerado por `ev()` em `util.js`).
2. `eventos.js` lê o atributo e procura `adicionarLanc` no mapa de `mapa.js`.
3. Se a ação existe, ela roda e altera `S.estado`.
4. A ação chama `salvar()`, que redesenha a tela e grava no IndexedDB.

## Segurança

- Todo texto do usuário passa por `esc()` antes de entrar no HTML.
- Não há `onclick` nem `style=` com valor dinâmico. Cores e larguras vêm em `data-bg`, `data-cor` e `data-larg`, e `ui.js` as aplica depois de conferir o formato.
- A política de segurança do `index.html` bloqueia qualquer script embutido.
- Os testes em `tests/seguranca.test.mjs` falham se alguém voltar a colocar JavaScript no HTML.

## Formato dos dados

`VERSAO_DADOS` (em `constantes.js`) marca a versão. `migrar()` aceita qualquer versão antiga. Para criar a versão seguinte, aumente o número e trate a mudança em `normalizar()`.

## Padrões de interface

- Botões usam `btn` com `btn-primario`, `btn-secundario` ou `btn-perigo` (e `btn-icone` para só ícone). As cores e o tamanho ficam em `src/input.css`, e o teste `tests/design.test.mjs` impede que botões fora do padrão apareçam.
- O alvo de toque mínimo é 44 px no celular (variável `--alvo`). A fonte mínima é 12 px.
- Escolhas curtas (categoria, forma de pagamento) usam `chipsRadio()`, que gera radios escondidos com rótulos em forma de botão.
- Erros de preenchimento aparecem ao lado do campo (`mostrarErro`). Janelas ficam para confirmações.
- As cores de texto passam no contraste de 4,5:1, e o teste confere o par de cada uma.
