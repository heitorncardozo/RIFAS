# 🎟️ RifaVIP — Sistema de Gerenciamento de Rifas

Sistema web completo para controle de vendas de rifas com área pública para vendedores e dashboard administrativo protegido.

## ✨ Funcionalidades

### Área Pública (Vendedores)
- Formulário de registro de venda
- Selecionar aluno vendedor e número da rifa
- Upload de comprovante de pagamento (drag & drop)
- Estatísticas em tempo real (vendidas, disponíveis, arrecadado)

### Área Admin (`/admin`)
- Login protegido com email/senha
- Dashboard com cards de estatísticas
- Tabela de vendas com filtros (busca e filtro por aluno)
- Preview de comprovantes em modal
- Cancelamento de vendas
- Gerenciamento de alunos (adicionar/remover)

## 🚀 Setup — Passo a Passo

### Passo 1: Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta (grátis)
2. Clique em **"New Project"**
3. Escolha um nome (ex: `rifas`) e uma senha para o banco
4. Aguarde o projeto ser criado (~2 minutos)

### Passo 2: Executar o SQL de setup

1. No Supabase Dashboard, vá em **SQL Editor** (menu lateral)
2. Clique em **"New Query"**
3. Copie todo o conteúdo do arquivo `supabase-setup.sql` e cole ali
4. Clique em **"Run"** (ou Ctrl+Enter)
5. Deve aparecer "Success" — isso cria as tabelas, políticas de segurança, bucket de armazenamento e gera as 800 rifas

### Passo 3: Configurar as credenciais

1. No Supabase, vá em **Settings > API** (no menu lateral)
2. Copie a **Project URL** e a **anon/public key**
3. Crie o arquivo `.env.local` na raiz do projeto:

```bash
# Copie o template
copy .env.local.example .env.local
```

4. Abra `.env.local` e substitua pelos seus valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Passo 4: Criar usuário admin

1. No Supabase, vá em **Authentication > Users**
2. Clique em **"Add User" > "Create New User"**
3. Preencha um email e senha (ex: `admin@rifavip.com` / `senha123`)
4. Marque **"Auto Confirm User"**
5. Clique em **"Create User"**

### Passo 5: Rodar o projeto

```bash
npm run dev
```

Acesse:
- **Site público**: [http://localhost:3000](http://localhost:3000)
- **Admin login**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## 🛠️ Tecnologias

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (Auth, Database, Storage)

## 📁 Estrutura

```
src/
├── app/
│   ├── page.tsx           # Página pública (formulário de venda)
│   ├── SaleForm.tsx       # Componente do formulário
│   ├── actions.ts         # Server actions públicas
│   ├── layout.tsx         # Layout raiz
│   ├── globals.css        # Design system
│   └── admin/
│       ├── page.tsx       # Dashboard admin
│       ├── actions.ts     # Server actions admin
│       ├── layout.tsx     # Auth guard
│       └── login/
│           └── page.tsx   # Página de login
├── components/ui/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── FileUpload.tsx
│   ├── Modal.tsx
│   └── Toast.tsx
├── lib/
│   ├── types.ts
│   └── supabase/
│       ├── client.ts      # Browser client
│       └── server.ts      # Server client
└── middleware.ts           # Proteção de rotas + refresh de sessão
```
