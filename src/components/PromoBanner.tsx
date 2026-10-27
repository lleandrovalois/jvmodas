"use client";

import React from "react";
import Link from "next/link";
import { useCms } from "@/context/CmsContext";
import { ArrowRight, Flame } from "lucide-react";

export function PromoBanner({ onSelectCategory }: { onSelectCategory?: (category: string) => void }) {
  const { cms } = useCms();

  if (!cms.promoBannerTitle && !cms.promoBannerUrl) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white min-h-[300px] sm:min-h-[380px] flex items-center shadow-xl">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cms.promoBannerUrl}
            alt={cms.promoBannerTitle}
            className="w-full h-full object-cover object-center brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-xl p-8 sm:p-14 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600/90 text-white">
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>Destaque Especial</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            {cms.promoBannerTitle}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            {cms.promoBannerSubtitle}
          </p>

          <div className="pt-2">
            <button
              onClick={() => {
                if (onSelectCategory) {
                  onSelectCategory("Conjuntos");
                  const el = document.getElementById("vitrine");
                  el?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-lg hover:brightness-110 active:scale-95 transition flex items-center gap-2 group"
              style={{ backgroundColor: cms.secondaryColor || "#e11d48" }}
            >
              <span>Aproveitar Coleção</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
