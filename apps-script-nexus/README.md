# HERING — CONECTA — Passagem de Coleção

Esta é a nova versão corporativa do HERING — CONECTA — Passagem de Coleção.

O projeto React/Supabase atual não é alterado. Ele continua sendo a referência funcional enquanto a migração é feita por etapas.

## Arquitetura do MVP

- Google Apps Script: aplicação e regras do sistema.
- Google Sheets: artigos, coleções, pendências, votos e histórico.
- Google Drive: fotos, vídeos, PDFs e arquivos de texto.
- Conta Google corporativa: identificação de quem está utilizando o sistema.

## Etapas da migração

1. Fundação, acesso corporativo e estrutura dos dados.
2. Cadastro e consulta de artigos.
3. Passagem de Coleção e votação.
4. Mostruário e apontamentos.
5. Radar, resolução e histórico rastreável.
6. Anexos no Drive, QA e piloto.

## Primeira instalação

1. Crie um projeto em `script.google.com` chamado `HERING - CONECTA - Passagem de Coleção`.
2. Copie `Code.gs`, `Index.html` e `appsscript.json` para o projeto.
3. No editor, execute manualmente a função `configurarConecta` uma vez.
4. Autorize o acesso ao Google Sheets e ao Google Drive.
5. Abra **Implantar > Nova implantação > Aplicativo da Web**.
6. Configure a execução e o acesso conforme as regras do domínio da empresa.
7. Abra o endereço terminado em `/exec`.

`configurarConecta` cria uma planilha e uma pasta no Drive e salva seus identificadores nas propriedades do projeto.

