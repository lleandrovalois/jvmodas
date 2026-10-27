import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting JVMODAS database seed...");

  // 1. Clean existing records
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.cmsSettings.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Admin User
  const admin = await prisma.user.create({
    data: {
      email: "admin@jvmodas.com.br",
      name: "Administrador JVMODAS",
      password: "admin123", // In production, hash with bcrypt/argon2
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // 3. Create CMS Settings
  const cms = await prisma.cmsSettings.create({
    data: {
      id: "default",
      brandName: "JVMODAS",
      brandTagline: "Moda Fitness de Alta Performance & Estilo",
      logoUrl: "",
      primaryColor: "#0f172a",
      secondaryColor: "#e11d48",
      accentColor: "#10b981",
      backgroundColor: "#0f172a",
      cardColor: "#1e293b",
      textColor: "#f8fafc",
      buttonTextColor: "#ffffff",
      activePreset: "dark-fitness",
      topBarText: "🔥 FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 199 | 10% OFF NA 1ª COMPRA COM O CUPOM 'JV10'",
      topBarActive: true,
      heroTitle: "SUPERE SEUS LIMITES COM ESTILO E CONFORTO",
      heroSubtitle: "Tecnologia têxtil em poliamida nobre, compressão anatômica, toque de seda e zero transparência garantida em qualquer agachamento.",
      heroBannerUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1600&auto=format&fit=crop",
      heroCtaText: "Ver Coleção 2026",
      promoBannerTitle: "CONJUNTOS SEAMLESS EM DESTAQUE",
      promoBannerSubtitle: "Efeito modelador de alta performance para treinos intensos e dia a dia atlético.",
      promoBannerUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1600&auto=format&fit=crop",
      promoBannerLink: "/?categoria=Conjuntos",
      instagramUrl: "https://instagram.com/jvmodasfitness",
      whatsappNumber: "5511999998888",
      freeShippingThreshold: 199.0,
    },
  });
  console.log(`✅ CMS Settings initialized: ${cms.brandName}`);

  // 4. Categories
  const categoriesList = [
    { name: "Leggings", slug: "leggings", description: "Leggings de alta compressão, toque macio e zero transparência." },
    { name: "Tops", slug: "tops", description: "Tops fitness com sustentação inteligente e liberdade de movimento." },
    { name: "Conjuntos", slug: "conjuntos", description: "Conjuntos seamless e canelados de alta performance." },
    { name: "Shorts", slug: "shorts", description: "Shorts duplos e ciclistas com bolsos anatômicos funcionais." },
    { name: "Macacões", slug: "macacoes", description: "Macacões modeladores de peça única com ajuste anatômico." },
    { name: "Acessórios", slug: "acessorios", description: "Acessórios e complementos esportivos premium." },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categoriesList) {
    const createdCat = await prisma.category.create({
      data: cat,
    });
    categoryMap[cat.name] = createdCat.id;
  }
  console.log(`✅ ${categoriesList.length} categories seeded!`);

  // 5. Products & Variants
  const productsData = [
    {
      name: "Legging Emana® Zero Transparência Cintura Alta",
      slug: "legging-emana-zero-transparencia",
      category: "Leggings",
      originalPrice: 169.9,
      price: 129.9,
      badge: "MAIS VENDIDO",
      featured: true,
      rating: 4.9,
      reviewsCount: 184,
      description:
        "A queridinha das academias! Confeccionada em Poliamida Emana® com minerais bioativos que estimulam a microcirculação e reduzem a fadiga muscular. Cós anatômico duplo ultra alto que não enrola, costura reforçada e tecnologia zero transparência testada.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop",
      ]),
      colors: [
        { color: "Preto Carbono", colorHex: "#18181b" },
        { color: "Marsala Nobre", colorHex: "#881337" },
        { color: "Verde Militar", colorHex: "#14532d" },
        { color: "Azul Marinho", colorHex: "#1e3a8a" },
      ],
    },
    {
      name: "Top Nadador Alta Sustentação com Bojo Removível",
      slug: "top-nadador-alta-sustentacao",
      category: "Tops",
      originalPrice: 99.9,
      price: 69.9,
      badge: "DESTAQUE",
      featured: true,
      rating: 4.8,
      reviewsCount: 92,
      description:
        "Projetado para treinos de alto impacto como Crossfit, Corrida e Musculação pesada. Alças largas que distribuem o peso, bojo inteligente impermeável que não deforma na lavagem e forro duplo antitranspirante com proteção UV50+.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=1000&auto=format&fit=crop",
      ]),
      colors: [
        { color: "Preto Carbono", colorHex: "#18181b" },
        { color: "Rosa Shocking", colorHex: "#e11d48" },
        { color: "Branco Neve", colorHex: "#f8fafc" },
        { color: "Lilás Lavanda", colorHex: "#a855f7" },
      ],
    },
    {
      name: "Conjunto Glow Fit Canelado (Top + Legging)",
      slug: "conjunto-glow-fit-canelado",
      category: "Conjuntos",
      originalPrice: 249.9,
      price: 189.9,
      badge: "LANÇAMENTO",
      featured: true,
      rating: 5.0,
      reviewsCount: 67,
      description:
        "O visual mais sofisticado da coleção! Tecido canelado premium com brilho sutil sofisticado, alta compressão que esculpe a silhueta e elasticidade multidirecional. Acompanha o top com decote quadrado moderno e legging com cós modelador.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1518459031867-a89b944bffe4?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000&auto=format&fit=crop",
      ]),
      colors: [
        { color: "Verde Oliva", colorHex: "#3f6212" },
        { color: "Terracota Chic", colorHex: "#c2410c" },
        { color: "Preto Grafite", colorHex: "#27272a" },
        { color: "Azul Royal", colorHex: "#1d4ed8" },
      ],
    },
    {
      name: "Shorts Duplo com Bolso Anatômico para Celular",
      slug: "shorts-duplo-com-bolso-anatomico",
      category: "Shorts",
      originalPrice: 109.9,
      price: 79.9,
      badge: "NOVO",
      featured: true,
      rating: 4.9,
      reviewsCount: 114,
      description:
        "Liberdade absoluta para suas corridas e treinos ao ar livre. Camada interna de compressão com bolso seguro que segura qualquer smartphone sem balançar, e camada externa leve e fluida em tecido Dry-Fit antibacteriano.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop",
      ]),
      colors: [
        { color: "Preto Carbono", colorHex: "#18181b" },
        { color: "Cinza Mescla", colorHex: "#64748b" },
        { color: "Bordô", colorHex: "#831843" },
      ],
    },
    {
      name: "Macacão Fitness Power Sculpt Decote Cruzado",
      slug: "macacao-fitness-power-sculpt",
      category: "Macacões",
      originalPrice: 219.9,
      price: 169.9,
      badge: "EXCLUSIVO",
      featured: true,
      rating: 5.0,
      reviewsCount: 45,
      description:
        "Peça única de impacto! Modelagem anatômica com recorte nas costas e decote cruzado que valoriza o tronco com elegância atlética. Não desce, não enrola e proporciona suporte total para movimentos exigentes.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=1000&auto=format&fit=crop",
      ]),
      colors: [
        { color: "Preto All Black", colorHex: "#09090b" },
        { color: "Azul Petróleo", colorHex: "#0e7490" },
        { color: "Verde Esmeralda", colorHex: "#064e3b" },
      ],
    },
    {
      name: "Shorts Biker Seamless Levanta Bumbum",
      slug: "shorts-biker-seamless-levanta-bumbum",
      category: "Shorts",
      originalPrice: 89.9,
      price: 64.9,
      badge: "TENDÊNCIA",
      featured: false,
      rating: 4.8,
      reviewsCount: 78,
      description:
        "Tecnologia sem costura que não marca nem aperta. Franzido sutil traseiro 'scrunch booty' que valoriza a silhueta natural com extremo bom gosto. Conforto térmico incomparável.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop",
      ]),
      colors: [
        { color: "Lilás Pastel", colorHex: "#c084fc" },
        { color: "Preto Carbono", colorHex: "#18181b" },
        { color: "Rosa Bebê", colorHex: "#f472b6" },
        { color: "Cinza Chumbo", colorHex: "#334155" },
      ],
    },
    {
      name: "Regata Cavada Dry-Fit Respirável Anti-Odor",
      slug: "regata-cavada-dry-fit-respiravel",
      category: "Tops",
      originalPrice: 69.9,
      price: 49.9,
      badge: null,
      featured: false,
      rating: 4.7,
      reviewsCount: 39,
      description:
        "Tecido ultraleve microperfurado a laser para ventilação máxima contínua. Secagem ultra-rápida, caimento soltinho e proteção antibacteriana que neutraliza odores da transpiração.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000&auto=format&fit=crop",
      ]),
      colors: [
        { color: "Branco Neve", colorHex: "#f8fafc" },
        { color: "Preto Carbono", colorHex: "#18181b" },
        { color: "Coral Vivo", colorHex: "#fb7185" },
      ],
    },
    {
      name: "Jaqueta Corta-Vento Ultra Leve Impermeável",
      slug: "jaqueta-corta-vento-ultra-leve",
      category: "Acessórios",
      originalPrice: 189.9,
      price: 139.9,
      badge: "PREMIUM",
      featured: false,
      rating: 4.9,
      reviewsCount: 51,
      description:
        "A aliada ideal para aquecimentos e treinos em dias frios ou chuvosos. Cabe no bolso quando dobrada, possui capuz com elástico regulável, zíper tratorado de alta durabilidade e detalhes refletivos noturnos.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1518459031867-a89b944bffe4?q=80&w=1000&auto=format&fit=crop",
      ]),
      colors: [
        { color: "Preto Fosco", colorHex: "#18181b" },
        { color: "Rosa Neon", colorHex: "#f43f5e" },
        { color: "Cinza Gelo", colorHex: "#cbd5e1" },
      ],
    },
  ];

  const sizes = ["P", "M", "G", "GG"];

  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        categoryId: categoryMap[p.category] || null,
        originalPrice: p.originalPrice,
        price: p.price,
        badge: p.badge,
        featured: p.featured,
        rating: p.rating,
        reviewsCount: p.reviewsCount,
        description: p.description,
        images: p.images,
      },
    });

    for (const c of p.colors) {
      for (const sz of sizes) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            size: sz,
            color: c.color,
            colorHex: c.colorHex,
            stock: Math.floor(Math.random() * 20) + 8, // 8 a 28 units
            sku: `${p.slug.substring(0, 4).toUpperCase()}-${sz}-${c.color.substring(0, 3).toUpperCase()}`,
          },
        });
      }
    }
  }
  console.log(`✅ ${productsData.length} products and hundreds of variants seeded!`);

  // 5. Create Sample Orders for Admin Demonstration
  const sampleOrders = [
    {
      id: "JVM-782910",
      customerName: "Camila Rodrigues da Silva",
      customerEmail: "camila.rodrigues@email.com",
      customerCpf: "123.456.789-00",
      customerPhone: "(11) 98765-4321",
      shippingCep: "01310-100",
      shippingStreet: "Avenida Paulista",
      shippingNumber: "1578",
      shippingComplement: "Apto 82",
      shippingNeighborhood: "Bela Vista",
      shippingCity: "São Paulo",
      shippingState: "SP",
      shippingMethod: "SEDEX Expresso",
      shippingPrice: 18.5,
      subtotal: 259.8,
      discount: 25.98,
      total: 252.32,
      couponCode: "JV10",
      paymentMethod: "PIX",
      paymentStatus: "APPROVED",
      trackingCode: "BR982103492SP",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    },
    {
      id: "JVM-782911",
      customerName: "Mariana Santos Albuquerque",
      customerEmail: "mariana.fitness@gmail.com",
      customerCpf: "234.567.890-11",
      customerPhone: "(21) 99887-1122",
      shippingCep: "22041-001",
      shippingStreet: "Rua Barata Ribeiro",
      shippingNumber: "450",
      shippingComplement: "Bloco B, 304",
      shippingNeighborhood: "Copacabana",
      shippingCity: "Rio de Janeiro",
      shippingState: "RJ",
      shippingMethod: "Frete Grátis",
      shippingPrice: 0.0,
      subtotal: 319.8,
      discount: 0.0,
      total: 319.8,
      paymentMethod: "CREDIT_CARD",
      paymentStatus: "APPROVED",
      cardLastDigits: "4242",
      cardInstallments: 6,
      trackingCode: "BR749102381RJ",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hours ago
    },
    {
      id: "JVM-782912",
      customerName: "Beatriz Nogueira Mendes",
      customerEmail: "bia.mendes@uol.com.br",
      customerCpf: "345.678.901-22",
      customerPhone: "(31) 99123-5566",
      shippingCep: "30140-060",
      shippingStreet: "Rua Alagoas",
      shippingNumber: "1000",
      shippingComplement: "Sala 401",
      shippingNeighborhood: "Savassi",
      shippingCity: "Belo Horizonte",
      shippingState: "MG",
      shippingMethod: "PAC Econômico",
      shippingPrice: 12.0,
      subtotal: 129.9,
      discount: 0.0,
      total: 141.9,
      paymentMethod: "PIX",
      paymentStatus: "PENDING",
      pixCopyPasteCode: "00020126580014br.gov.bcb.pix0136d8f53342-9999-4d44-8888-jvmodas109285204000053039865406141.905802BR5915JVMODAS FITNESS6009SAO PAULO62070503***6304E8A1",
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
  ];

  const firstProduct = await prisma.product.findFirst();
  if (firstProduct) {
    for (const ord of sampleOrders) {
      const createdOrder = await prisma.order.create({
        data: ord,
      });

      await prisma.orderItem.create({
        data: {
          orderId: createdOrder.id,
          productId: firstProduct.id,
          productName: firstProduct.name,
          size: "M",
          color: "Preto Carbono",
          price: firstProduct.price,
          quantity: 2,
          imageUrl: JSON.parse(firstProduct.images)[0],
        },
      });
    }
  }
  console.log(`✅ Sample orders created for Admin Dashboard.`);
  console.log(`🚀 Database seed completed successfully!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
