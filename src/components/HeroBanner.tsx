"use client";

import React from "react";
import { useCms } from "@/context/CmsContext";
import { Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export function HeroBanner({ onCtaClick }: { onCtaClick?: () => void }) {
  const { cms } = useCms();

  return (
    <section className="relative w-full overflow-hidden bg-slate-950 text-white min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] flex items-center">
      {/* Background Image with Athletic Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cms.heroBannerUrl}
          alt={cms.heroTitle}
          className="w-full h-full object-cover object-center brightness-60 scale-105 transform animate-fadeSlow"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
        <div className="max-w-2xl space-y-6">
          
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-white/10 backdrop-blur-md border border-white/20 text-rose-300">
            <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-spin" />
            <span>Coleção Fitness 2026</span>
          </div>

          {/* Hero Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[1.08] text-white">
            {cms.heroTitle}
          </h1>

          {/* Hero Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 font-medium leading-relaxed max-w-xl">
            {cms.heroSubtitle}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => {
                if (onCtaClick) {
                  onCtaClick();
                } else {
                  const el = document.getElementById("vitrine");
                  el?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="px-8 py-4 rounded-xl font-black text-sm uppercase tracking-wider text-white shadow-xl hover:brightness-110 active:scale-95 transition flex items-center gap-3 group"
              style={{ backgroundColor: cms.secondaryColor || "#e11d48" }}
            >
              <span>{cms.heroCtaText || "Explorar Coleção"}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <a
              href="#vitrine"
              className="px-6 py-4 rounded-xl font-bold text-sm text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Ver Mais Vendidos</span>
            </a>
          </div>

          {/* Technology Highlights */}
          <div className="pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero Transparência</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Compressão Inteligente</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Proteção Solar UV50+</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
