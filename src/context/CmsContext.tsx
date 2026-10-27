"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CmsSettings } from "@/types";
import { FACTORY_DEFAULT_PRESET } from "@/lib/theme-presets";

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
  primaryColor: FACTORY_DEFAULT_PRESET.primaryColor,
  secondaryColor: FACTORY_DEFAULT_PRESET.secondaryColor,
  accentColor: FACTORY_DEFAULT_PRESET.accentColor,
  backgroundColor: FACTORY_DEFAULT_PRESET.backgroundColor,
  cardColor: FACTORY_DEFAULT_PRESET.cardColor,
  textColor: FACTORY_DEFAULT_PRESET.textColor,
  buttonTextColor: FACTORY_DEFAULT_PRESET.buttonTextColor,
  activePreset: FACTORY_DEFAULT_PRESET.id,
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
      const root = document.documentElement;
      const bg = settings.backgroundColor || FACTORY_DEFAULT_PRESET.backgroundColor;
      const card = settings.cardColor || FACTORY_DEFAULT_PRESET.cardColor;
      const text = settings.textColor || FACTORY_DEFAULT_PRESET.textColor;
      const primary = settings.primaryColor || FACTORY_DEFAULT_PRESET.primaryColor;
      const secondary = settings.secondaryColor || FACTORY_DEFAULT_PRESET.secondaryColor;
      const accent = settings.accentColor || FACTORY_DEFAULT_PRESET.accentColor;
      const btnText = settings.buttonTextColor || FACTORY_DEFAULT_PRESET.buttonTextColor;

      root.style.setProperty("--background", bg);
      root.style.setProperty("--foreground", text);
      root.style.setProperty("--card-bg", card);
      root.style.setProperty("--text-primary", text);
      root.style.setProperty("--primary-color", primary);
      root.style.setProperty("--secondary-color", secondary);
      root.style.setProperty("--accent-color", accent);
      root.style.setProperty("--btn-text", btnText);

      // Sincroniza classes dark/light para contraste automático de bordas e textos
      const bgLower = bg.toLowerCase();
      const isLight =
        bgLower === "#ffffff" ||
        bgLower === "#f8fafc" ||
        bgLower === "#f1f5f9" ||
        bgLower.startsWith("#f");

      if (isLight) {
        root.classList.add("light");
        root.classList.remove("dark");
      } else {
        root.classList.add("dark");
        root.classList.remove("light");
      }
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
