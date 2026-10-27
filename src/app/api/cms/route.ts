import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    let settings = await prisma.cmsSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.cmsSettings.create({
        data: {
          id: "default",
          brandName: "JVMODAS",
          brandTagline: "Moda Fitness de Alta Performance & Estilo",
          primaryColor: "#0f172a",
          secondaryColor: "#e11d48",
          accentColor: "#10b981",
          backgroundColor: "#0f172a",
          cardColor: "#1e293b",
          textColor: "#f8fafc",
          buttonTextColor: "#ffffff",
          activePreset: "dark-fitness",
          topBarText: "🔥 FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 199 | 10% OFF COM CUPOM: JV10",
          topBarActive: true,
          heroTitle: "SUPERE SEUS LIMITES COM ESTILO E CONFORTO",
          heroSubtitle: "Tecnologia têxtil em poliamida nobre, compressão anatômica, toque de seda e zero transparência.",
          heroBannerUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1600&auto=format&fit=crop",
          heroCtaText: "Ver Coleção 2026",
          promoBannerTitle: "CONJUNTOS SEAMLESS EM DESTAQUE",
          promoBannerSubtitle: "Efeito modelador de alta performance para treinos intensos.",
          promoBannerUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1600&auto=format&fit=crop",
          promoBannerLink: "/?categoria=Conjuntos",
          instagramUrl: "https://instagram.com/jvmodasfitness",
          whatsappNumber: "5511999998888",
          freeShippingThreshold: 199.0,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching CMS settings:", error);
    return NextResponse.json(
      { error: "Erro ao carregar configurações do CMS" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login como administrador." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const updated = await prisma.cmsSettings.upsert({
      where: { id: "default" },
      update: {
        brandName: body.brandName,
        brandTagline: body.brandTagline,
        logoUrl: body.logoUrl,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        accentColor: body.accentColor,
        backgroundColor: body.backgroundColor,
        cardColor: body.cardColor,
        textColor: body.textColor,
        buttonTextColor: body.buttonTextColor,
        activePreset: body.activePreset,
        topBarText: body.topBarText,
        topBarActive: Boolean(body.topBarActive),
        heroTitle: body.heroTitle,
        heroSubtitle: body.heroSubtitle,
        heroBannerUrl: body.heroBannerUrl,
        heroCtaText: body.heroCtaText,
        promoBannerTitle: body.promoBannerTitle,
        promoBannerSubtitle: body.promoBannerSubtitle,
        promoBannerUrl: body.promoBannerUrl,
        promoBannerLink: body.promoBannerLink,
        instagramUrl: body.instagramUrl,
        whatsappNumber: body.whatsappNumber,
        freeShippingThreshold: Number(body.freeShippingThreshold) || 199.0,
      },
      create: {
        id: "default",
        brandName: body.brandName || "JVMODAS",
        brandTagline: body.brandTagline || "Moda Fitness",
        primaryColor: body.primaryColor || "#0f172a",
        secondaryColor: body.secondaryColor || "#e11d48",
        accentColor: body.accentColor || "#10b981",
        backgroundColor: body.backgroundColor || "#0f172a",
        cardColor: body.cardColor || "#1e293b",
        textColor: body.textColor || "#f8fafc",
        buttonTextColor: body.buttonTextColor || "#ffffff",
        activePreset: body.activePreset || "dark-fitness",
        topBarText: body.topBarText || "FRETE GRÁTIS ACIMA DE R$ 199",
        topBarActive: body.topBarActive ?? true,
        heroTitle: body.heroTitle || "SUPERE SEUS LIMITES",
        heroSubtitle: body.heroSubtitle || "",
        heroBannerUrl: body.heroBannerUrl || "",
        heroCtaText: body.heroCtaText || "Ver Coleção",
        promoBannerTitle: body.promoBannerTitle || "",
        promoBannerSubtitle: body.promoBannerSubtitle || "",
        promoBannerUrl: body.promoBannerUrl || "",
        promoBannerLink: body.promoBannerLink || "/",
        instagramUrl: body.instagramUrl || "",
        whatsappNumber: body.whatsappNumber || "5511999998888",
        freeShippingThreshold: Number(body.freeShippingThreshold) || 199.0,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating CMS settings:", error);
    return NextResponse.json(
      { error: "Erro ao salvar configurações do CMS" },
      { status: 500 }
    );
  }
}
