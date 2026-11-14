# Segurança

## Onde ficam seus dados

Só no navegador do seu aparelho. Nada é enviado para servidor. Isso também significa que limpar os dados do navegador ou perder o celular apaga tudo. Use o botão Backup de vez em quando.

## Como o app se protege

- Política de segurança de conteúdo: só scripts do próprio site, sem scripts embutidos e sem `eval`.
- Todo texto digitado é escapado antes de aparecer na tela.
- Arquivos de backup são validados (formato e tamanho) antes de substituir os dados.
- Fórmulas em planilhas: o CSV exportado neutraliza textos que começam com `=`, `+`, `-` ou `@`.

## Como relatar um problema

Abra uma issue no repositório descrevendo o que aconteceu. Não coloque dados financeiros reais na descrição.
