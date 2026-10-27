-- ========================================================
-- JVMODAS FITNESS - E-COMMERCE DATABASE SCRIPT FOR SUPABASE
-- Execute este script no SQL Editor do Supabase ou PostgreSQL
-- ========================================================

-- Habilitar extensão UUID caso necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "slug" TEXT UNIQUE NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "originalPrice" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "images" TEXT NOT NULL,
    "featured" BOOLEAN DEFAULT false,
    "badge" TEXT,
    "rating" DOUBLE PRECISION DEFAULT 4.9,
    "reviewsCount" INTEGER DEFAULT 32,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE VARIAÇÕES DE PRODUTOS
CREATE TABLE IF NOT EXISTS "product_variants" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "productId" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA DE PEDIDOS
CREATE TABLE IF NOT EXISTS "orders" (
    "id" TEXT PRIMARY KEY,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerCpf" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "shippingCep" TEXT NOT NULL,
    "shippingStreet" TEXT NOT NULL,
    "shippingNumber" TEXT NOT NULL,
    "shippingComplement" TEXT,
    "shippingNeighborhood" TEXT NOT NULL,
    "shippingCity" TEXT NOT NULL,
    "shippingState" TEXT NOT NULL,
    "shippingMethod" TEXT NOT NULL,
    "shippingPrice" DOUBLE PRECISION DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "couponCode" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "trackingCode" TEXT,
    "pixQrCodeUrl" TEXT,
    "pixCopyPasteCode" TEXT,
    "cardLastDigits" TEXT,
    "cardInstallments" INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA DE ITENS DO PEDIDO
CREATE TABLE IF NOT EXISTS "order_items" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "orderId" TEXT NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "productId" TEXT NOT NULL REFERENCES "products"("id"),
    "productName" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABELA DE CONFIGURAÇÕES CMS (IDENTIDADE VISUAL & CONTEÚDO)
CREATE TABLE IF NOT EXISTS "cms_settings" (
    "id" TEXT PRIMARY KEY DEFAULT 'default',
    "brandName" TEXT NOT NULL DEFAULT 'JVMODAS',
    "brandTagline" TEXT NOT NULL DEFAULT 'Moda Fitness de Alta Performance',
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#0f172a',
    "secondaryColor" TEXT NOT NULL DEFAULT '#e11d48',
    "accentColor" TEXT NOT NULL DEFAULT '#10b981',
    "topBarText" TEXT NOT NULL DEFAULT '🔥 FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 199 | 10% OFF COM CUPOM: JV10',
    "topBarActive" BOOLEAN NOT NULL DEFAULT true,
    "heroTitle" TEXT NOT NULL DEFAULT 'SUPERE SEUS LIMITES COM ESTILO & CONFORTO',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Tecnologia de compressão anatômica, zero transparência e design pensado para potencializar seus treinos.',
    "heroBannerUrl" TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1600&auto=format&fit=crop',
    "heroCtaText" TEXT NOT NULL DEFAULT 'Explorar Coleção',
    "promoBannerTitle" TEXT NOT NULL DEFAULT 'NOVA LINHA SEAMLESS 2026',
    "promoBannerSubtitle" TEXT NOT NULL DEFAULT 'Sem costura, toque macio e máxima respirabilidade para suas sessões de treino.',
    "promoBannerUrl" TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1600&auto=format&fit=crop',
    "promoBannerLink" TEXT NOT NULL DEFAULT '/?categoria=Leggings',
    "instagramUrl" TEXT NOT NULL DEFAULT 'https://instagram.com/jvmodasfitness',
    "whatsappNumber" TEXT NOT NULL DEFAULT '5511999998888',
    "freeShippingThreshold" DOUBLE PRECISION NOT NULL DEFAULT 199.00,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados padrão de CMS se não existirem
INSERT INTO "cms_settings" ("id", "brandName", "brandTagline", "primaryColor", "secondaryColor", "accentColor", "topBarText", "topBarActive", "heroTitle", "heroSubtitle", "heroBannerUrl", "heroCtaText", "promoBannerTitle", "promoBannerSubtitle", "promoBannerUrl", "promoBannerLink", "instagramUrl", "whatsappNumber", "freeShippingThreshold")
VALUES ('default', 'JVMODAS', 'Moda Fitness de Alta Performance & Estilo', '#0f172a', '#e11d48', '#10b981', '🔥 FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 199 | 10% OFF COM CUPOM: JV10', true, 'SUPERE SEUS LIMITES COM ESTILO E CONFORTO', 'Tecnologia têxtil em poliamida nobre, compressão anatômica, toque de seda e zero transparência.', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1600&auto=format&fit=crop', 'Explorar Coleção 2026', 'CONJUNTOS SEAMLESS EM DESTAQUE', 'Efeito modelador de alta performance para treinos intensos.', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1600&auto=format&fit=crop', '/?categoria=Conjuntos', 'https://instagram.com/jvmodasfitness', '5511999998888', 199.00)
ON CONFLICT ("id") DO NOTHING;
