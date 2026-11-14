# Histórico de mudanças

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
