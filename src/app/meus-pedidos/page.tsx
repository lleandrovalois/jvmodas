"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Order } from "@/types";
import { useCms } from "@/context/CmsContext";
import { OrderDetailView } from "@/components/OrderDetailView";
import {
  Search,
  Package,
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  Loader2,
  Calendar,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

export default function MeusPedidosPage() {
  const { cms } = useCms();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = query.trim();
    if (!clean) {
      setError("Por favor, digite o número do pedido, e-mail ou CPF.");
      return;
    }

    setLoading(true);
    setError("");
    setSelectedOrderId(null);

    try {
      const res = await fetch(`/api/orders/lookup?q=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || "Nenhum pedido encontrado.");
        setOrders([]);
      } else {
        setOrders(data.orders || []);
        if (data.orders?.length === 1) {
          setSelectedOrderId(data.orders[0].id);
        }
      }
    } catch (err: any) {
      setError("Falha ao buscar pedidos. Tente novamente.");
      setOrders([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const getStatusBadge = (order: Order) => {
    const status = (order.orderStatus || order.paymentStatus || "").toUpperCase();
    if (status === "ENTREGUE" || status === "DELIVERED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-3 h-3" /> Entregue
        </span>
      );
    }
    if (status === "ENVIADO" || status === "SHIPPED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
          <Truck className="w-3 h-3" /> Enviado
        </span>
      );
    }
    if (status === "SEPARANDO" || status === "SEPARATING") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
          <Package className="w-3 h-3" /> Em Separação
        </span>
      );
    }
    if (order.paymentStatus === "APPROVED" || status === "PAGO") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-3 h-3" /> Pago / Aprovado
        </span>
      );
    }
    if (order.paymentStatus === "CANCELLED" || status === "CANCELADO") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-3 h-3" /> Cancelado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
        <Clock className="w-3 h-3" /> Aguardando Pagamento
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
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
            href="/admin"
            className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Painel CMS
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8 space-y-8">
        
        {/* SEARCH HERO */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto shadow-xs">
            <Package className="w-7 h-7" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Acompanhar Meus Pedidos
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Consulte o status do pagamento, separação e rastreamento da sua encomenda em tempo real.
          </p>

          <form onSubmit={handleSearch} className="max-w-xl mx-auto pt-2">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Número do Pedido (ex: JVM-123456), E-mail ou CPF"
                className="w-full pl-12 pr-32 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-slate-900 dark:text-white shadow-xs"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: cms.secondaryColor || "#e11d48" }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
              </button>
            </div>
            {error && (
              <p className="text-xs font-semibold text-rose-500 mt-2 text-left pl-2">
                {error}
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-2">
              Dica: Digite apenas o seu e-mail ou CPF cadastrado para ver todo o histórico de compras.
            </p>
          </form>
        </div>

        {/* DETAILS OF SELECTED ORDER */}
        {selectedOrderId && (
          <div className="space-y-4">
            {orders.length > 1 && (
              <button
                onClick={() => setSelectedOrderId(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para a lista de {orders.length} pedidos</span>
              </button>
            )}
            <OrderDetailView orderId={selectedOrderId} />
          </div>
        )}

        {/* LIST OF MULTIPLE ORDERS (IF FOUND AND NO SINGLE SELECTION) */}
        {!selectedOrderId && searched && orders.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Pedidos Encontrados ({orders.length})
              </h3>
              <span className="text-xs text-slate-500">
                Clique em um pedido para ver o rastreamento completo
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrderId(ord.id)}
                  className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 dark:hover:border-rose-500/50 shadow-sm transition-all cursor-pointer group space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors">
                        #{ord.id}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {getStatusBadge(ord)}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Item Thumbnails */}
                    <div className="flex items-center gap-2 overflow-x-auto max-w-md py-1">
                      {ord.items.slice(0, 4).map((it) => (
                        <div
                          key={it.id}
                          className="w-12 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700"
                          title={`${it.productName} (${it.size}/${it.color})`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={it.imageUrl || "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400"}
                            alt={it.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {ord.items.length > 4 && (
                        <span className="text-xs font-bold text-slate-400 px-2">
                          +{ord.items.length - 4} mais
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total do Pedido</div>
                      <div className="text-base font-black text-slate-900 dark:text-white">
                        R$ {ord.total.toFixed(2).replace(".", ",")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-rose-500 group-hover:translate-x-1 transition-transform">
                    <span>Ver detalhes, timeline e rastreamento</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOT FOUND HELPER */}
        {searched && orders.length === 0 && !error && (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <p className="text-sm text-slate-500">
              Nenhum pedido foi encontrado com o termo digitado.
            </p>
            <p className="text-xs text-slate-400">
              Verifique se digitou o e-mail ou CPF corretamente ou entre em contato com nosso atendimento via WhatsApp.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
