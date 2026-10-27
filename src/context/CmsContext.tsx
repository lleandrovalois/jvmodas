"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CmsSettings } from "@/types";

interface CmsContextType {
  cms: CmsSettings;
  loading: boolean;
  refreshCms: () => Promise<void>;
}

const defaultSettings: CmsSettings = {
  id: "default",
  brandName: "JVMODAS",
  brandTagline: "Moda Fitness de Alta Performance & Estilo",
  logoUrl: "",
  primaryColor: "#0f172a",
  secondaryColor: "#e11d48",
  accentColor: "#10b981",
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
};

const CmsContext = createContext<CmsContextType>({
  cms: defaultSettings,
  loading: true,
  refreshCms: async () => {},
});

export function CmsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: CmsSettings | null;
}) {
  const [cms, setCms] = useState<CmsSettings>(initialSettings || defaultSettings);
  const [loading, setLoading] = useState(!initialSettings);

  const applyColorsToRoot = (settings: CmsSettings) => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--primary-color", settings.primaryColor || "#0f172a");
      document.documentElement.style.setProperty("--secondary-color", settings.secondaryColor || "#e11d48");
      document.documentElement.style.setProperty("--accent-color", settings.accentColor || "#10b981");
    }
  };

  const refreshCms = async () => {
    try {
      const res = await fetch("/api/cms", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCms(data);
        applyColorsToRoot(data);
      }
    } catch (err) {
      console.error("Failed to refresh CMS settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialSettings) {
      applyColorsToRoot(initialSettings);
    } else {
      refreshCms();
    }
  }, [initialSettings]);

  return (
    <CmsContext.Provider value={{ cms, loading, refreshCms }}>
      {children}
    </CmsContext.Provider>
  );
}

export function useCms() {
  return useContext(CmsContext);
}
