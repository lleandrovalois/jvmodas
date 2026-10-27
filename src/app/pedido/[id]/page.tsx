"use client";

import React, { use } from "react";
import Link from "next/link";
import { OrderDetailView } from "@/components/OrderDetailView";
import { useCms } from "@/context/CmsContext";
import { ArrowLeft } from "lucide-react";

export default function PedidoDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { cms } = useCms();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Top Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/meus-pedidos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Meus Pedidos</span>
          </Link>

          <Link href="/" className="font-black text-xl tracking-tight">
            <span style={{ color: cms.secondaryColor || "#e11d48" }}>JV</span>
            <span>MODAS</span>
          </Link>

          <Link
            href="/"
            className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-500 transition"
          >
            Loja
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        <OrderDetailView orderId={id} />
      </main>
    </div>
  );
}
