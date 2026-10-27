# 🏋️‍♀️ JVMODAS - E-Commerce de Moda Fitness & Painel CMS

> Aplicação completa, robusta e 100% funcional de e-commerce de moda fitness, desenvolvida com arquitetura moderna em **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM** e gateway de pagamento com suporte a **PIX dinâmico (QR Code EMVCo)** e **Cartão de Crédito**.

---

## 🌟 Principais Recursos e Diferenciais

### 1. Experiência de Compra de Alta Conversão (Mobile-First)
- **Design Moderno & Esportivo:** Paleta atlética de alto contraste, tipografia elegante e micro-animações.
- **Top Announcement Bar Dinâmica:** Mensagem no topo administrável via CMS com cupons e avisos de frete.
- **Vitrine Inteligente:** Filtro instantâneo por categoria (*Leggings, Tops, Shorts, Conjuntos, Macacões, Acessórios*), filtro por tamanho (*P, M, G, GG*) e ordenação por menor/maior preço, mais recentes ou mais vendidos.
- **Card de Produto com Dupla Foto:** Hover suave com exibição da segunda foto, seletor de cores em tempo real e cálculo automático de parcelamento.
- **Modal QuickView & Guia de Medidas:** Galeria com miniaturas, seletor de tamanho/cor com estoque por variação e tabela oficial de medidas feminina (Busto, Cintura, Quadril).
- **Gaveta Lateral de Carrinho (Slide-over):**
  - **Barra de Progresso Animada:** Indica quanto falta para atingir o valor do Frete Grátis configurado no CMS.
  - **Controle de Quantidades:** Incremento/decremento com validação do estoque máximo por variação.
  - **Cupons de Desconto:** Suporte nativo a cupons como `JV10` (10% OFF), `PRIMEIRACOMPRA` (15% OFF) e `FITNESS20` (20% OFF).

### 2. One-Page Checkout Limpo e Integrado
- **Dados Pessoais:** Validação e máscaras automáticas para Nome, CPF, WhatsApp e E-mail.
- **Auto-preenchimento ViaCEP:** Ao digitar o CEP de 8 dígitos (ex: `01310-100`), a API dos Correios preenche automaticamente Rua, Bairro, Cidade e Estado em menos de 1 segundo.
- **Opções de Frete:** Cálculo de PAC, SEDEX e aplicação automática de **Frete Grátis** quando o subtotal ultrapassa a meta definida no painel admin.
- **Pagamento com PIX Dinâmico:**
  - Gera payload padrão Banco Central (EMVCo) com cálculo de CRC16.
  - Gera QR Code de alta resolução em base64 PNG e código Copia e Cola.
  - Temporizador regressivo de 15 minutos e escuta ativa de webhook/polling que atualiza a tela automaticamente assim que o pagamento é identificado!
- **Pagamento com Cartão de Crédito:**
  - Validação de número de cartão, validade (MM/AA) e código CVV.
  - Seletor de parcelamento de 1x até 12x com cálculo exato das parcelas.
- **Página de Confirmação & WhatsApp:**
  - Celebração com chuva de confetes (`canvas-confetti`).
  - Resumo de entrega e código de rastreamento dos Correios.
  - Botão **"Acompanhar Pedido pelo WhatsApp"** com mensagem pré-formatada contendo o número do pedido, itens e dados do cliente.

### 3. Painel CMS Administrativo (`/admin`)
- **Acesso Protegido:** Autenticação com cookies seguros (`httpOnly`) e senha configurável via `.env` (padrão: `admin123`).
- **Dashboard com Métricas em Tempo Real:**
  - Faturamento total aprovado (R$).
  - Quantidade de pedidos totais e aprovados.
  - Ticket médio de compra.
  - Modelos ativos no catálogo.
  - Alerta de variações com estoque baixo (< 10 unidades).
- **Editor de Identidade Visual e Layout (CMS Dinâmico):**
  - Edição de cores da marca (Primária, Secundária e Destaque) com color picker.
  - Edição do anúncio da barra do topo e toggle liga/desliga.
  - Edição do banner Hero da home (título, subtítulo, foto de fundo, texto do CTA).
  - Edição do banner secundário promocional e link de categoria.
  - Configuração do WhatsApp de atendimento, Instagram e régua de frete grátis.
  - **Persistência Imediata:** Salva no banco de dados e reflete instantaneamente para todos os visitantes sem necessidade de rebuild.
- **Gestão Completa de Catálogo (CRUD):**
  - Cadastro e edição de produtos com fotos em alta resolução, preço "de/por", badges promocionais e descrições técnicas.
  - Grade matricial de variações com controle de estoque independente por tamanho (*P, M, G, GG*) e cor.
  - Exclusão com confirmação.
- **Gestão de Pedidos:**
  - Listagem com filtro por status (*Pendente, Aprovado, Enviado, Cancelado*).
  - Modal com itens comprados, dados do comprador e endereço de entrega.
  - Atualização de status e inserção de código de rastreio dos Correios (ex: `BR982103492SP`).
  - Botão de 1 clique para abrir conversa direta no WhatsApp do cliente.

---

## 🏗️ Arquitetura e Estrutura de Pastas

```
jvmodas-fitness/
├── prisma/
│   ├── schema.prisma             # Schema oficial Prisma com datasource SQLite (zero config local)
│   ├── schema.postgresql.prisma  # Schema oficial Prisma configurado para PostgreSQL / Supabase
│   ├── seed.ts                   # Popula CMS, 8 produtos esportivos realistas, dezenas de variações e pedidos demo
│   └── dev.db                    # Banco de dados SQLite local
├── supabase-setup.sql            # Script SQL nativo DDL para rodar no SQL Editor do Supabase
├── src/
│   ├── app/
│   │   ├── admin/page.tsx        # Painel Administrativo CMS (Dashboard, Visual, Catálogo, Pedidos)
│   │   ├── checkout/page.tsx     # One-Page Checkout com ViaCEP, PIX e Cartão
│   │   ├── order-confirmed/[id]/ # Tela de pedido confirmado, QR Code PIX, polling e WhatsApp
│   │   ├── api/
│   │   │   ├── admin/            # Endpoints de login, logout e verificação de sessão
│   │   │   ├── checkout/         # Criação atômica de pedidos e baixa de estoque
│   │   │   ├── cms/              # Leitura (GET) e atualização (PUT) do CMS
│   │   │   ├── orders/           # Listagem e atualização de pedidos/rastreio
│   │   │   ├── products/         # CRUD de produtos e variações
│   │   │   └── webhook/payment/  # Receptor de webhooks de pagamento (Mercado Pago / Asaas)
│   │   ├── globals.css           # Tailwind CSS v4, variáveis de marca do CMS e animações
│   │   ├── layout.tsx            # Root Layout com SEO meta tags e Providers
│   │   └── page.tsx              # Página inicial da vitrine (SSR)
│   ├── components/
│   │   ├── CartDrawer.tsx        # Gaveta lateral com frete grátis dinâmico e cupons
│   │   ├── FeaturesBar.tsx       # Barra de vantagens competitivas
│   │   ├── Footer.tsx            # Rodapé institucional, selos de segurança e canais de contato
│   │   ├── HeroBanner.tsx        # Banner hero esportivo de alto impacto
│   │   ├── HomePageClient.tsx    # Sincronizador de busca e filtros da Home
│   │   ├── Navbar.tsx            # Header com barra de anúncios dinâmica, busca e carrinho
│   │   ├── ProductCard.tsx       # Card de produto com hover de fotos e seletor de cores
│   │   ├── ProductQuickViewModal.tsx # Modal de detalhes, estoque por tamanho e compra rápida
│   │   ├── PromoBanner.tsx       # Banner secundário promocional integrado ao CMS
│   │   ├── Providers.tsx         # Provedor unificado de CMS e Carrinho
│   │   ├── SizeGuideModal.tsx    # Modal com guia e tabela oficial de medidas
│   │   └── VitrineSection.tsx    # Vitrine com filtros de categoria, tamanho e ordenação
│   ├── context/
│   │   ├── CartContext.tsx       # Estado global da sacola e persistência no LocalStorage
│   │   └── CmsContext.tsx        # Estado global do CMS e injeção de variáveis CSS
│   ├── lib/
│   │   ├── auth.ts               # Autenticação administrativa com cookies seguros
│   │   ├── pix.ts                # Gerador de payload padrão Banco Central (EMVCo) e QR Code
│   │   └── prisma.ts             # Instância singleton do Prisma Client
│   └── types/
│       └── index.ts              # Interfaces TypeScript de todo o sistema
├── .env                          # Variáveis de ambiente locais
├── .env.example                  # Modelo de variáveis de ambiente
├── next.config.ts                # Configuração do Next.js e Turbopack
├── package.json                  # Dependências e scripts do projeto
└── tsconfig.json                 # Configurações do TypeScript
```

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
- Node.js 18+ (recomendado Node.js 20 LTS)
- npm ou pnpm

### 2. Instalação e Inicialização
```bash
# 1. Entrar na pasta do projeto
cd C:\Users\cvalois\.gemini\antigravity-ide\scratch\jvmodas-fitness

# 2. As dependências já estão instaladas, mas caso queira reinstalar:
npm install

# 3. Executar as migrações do banco de dados SQLite local
npx prisma db push

# 4. Popular o banco com dados iniciais realistas
npx tsx prisma/seed.ts

# 5. Iniciar o servidor de desenvolvimento
npm run dev -- -p 3005
```

Acesse no seu navegador:
- **E-commerce:** [http://localhost:3005](http://localhost:3005)
- **Painel Administrativo:** [http://localhost:3005/admin](http://localhost:3005/admin) (Senha: `admin123`)

---

## 🗄️ Modelagem do Banco de Dados

### Tabelas Principais
1. **`cms_settings`**: Armazena identidade visual, cores primária/secundária/destaque, textos da barra do topo, banners, links sociais e limite de frete grátis.
2. **`products`**: Nome, slug amigável, descrição, categoria, preço original (*de*), preço promocional (*por*), fotos em JSON e badges.
3. **`product_variants`**: Variações atômicas de tamanho (*P, M, G, GG*), cor, código hexadecimal e quantidade em estoque.
4. **`orders`**: Pedidos com dados completos do comprador, endereço de entrega, frete, descontos, forma de pagamento, status (*PENDING, APPROVED, SHIPPED, CANCELLED*), código de rastreio e dados de PIX/Cartão.
5. **`order_items`**: Itens vinculados ao pedido com snapshot de preço, tamanho, cor e foto.
6. **`users`**: Usuários administrativos do sistema.

### Como Migrar para Supabase / PostgreSQL na Produção
1. Crie um projeto gratuito no [Supabase](https://supabase.com).
2. Obtenha a Connection String do banco de dados em *Project Settings > Database > Connection String (URI)*.
3. No arquivo `.env`, altere:
   ```env
   DATABASE_URL="postgresql://postgres.[REF]:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
   ```
4. Aplique o schema diretamente:
   ```bash
   npx prisma db push --schema=prisma/schema.postgresql.prisma
   ```
   *Ou execute o script `supabase-setup.sql` diretamente no SQL Editor do Supabase.*

---

## 💳 Integração de Pagamento & Webhook

### PIX Dinâmico (Banco Central)
- A função `createPixPayment` em `src/lib/pix.ts` calcula o payload oficial EMVCo com chave Pix, nome do recebedor, cidade, valor com 2 casas decimais, ID da transação e checksum CRC16 CCITT.
- Converte o payload em uma imagem Data URL PNG em alta resolução.
- Na tela de confirmação (`/order-confirmed/[id]`), um listener verifica o status a cada 3,5 segundos. Ao ser aprovado, dispara a celebração de confetes automaticamente.

### Webhook Simulator / Endpoint Real
- Endpoint: `POST /api/webhook/payment`
- Suporta tanto payloads oficiais do **Mercado Pago** (`data.id`, `external_reference`) e **Asaas** quanto chamadas diretas com `{ "orderId": "JVM-XXXXXX" }`.
- Para testar na interface, basta clicar no botão **"Simular Pagamento no Banco (Aprovar Imediatamente)"** na tela de confirmação do pedido!

---

## 🛠️ Cupons de Teste Ativos
- `JV10`: **10% de desconto** em todo o carrinho.
- `PRIMEIRACOMPRA`: **15% de desconto** para novos clientes.
- `FITNESS20`: **20% de desconto** promocional.

---

## 📦 Deploy na Vercel

1. Suba o repositório para o GitHub ou GitLab.
2. Importe o projeto na [Vercel](https://vercel.com).
3. Adicione as variáveis de ambiente na Vercel:
   - `DATABASE_URL`: URL do Supabase ou PostgreSQL.
   - `ADMIN_PASSWORD`: Senha do painel admin.
   - `ADMIN_SECRET`: Chave secreta de sessão.
   - `NEXT_PUBLIC_APP_URL`: URL do seu domínio na Vercel (ex: `https://jvmodas.vercel.app`).
4. Clique em **Deploy**!
