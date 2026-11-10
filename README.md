# DescartaFacens

Protótipo acadêmico de reciclagem com recompensas. HTML, CSS e JavaScript no front-end; uma API pequena em Node.js conecta as telas ao PostgreSQL. Sem autenticação: escolha um participante no topo da página.

## Objetivo e escopo

Incentivar o descarte correto de resíduos por meio de pontos e recompensas. Projeto desenvolvido para a disciplina de Projetos da Facens, com foco em banco de dados e prototipação funcional.

## Equipe

Henrique, Pedro, Matheus, Murilo, Renato e Gabriel.

## Tecnologias

- HTML e CSS: estrutura e layout responsivo.
- JavaScript: interação e comunicação com a API.
- Node.js e pg: servidor e acesso ao PostgreSQL.
- PostgreSQL: armazenamento de usuários, materiais, pontos de coleta, descartes, parceiros, recompensas e resgates.

## Como executar no Windows

Requisitos: Node.js 22 ou superior e PostgreSQL iniciado.

1. No pgAdmin, crie um banco chamado `descarta_facens`. Se já importou seu SQL em outro banco, use o nome dele no passo seguinte.
2. No terminal do VS Code, dentro da pasta do projeto, execute:

```powershell
Copy-Item .env.example .env
npm.cmd install
```

3. Abra `.env` e preencha `PGPASSWORD` com sua senha local do PostgreSQL. Ajuste usuário, porta e nome do banco se necessário. Não precisa enviar sua senha pelo chat.
4. **Somente se o banco estiver vazio**, crie as sete tabelas e os dados fornecidos:

```powershell
npm.cmd run db:init
```

Alternativa: execute `database/bancoDescartaFacens.sql` no Query Tool do pgAdmin. Não execute novamente se já importou essas tabelas. O script `db:init` verifica a tabela usuario antes de importar e não apaga dados existentes.

5. Inicie a aplicação:

```powershell
npm.cmd start
```

6. Acesse http://localhost:8080. Para encerrar, use Ctrl+C no terminal.

## Telas

- Visão geral: saldo, peso reciclado, total de descartes e últimas atividades.
- Registrar descarte: material, peso, ponto de coleta e previsão dos pontos.
- Pontos de coleta: endereço, horário e link para localização no Google Maps.
- Recompensas: parceiro, custo, estoque e confirmação do resgate.
- Histórico: descartes e resgates, com data e horário.

## Regras e relação com o banco

O SQL original foi preservado, incluindo suas sete tabelas e dados de exemplo. O saldo existente é o saldo inicial do protótipo; não é recalculado na inicialização. Os dados fornecidos têm saldos que nem sempre correspondem à soma do histórico, em especial Pedro. Isso não impede novas operações, mas deve ser considerado na apresentação.

Cada novo descarte soma `FLOOR(quantidade_kg * pontos_kg)` ao saldo do participante. Como saldo_pontos é INTEGER, frações de ponto são descartadas. O peso aceita duas casas decimais, entre 0,01 e 10.000 kg. Data e horário são registrados automaticamente pelo PostgreSQL, conforme o fuso da sessão do banco/servidor.

Não foi adicionada uma coluna de pontos ao descarte. Assim, o histórico mostra o cálculo com a taxa atual do material; alterar pontos_kg posteriormente muda esse cálculo exibido, mas não recalcula o saldo já creditado.

Um resgate desconta pontos, diminui o estoque e registra a troca. A API verifica participante, parceiro ativo, validade, saldo e estoque. Usa transações e bloqueio de registros para evitar gastos simultâneos acima do saldo ou estoque. As consultas recebem parâmetros, sem interpolar dados do formulário no SQL.

O front-end não acessa o banco diretamente: navegador → API local → PostgreSQL. A senha fica somente no `.env` do servidor. Sem login por solicitação do projeto, a API fica vinculada a `127.0.0.1`, destinada à apresentação local.

Endereços, parceiros e recompensas do banco inicial são exemplos fictícios. O mapa abre uma página externa; não há integração com balanças, QR code ou validação física da entrega. As fontes do Google são opcionais, com fontes locais de fallback.

## Roteiro de apresentação e validação

1. Selecione Lucas e confira o saldo inicial de 200 pontos.
2. Registre 1,50 kg de Metal em um ponto de coleta: devem ser creditados 225 pontos e o saldo deve subir para 425.
3. Confira o novo registro no histórico, com peso, material e data/hora.
4. Resgate o desconto de 10% por 200 pontos: saldo esperado de 225 e estoque reduzido de 50 para 49, considerando o banco inicial intacto.
5. Atualize a página: o saldo e o histórico devem permanecer salvos no PostgreSQL.
6. Tente resgatar o café de 500 pontos: o botão informa quantos pontos faltam.
7. Troque o participante para verificar históricos individuais.

## Estrutura

```
public/index.html                Estrutura das telas
public/style.css                 Estilos e layout responsivo
public/app.js                    Navegação, formulários e chamadas à API
server.js                        API e servidor dos arquivos do front-end
database/bancoDescartaFacens.sql  SQL original com dados de exemplo
scripts/init-db.js               Importação segura em banco vazio
.env.example                     Modelo de conexão
```

## Verificação

Para conferir a sintaxe, execute `node --check server.js` e `node --check public/app.js`. Para validar a integração com PostgreSQL, siga o roteiro de apresentação acima e confira os registros no banco após atualizar a página.
