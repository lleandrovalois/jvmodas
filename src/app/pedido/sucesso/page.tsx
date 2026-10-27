"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { OrderDetailView } from "@/components/OrderDetailView";
import { useCms } from "@/context/CmsContext";
import { ArrowLeft, Package } from "lucide-react";

function PedidoSucessoContent() {
  const searchParams = useSearchParams();
  const externalRef = searchParams.get("external_reference") || searchParams.get("orderId");
  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id") || undefined;
  const status = searchParams.get("status") || searchParams.get("collection_status") || undefined;

  if (!externalRef) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Nenhum pedido especificado
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6">
          Acesse a página de Meus Pedidos para consultar suas compras recentes.
        </p>
        <Link
          href="/meus-pedidos"
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-950"
        >
          Consultar Meus Pedidos
        </Link>
      </div>
    );
  }

  return (
    <OrderDetailView
      orderId={externalRef}
      initialPaymentId={paymentId}
      initialStatus={status}
    />
  );
}

export default function PedidoSucessoPage() {
  const { cms } = useCms();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Top Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para a Loja</span>
          </Link>

          <Link href="/" className="font-black text-xl tracking-tight">
            <span style={{ color: cms.secondaryColor || "#e11d48" }}>JV</span>
            <span>MODAS</span>
          </Link>

          <Link
            href="/meus-pedidos"
            className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-500 transition"
          >
            Meus Pedidos
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        <Suspense
          fallback={
            <div className="min-h-[50vh] flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <PedidoSucessoContent />
        </Suspense>
      </main>
    </div>
  );
}
