# Histórico de mudanças

## 4.3.0
- Menu do celular: o botão das três barras passou para a esquerda, e o puxador na borda da tela e os gestos de arrastar foram removidos (conflitavam com o botão voltar do Android).
- Cartão de crédito configurável (Categorias): a fatura pode vencer no mesmo mês ou no mês seguinte, com dia de vencimento e dia de fechamento opcional. Compras no crédito entram no mês em que a fatura é paga, e a lista mostra o vencimento e a data da compra.
- Saldos iniciais de investimento e de gastos, além do saldo da conta.
- Botão Reembolso em cada gasto: registra o valor devolvido (por exemplo, o amigo que pagou a metade) como estorno na mesma categoria, sem virar renda.
- Metas de economia, com progresso na Visão Geral e quanto guardar por mês até o prazo.
- Tela do mês em abas no celular (Resumo, Lançamentos, Receitas).
- Gráfico da Visão Geral: ao tocar em um mês, mostra os valores dele.
- Versão 7 dos dados (saldos iniciais, cartão e metas). Os dados antigos migram sozinhos.

## 4.2.0
- Design do celular: barra de navegação inferior (Início, Mês, Fixas, Mais) e seletor de mês no topo da tela do mês, com setas para o anterior e o seguinte.
- Todos os controles do celular com no mínimo 44 px de altura, e fonte nunca abaixo de 12 px.
- Botões em 3 níveis (principal, secundário e perigo), com a mesma altura em todas as telas.
- Cores de botões e valores com contraste mínimo de 4,5:1.
- Novo lançamento: valor grande no topo, categoria e forma de pagamento em botões de escolha, opção "Estorno" e erros de preenchimento ao lado do campo, sem janela.
- Valores com sinal e ícone, além da cor (gasto com menos, estorno com mais, investimento com seta), e números alinhados.
- Visão geral: lista de cartões no celular no lugar da tabela de 7 colunas.
- Ícones em SVG no lugar de emoji.

## 4.1.0
- Testes das telas, correção da tecla Enter em campos de descrição e do comando `npm test`.
- Documentação de arquitetura, política de segurança e histórico de mudanças.

## 4.0.0
- O código foi dividido em módulos (pasta `js`), cada um com uma responsabilidade.
- O HTML não tem mais JavaScript dentro dele. Botões e campos usam atributos `data-` e uma lista fixa de ações permitidas.
- Política de segurança de conteúdo no `index.html`: scripts só do próprio site, sem scripts embutidos e sem `eval`.
- Testes automáticos das regras de conta, da segurança, dos eventos, do armazenamento, das ações e das telas.
- Estorno: valores negativos são aceitos nos lançamentos (não nas parcelas).
- Enter avança de campo e envia nos formulários. O foco volta ao campo de descrição depois de lançar.
- Janelas com foco preso, Esc para fechar, link para pular ao conteúdo e contorno de foco visível.
- Backup validado antes de restaurar, com limite de tamanho e ponto de restauração antes de substituir os dados.
- Atalho "Novo lançamento" no ícone do app no Android.

## 3.4.0
- Pontos de restauração automáticos (um por dia e um antes de cada atualização).
- Aviso de backup mais discreto, com botão Depois.

## 3.3.0
- Menu lateral compacto com puxador, meses agrupados por ano e botão + de lançamento rápido.
- Janelas próprias no lugar do confirm e do alert do navegador, com Desfazer.
- Receita fixa, resumo por forma de pagamento, comparação com o mês anterior e sugestão de categoria.
- Categorias padrão reduzidas a 6, com menu de sugeridas.

## 3.2.0
- Contas fixas, boleto parcelado e saldo e patrimônio contando só até o mês atual.

## 3.1.0
- Forma de pagamento, trimestres pelo calendário e novas categorias.

## 3.0.0
- Projeto dividido em HTML, CSS e JS, com dinheiro em centavos, IndexedDB, versão dos dados, app instalável e modo escuro.
