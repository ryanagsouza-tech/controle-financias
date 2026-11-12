# Controle Financeiro

Controle financeiro pessoal que roda no navegador do celular ou do computador. Os dados ficam guardados só no seu aparelho, sem conta, sem servidor e sem rastreadores.

**Abrir o app:** https://ryanagsouza-tech.github.io/controle-financias/

## O que ele faz

- Receitas separadas por mês (salário, extra, 13º) e lançamentos de gastos e investimentos.
- Categorias editáveis, com cor, tipo (gasto ou investimento) e limite mensal. Já vem com 6 categorias essenciais e um menu de categorias sugeridas para adicionar com um toque. A barra avisa quando você chega perto do limite e quando passa dele.
- Contas fixas e receitas fixas (aluguel, internet, salário) cadastradas uma vez, que entram sozinhas em todos os meses a partir do mês de início.
- Lançamento rápido pelo botão +, com sugestão de categoria e forma de pagamento pela descrição.
- Desfazer a última exclusão, pontos de restauração automáticos (um por dia e um antes de cada atualização) e resumo por forma de pagamento (inclui o total do crédito do mês).
- Comparação de cada categoria com o mês anterior.
- Menu lateral compacto, com meses agrupados por ano e um puxador para abrir e fechar no celular.
- Saldo inicial e saldo acumulado, seguindo a ordem cronológica dos meses.
- Forma de pagamento em cada lançamento (débito, crédito, Pix, dinheiro ou boleto). No crédito e no boleto você informa as parcelas, e os meses seguintes são criados automaticamente.
- Trimestres do calendário (janeiro a março é o 1º), calculados automaticamente a partir do mês.
- Visão geral com gráfico de evolução mensal e gastos por categoria.
- Busca, filtro por categoria e ordenação dos lançamentos. Edição de qualquer lançamento.
- Exportação em CSV (abre no Excel em português) e backup em JSON.
- Tema claro, escuro ou automático, e funcionamento sem internet depois do primeiro acesso.

## Privacidade

Os dados são gravados no IndexedDB do próprio navegador. Nada é enviado para nenhum servidor. Isso também significa que:

- limpar os dados do navegador ou perder o celular apaga tudo, então use o botão **Backup** de vez em quando (o app só avisa depois de 90 dias, e você pode adiar). Os pontos de restauração automáticos ficam no mesmo aparelho, então protegem de erros e atualizações, não dessa perda;
- os dados de um aparelho não aparecem em outro, a não ser que você use Backup e Restaurar.

## Instalar no Android

1. Abra o link do app no Chrome.
2. Toque nos três pontinhos e escolha **Adicionar à tela inicial** ou **Instalar app**.

## Estrutura dos arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | Estrutura da página e das janelas (adicionar mês, editar lançamento) |
| `style.css` | Estilos. É gerado pelo Tailwind a partir de `src/input.css` |
| `app.js` | Toda a lógica: dados, cálculos, telas e armazenamento |
| `manifest.webmanifest` | Nome, cores e ícones para instalar como app |
| `sw.js` | Guarda os arquivos para abrir sem internet |
| `icons/` | Ícones do app |
| `src/input.css` | Seus ajustes de CSS e o tema escuro |

## Desenvolvimento

Para editar `index.html` ou `app.js` basta abrir a pasta no VS Code e usar uma extensão de servidor local, como o Live Server. O service worker só funciona em `https` ou em `localhost`, e não abrindo o arquivo direto do disco.

Se você usar uma classe nova do Tailwind no HTML ou no JavaScript, gere o CSS de novo:

```
npm install
npm run css
```

O comando `npm run css:watch` regenera o `style.css` sempre que você salva um arquivo.

## Como os dados são guardados

- Todos os valores em dinheiro são números inteiros de centavos, o que evita erros de arredondamento.
- Os dados têm um número de versão (`VERSAO_DADOS` no `app.js`). Backups e dados de versões antigas são convertidos automaticamente ao abrir.
- Para mudar o formato no futuro, aumente `VERSAO_DADOS` e trate a mudança dentro da função `normalizar`.

## Publicar no GitHub Pages

Envie todos os arquivos (incluindo as pastas `icons` e `src`) para a branch `main`, ligue o Pages em Settings, Pages, Deploy from a branch, e abra o endereço `github.io` do repositório.

## Aviso

Este projeto é uma ferramenta de organização pessoal e não é aconselhamento financeiro. Faça backup dos seus dados.

## Licença

MIT. Veja o arquivo `LICENSE`.
