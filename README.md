# Controle de Contribuições — Terreno da Igreja

Sistema web para gerenciar contribuições financeiras (doações e empréstimos) destinadas à compra de um terreno para uma igreja. Projeto real: qualquer membro registra sua contribuição por um link, e apenas a diretoria, autenticada, tem acesso aos dados consolidados.

> **Status:** Funcionalidades principais concluídas — cadastro público, persistência em banco, autenticação da diretoria e painel de gestão. Em evolução: acabamento visual, upload de comprovante e deploy.

---

## O que o sistema faz

- Formulário público onde qualquer pessoa, via link, cadastra uma contribuição — sem necessidade de login.
- Distingue dois tipos: **doação** (a fundo perdido) e **empréstimo** (com prazo de retorno).
- Para empréstimos, registra o prazo de devolução em meses; para doações, esse campo não se aplica.
- Validação dos dados antes do envio (campos obrigatórios, valor maior que zero, prazo obrigatório só em empréstimos).
- Cada contribuinte vê apenas a confirmação da própria contribuição — nunca as dos outros.
- **Painel restrito à diretoria**, acessível por login individual (e-mail e senha), com:
  - lista completa das contribuições;
  - totais consolidados (total arrecadado, em doações, em empréstimos e valor a devolver).

## Por que a segurança é o ponto central

As informações são financeiras e nominais, então a privacidade é um requisito, não um detalhe. O sistema foi desenhado com uma separação clara, aplicada no próprio banco de dados via **Row Level Security (RLS)**:

- **Qualquer pessoa pode escrever** (cadastrar a própria contribuição).
- **Apenas usuários autenticados podem ler** (a diretoria, no painel).

Como a regra vive no banco, nem mesmo uma requisição direta à API consegue ler os dados sem estar autenticada. O acesso da diretoria fica em uma rota separada e não divulgada (`/admin`), invisível para quem usa o formulário público.

## Tecnologias

| Camada | Ferramenta |
|---|---|
| Front-end | React + Vite |
| Roteamento | React Router |
| Estilização | CSS puro (design tokens) |
| Back-end / Banco | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth (e-mail e senha) |
| Segurança | Row Level Security (RLS) do PostgreSQL |

## Modelo de dados

Tabela `contribuicoes`:

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | int8 | Gerado automaticamente pelo banco |
| `created_at` | timestamptz | Data/hora do registro (automático) |
| `nome` | text | Nome do contribuinte |
| `contato` | text | Telefone ou e-mail para a diretoria |
| `valor` | numeric | Valor em reais |
| `tipo` | text | `doacao` ou `emprestimo` |
| `prazo_retorno` | int8 | Prazo em meses (apenas para empréstimo; nulo em doações) |
| `status` | text | `pendente` ou `confirmado` |

## Como rodar localmente

Pré-requisitos: Node.js instalado e um projeto no Supabase com a tabela `contribuicoes` e as políticas de RLS configuradas.

```bash
# 1. Instalar as dependências
npm install

# 2. Criar um arquivo .env na raiz do projeto com suas chaves do Supabase:
#    VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
#    VITE_SUPABASE_ANON_KEY=sua_chave_anon

# 3. Rodar o servidor de desenvolvimento
npm run dev
```

O app abre em `http://localhost:5173`. O formulário público fica em `/` e o painel da diretoria em `/admin`.

> O arquivo `.env` guarda as chaves de acesso e está listado no `.gitignore` — ele **não** é versionado.

## Principais aprendizados

O desafio mais rico foi configurar a segurança do banco. O cadastro só passou a funcionar depois de destravar, uma a uma, as camadas de permissão do PostgreSQL — cada uma revelada por uma mensagem de erro diferente:

1. **Exposição da tabela na API** — por opção de segurança, novas tabelas não ficam expostas automaticamente; foi preciso liberar a tabela explicitamente.
2. **Políticas por operação (RLS)** — o RLS bloqueia tudo por padrão; cada operação (inserir, ler) precisa da sua própria política.
3. **Inserir ≠ ler** — um erro persistente vinha de tentar *ler* a linha logo após inseri-la, sem haver política de leitura. A operação de escrita foi ajustada para não depender de leitura.

A lição central: um "permission denied" no Supabase geralmente não é um bug de código, e sim a segurança funcionando — a solução está em ler o que o banco informa e ajustar a camada certa.

## Roadmap

- [x] **Fase 1** — Formulário público com validação (dados em memória)
- [x] **Fase 2** — Persistência no Supabase com RLS (cadastro público)
- [x] **Fase 3** — Autenticação da diretoria, rota protegida, painel com lista e totais
- [ ] Acabamento visual do painel e da tela de login
- [ ] Botão para confirmar contribuição (pendente → confirmado) e remover no painel
- [ ] Upload opcional de comprovante (Pix) com armazenamento privado
- [ ] Aviso visual de empréstimos próximos do vencimento
- [ ] Geração de link e QR Code para compartilhar o formulário
- [ ] Deploy em produção

---

Desenvolvido por Paulo Jorge.