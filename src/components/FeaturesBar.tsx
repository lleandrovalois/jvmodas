"use client";

import React from "react";
import { Truck, CreditCard, RotateCcw, Award } from "lucide-react";
import { useCms } from "@/context/CmsContext";

export function FeaturesBar() {
  const { cms } = useCms();

  const features = [
    {
      icon: Truck,
      title: "Frete Grátis Brasil",
      desc: `Em pedidos acima de R$ ${cms.freeShippingThreshold.toFixed(0)}`,
    },
    {
      icon: CreditCard,
      title: "Até 12x Sem Juros",
      desc: "Ou 5% de desconto extra via PIX",
    },
    {
      icon: RotateCcw,
      title: "1ª Troca Grátis",
      desc: "Até 30 dias sem burocracia",
    },
    {
      icon: Award,
      title: "Qualidade Premium",
      desc: "Poliamida com Zero Transparência",
    },
  ];

  return (
    <section
      className="w-full py-6 transition-colors duration-300"
      style={{
        backgroundColor: "var(--card-bg)",
        color: "var(--text-primary)",
        borderTop: "1px solid rgba(148, 163, 184, 0.15)",
        borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div key={index} className="flex items-center gap-3 group">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-md"
                  style={{ backgroundColor: `${cms.secondaryColor || "#e11d48"}20` }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: cms.secondaryColor || "#e11d48" }}
                  />
                </div>
                <div>
                  <h4
                    className="text-sm font-extrabold tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {feat.title}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
