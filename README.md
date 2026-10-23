# Todo dIA

Controle de gastos do dia a dia: lançamento rápido por frase ("açougue 87,50 inter ontem"), previsão das faturas de cartão, gastos fixos, divisão de despesas com a família e relatórios interativos.

## Quando um gasto conta

- **À vista** (cartão, Pix, débito, boleto): no dia da compra.
- **Parcelado no cartão:** cada parcela é gasto do mês da fatura que a cobra e já conta desde o dia 1º desse mês.
- **Fixos** (contratos com o mesmo valor todo mês): contam desde o dia 1º de cada mês; no cartão, o dia da cobrança define a fatura.
- **Espólio:** uma marcação no lançamento que separa esses custos nos relatórios. Não divide nada sozinha.

**App:** https://tulioreiscbm-prog.github.io/todo-dia

## Onde ficam os dados

- **Este repositório só tem o programa.** Nenhum número, nome ou lançamento fica aqui.
- **Os dados ficam numa planilha Google do dono**, que só o próprio dono enxerga.
- O app conversa com a planilha por um pequeno programa (Google Apps Script) que roda dentro dela e só responde a quem tiver a **chave secreta**.
- O celular guarda uma cópia para abrir rápido e funcionar sem internet. As alterações vão para a planilha assim que houver conexão.

## Instalação (uma vez só)

### 1. Programa da planilha
1. Crie (ou abra) a planilha **"Todo dIA"** no Google Drive.
2. Menu **Extensões › Apps Script**.
3. Apague o que estiver no arquivo `Código.gs` e cole todo o conteúdo de [`apps-script/Codigo.gs`](apps-script/Codigo.gs). Se tiver um arquivo de dados iniciais particular (`Semente.gs`), crie um segundo arquivo com o **+ › Script** e cole-o lá.
4. Clique em **Salvar** (ícone de disquete).
5. No seletor de funções, escolha **`instalar`** e clique em **Executar**. Autorize o acesso quando o Google pedir. Se aparecer "O Google não verificou este app", clique em **Avançado › Acessar Todo dIA (não seguro)**: o app é seu, ninguém mais tem acesso.
6. Clique em **Implantar › Nova implantação**. Em tipo, escolha **App da Web**. Em "Executar como", escolha **Eu**. Em "Quem pode acessar", escolha **Qualquer pessoa**. Clique em **Implantar**.
7. Copie o **URL do app da Web**: ele termina em `/exec`.
8. Volte à planilha: a aba **Leia-me** mostra a **chave**.

### 2. App no celular (Android)
1. Abra **https://tulioreiscbm-prog.github.io/todo-dia** no Chrome.
2. Cole o endereço `/exec` e a chave. Toque em **Conectar**.
3. Menu **⋮ › Instalar app** (ou "Adicionar à tela inicial"). Pronto: o ícone abre em tela cheia.
4. Dica: segure o dedo sobre o ícone para o atalho **"Novo lançamento"**.

## Segurança

- Perdeu o celular? Na planilha, menu **Todo dIA › Trocar chave**. O aparelho antigo perde o acesso na hora.
- Backup automático: todo domingo às 3h, uma cópia da planilha vai para a pasta **Backups**, ao lado dela (as 12 mais recentes ficam guardadas).

## Atualizar o programa da planilha

Quando o `Codigo.gs` mudar, cole a versão nova no Apps Script e vá em **Implantar › Gerenciar implantações › editar (lápis) › Versão: Nova versão › Implantar**. O endereço `/exec` continua o mesmo.

## Para quem for mexer no código

- `src/engine.js`: regras puras (datas, faturas, parcelas, fixos, divisão, médias), com testes em `test/engine.test.js` e `test/gas.test.js` (`node --test test/engine.test.js test/gas.test.js`).
- `src/taxonomy.js`: categorias e dicionário genéricos. Dados pessoais ficam só na planilha.
- `src/app.js` e `src/app.css`: telas e gráficos.
- `apps-script/Codigo.gs`: API da planilha. `test/gas-sim.js` simula o Google para testar localmente.
- `python3 build.py` gera o `index.html`. `python3 test/e2e.py` roda o teste ponta a ponta num celular simulado.
