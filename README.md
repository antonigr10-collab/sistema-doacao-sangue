# SalveVidas

## Nome do projeto
SalveVidas - Plataforma web para conexão entre doadores de sangue, receptores e gestão de campanhas de doação.

## Descrição do projeto
O SalveVidas é uma aplicação web desenvolvida para facilitar o cadastro de doadores, a divulgação de pedidos de doação, a visualização de informações públicas e o gerenciamento administrativo do sistema. A plataforma foi pensada para oferecer uma experiência simples, acessível e responsiva, com foco em rapidez, segurança e usabilidade.

## Tecnologias utilizadas
- HTML5
- CSS3
- JavaScript Vanilla
- Supabase
- Cypress

## Arquitetura do projeto
O sistema segue a arquitetura MVC (Model-View-Controller), organizada da seguinte forma:

- Model: responsável pelas regras de negócio e pela comunicação com o banco de dados.
- View: responsável pela interface e pela interação com o usuário no navegador.
- Controller: responsável pelo fluxo entre a View e o Model, processando eventos e dados.

A aplicação também implementa um fluxo CRUD completo, permitindo:
- Criar novos cadastros de doadores e pedidos;
- Ler informações cadastradas e exibidas nas páginas;
- Atualizar dados de perfil, disponibilidade e alertas;
- Deletar registros quando necessário.

## Estrutura principal do projeto
- [index.html](index.html) — página inicial do projeto
- [cadastro.html](cadastro.html) — formulário de cadastro de doadores
- [login.html](login.html) — autenticação de usuários
- [painel.html](painel.html) — painel administrativo
- [mural.html](mural.html) — mural público com informações de doação
- [css/](css/) — arquivos de estilo
- [js/controllers/](js/controllers/) — controladores da aplicação
- [js/models/](js/models/) — modelos e regras de negócio
- [js/views/](js/views/) — lógica de interface e manipulação do DOM
- [comandos_banco.sql](comandos_banco.sql) — estrutura inicial do banco de dados

## Funcionalidades principais
- Cadastro de doadores
- Login de usuários
- Visualização do mural público
- Painel administrativo
- Gestão de disponibilidade para doação
- Cadastro e controle de pedidos e alertas críticos
- Integração com Supabase para persistência dos dados
- Painel visual de estoque sanguíneo do dia na página inicial
- Calculadora de próxima doação por intervalo, executada 100% no cliente
- Integração com a API do WhatsApp para compartilhamento de chamados urgentes no Mural Público
- Interface responsiva e amigável para celulares e tablets
- Práticas de acessibilidade e contraste adequados, alinhadas ao checklist do CEDUP

## Como rodar o projeto localmente
Siga os passos abaixo para executar o projeto na sua máquina:

1. Clone o repositório para a sua máquina:
   ```bash
   git clone <url-do-repositorio>
   cd sistema-doacao-sangue
   ```

2. Crie um arquivo de ambiente com as credenciais do Supabase:
   ```bash
   .env
   ```

3. Adicione as variáveis abaixo no arquivo .env:
   ```env
   SUPABASE_URL=sua_url_do_supabase
   SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```

4. Garanta que o arquivo .env esteja listado no .gitignore para não ser enviado ao repositório.

5. Crie ou atualize as tabelas do banco de dados no Supabase usando o conteúdo do arquivo [comandos_banco.sql](comandos_banco.sql).

6. Execute o projeto localmente utilizando um servidor simples, por exemplo:
   ```bash
   python -m http.server 8000
   ```

7. Abra o navegador e acesse:
   ```text
   http://localhost:8000
   ```

## Testes E2E com Cypress
O projeto também contempla a estrutura para testes end-to-end com Cypress, com foco em validar fluxos reais do usuário no navegador.

### Instalação do Cypress
```bash
npm init -y
npm install --save-dev cypress
```

### Executar os testes
```bash
npx cypress open
```

### Exemplo de cenário previsto
- Preencher formulário de cadastro
- Clicar em salvar
- Validar que o novo cadastro aparece na interface
- Testar fluxo de login e navegação entre páginas

## Divisão de papéis do grupo
- Aluno 1: Front-End / Git Master
- Aluno 2: UI Designer / Front-End
- Aluno 3: Developer / Integrador

## Boas práticas aplicadas
- Código organizado em MVC
- Separação entre lógica de negócio, interface e controle de fluxo
- Uso de variáveis de ambiente para proteção de credenciais
- Estrutura preparada para testes automatizados
- Interface responsiva e com foco em acessibilidade

## Observações de segurança
- Nunca insira chaves de acesso diretamente no código-fonte.
- Sempre utilize o arquivo .env para armazenar credenciais sensíveis.
- Mantenha o .env fora do controle de versionamento.
