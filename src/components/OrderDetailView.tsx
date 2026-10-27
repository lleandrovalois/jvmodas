"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Order } from "@/types";
import { useCms } from "@/context/CmsContext";
import {
  CheckCircle2,
  Clock,
  QrCode,
  Copy,
  Check,
  MessageCircle,
  ShoppingBag,
  Truck,
  ArrowRight,
  ShieldCheck,
  Package,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  RotateCcw,
  Sparkles,
  MapPin,
  Calendar,
} from "lucide-react";

interface OrderDetailViewProps {
  orderId: string;
  initialPaymentId?: string;
  initialStatus?: string;
}

export function OrderDetailView({
  orderId,
  initialPaymentId,
  initialStatus,
}: OrderDetailViewProps) {
  const { cms } = useCms();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins for PIX

  // Fetch and sync order
  const fetchOrder = async () => {
    try {
      // 1. If we have initialPaymentId or order is pending, try instant sync with MP
      if (initialPaymentId) {
        try {
          await fetch(`/api/orders/${orderId}/sync-mp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId: initialPaymentId }),
          });
        } catch {
          // Continue to regular fetch
        }
      }

      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);

        if (data.paymentStatus === "APPROVED") {
          // Trigger celebration confetti
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      }
    } catch (e) {
      console.error("Failed to load order", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Auto-poll every 4 seconds if pending to capture webhook or bank approval
    const interval = setInterval(() => {
      if (!order || order.paymentStatus === "PENDING") {
        fetchOrder();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [orderId]);

  // Pix timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleCopyPix = () => {
    if (order?.pixCopyPasteCode) {
      navigator.clipboard.writeText(order.pixCopyPasteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCopyOrderId = () => {
    if (order?.id) {
      navigator.clipboard.writeText(order.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Carregando detalhes do pedido #{orderId}...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Pedido #{orderId} não encontrado
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6">
          Verifique o código digitado ou acesse a página de busca de pedidos.
        </p>
        <div className="flex gap-3">
          <Link
            href="/meus-pedidos"
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-950"
          >
            Consultar Meus Pedidos
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
          >
            Voltar à Loja
          </Link>
        </div>
      </div>
    );
  }

  const isApproved =
    order.paymentStatus === "APPROVED" ||
    order.paymentStatus === "SHIPPED" ||
    order.paymentStatus === "DELIVERED";

  // Timeline Step calculation:
  // Step 1: Pedido Realizado
  // Step 2: Pagamento Confirmado
  // Step 3: Em Separação
  // Step 4: Enviado
  // Step 5: Entregue
  let currentStep = 1;
  const statusStr = (order.orderStatus || order.paymentStatus || "").toUpperCase();

  if (statusStr === "ENTREGUE" || statusStr === "DELIVERED") {
    currentStep = 5;
  } else if (statusStr === "ENVIADO" || statusStr === "SHIPPED") {
    currentStep = 4;
  } else if (statusStr === "SEPARANDO" || statusStr === "SEPARATING") {
    currentStep = 3;
  } else if (isApproved || statusStr === "PAGO" || statusStr === "APPROVED") {
    currentStep = 2;
  } else {
    currentStep = 1;
  }

  const timelineSteps = [
    { step: 1, title: "Pedido Realizado", desc: "Registrado com sucesso" },
    { step: 2, title: "Pagamento Confirmado", desc: "Aprovado via Mercado Pago" },
    { step: 3, title: "Em Separação", desc: "Conferência e embalagem" },
    { step: 4, title: "Enviado", desc: "Postado nos Correios/Transportadora" },
    { step: 5, title: "Entregue", desc: "Recebido no endereço" },
  ];

  // WhatsApp Support Message
  const cleanPhone = (cms.whatsappNumber || "5511999998888").replace(/\D/g, "");
  const whatsappMsg = `Olá, equipe JVMODAS! Gostaria de informações sobre o meu pedido *#${order.id}* no valor de R$ ${order.total
    .toFixed(2)
    .replace(".", ",")}. Seguem os dados:
- Cliente: ${order.customerName}
- Status: ${isApproved ? "Pagamento Aprovado" : "Aguardando Pagamento"}
- Destino: ${order.shippingCity}/${order.shippingState}`;

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="space-y-8">
      
      {/* 1. STATUS BANNER */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-sm text-center space-y-3 transition-colors ${
          isApproved
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
            : order.paymentStatus === "CANCELLED"
            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800"
            : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
        }`}
      >
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md ${
            isApproved
              ? "bg-emerald-500 text-white"
              : order.paymentStatus === "CANCELLED"
              ? "bg-rose-500 text-white"
              : "bg-amber-500 text-white animate-pulse"
          }`}
        >
          {isApproved ? (
            <CheckCircle2 className="w-10 h-10" />
          ) : order.paymentStatus === "CANCELLED" ? (
            <AlertCircle className="w-10 h-10" />
          ) : (
            <Clock className="w-9 h-9" />
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {isApproved
            ? "🎉 Pagamento Confirmado com Sucesso!"
            : order.paymentStatus === "CANCELLED"
            ? "Pedido Cancelado"
            : "Aguardando Confirmação do Pagamento"}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
          {isApproved
            ? `Parabéns, ${order.customerName}! Seu pagamento foi validado com segurança pelo Mercado Pago e seu pedido já está sendo preparado pela nossa equipe!`
            : order.paymentStatus === "CANCELLED"
            ? "O pagamento para este pedido não foi concluído ou foi cancelado."
            : "Seu pedido foi registrado no sistema. Conclua seu pagamento via PIX ou Cartão no Mercado Pago para que possamos iniciar a separação imediatamente."}
        </p>

        {/* ORDER CODE & COPY BUTTON */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs mt-2">
          <span>Código do Pedido:</span>
          <span className="font-mono font-black text-slate-900 dark:text-white">#{order.id}</span>
          <button
            onClick={handleCopyOrderId}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            title="Copiar código do pedido"
          >
            {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. TIMELINE / PROGRESS BAR */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <span>Status de Envio & Rastreamento</span>
          <span className="text-xs font-bold text-slate-500">
            Atualizado em tempo real
          </span>
        </h3>

        {/* Steps Diagram */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden sm:block absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-100 dark:bg-slate-800 z-0">
            <div
              className="h-full bg-emerald-500 transition-all duration-700"
              style={{
                width: `${Math.max(0, Math.min(100, ((currentStep - 1) / (timelineSteps.length - 1)) * 100))}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
            {timelineSteps.map((s) => {
              const isPastOrCurrent = currentStep >= s.step;
              const isCurrent = currentStep === s.step;

              return (
                <div
                  key={s.step}
                  className={`flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 p-3 sm:p-2 rounded-2xl sm:rounded-none transition-all ${
                    isCurrent
                      ? "bg-emerald-50/70 dark:bg-emerald-950/30 sm:bg-transparent"
                      : ""
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 transition-all shadow-sm ${
                      isPastOrCurrent
                        ? "bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {isPastOrCurrent ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : (
                      s.step
                    )}
                  </div>

                  <div className="text-left sm:text-center">
                    <h4
                      className={`text-xs font-black ${
                        isCurrent
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isPastOrCurrent
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {s.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tracking Code Banner (if available) */}
        {order.trackingCode && (
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-sky-800 dark:text-sky-200">
              <Truck className="w-4 h-4 text-sky-500" />
              <span>Código de Rastreamento:</span>
              <strong className="font-mono font-black">{order.trackingCode}</strong>
            </div>
            <a
              href={`https://rastreamento.correios.com.br/app/index.php?objeto=${order.trackingCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl font-bold bg-sky-600 hover:bg-sky-500 text-white transition flex items-center gap-1.5 shadow-xs"
            >
              <span>Rastrear nos Correios</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* 3. PENDING PIX OR CHECKOUT REOPEN BOX (IF NOT APPROVED) */}
      {!isApproved && order.paymentStatus !== "CANCELLED" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-500" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Finalizar Pagamento
              </h3>
            </div>
            <div className="text-xs font-bold text-rose-600 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Expira em: {formatTimer(timeLeft)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              {order.pixQrCodeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={order.pixQrCodeUrl}
                  alt="PIX QR Code"
                  className="w-56 h-56 rounded-xl shadow-md border-4 border-white dark:border-slate-700"
                />
              ) : (
                <div className="w-56 h-56 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-center p-4">
                  <div className="space-y-2">
                    <QrCode className="w-16 h-16 text-slate-400 mx-auto" />
                    <span className="text-[11px] font-bold text-slate-500">
                      Pague no Checkout Oficial Mercado Pago
                    </span>
                  </div>
                </div>
              )}
              <span className="text-[11px] font-bold text-slate-500 mt-3 text-center">
                Aponte a câmera do aplicativo do seu banco para pagar
              </span>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              {order.pixCopyPasteCode && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Código Pix Copia e Cola
                  </h4>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs break-all text-slate-700 dark:text-slate-300 max-h-24 overflow-y-auto">
                    {order.pixCopyPasteCode}
                  </div>
                </div>
              )}

              {order.pixCopyPasteCode && (
                <button
                  onClick={handleCopyPix}
                  className="w-full py-3 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:opacity-90 transition flex items-center justify-center gap-2 shadow"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Código Pix Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Código Pix</span>
                    </>
                  )}
                </button>
              )}

              {order.mercadoPagoUrl && (
                <a
                  href={order.mercadoPagoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-sky-500 hover:bg-sky-400 text-white transition flex items-center justify-center gap-2 shadow"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Pagar no Checkout Oficial Mercado Pago</span>
                </a>
              )}

              <p className="text-[11px] text-slate-500 text-center">
                Assim que você realizar o pagamento, nosso sistema identificará automaticamente em poucos segundos!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. ORDER ITEMS & PRICING SUMMARY */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-rose-500" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Itens Comprados ({order.items.length})
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Valor Total: R$ {order.total.toFixed(2).replace(".", ",")}
          </span>
        </div>

        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800/60 last:border-0"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl || "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400"}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {item.productName}
                  </h4>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tamanho: <span className="font-bold text-slate-700 dark:text-slate-300">{item.size}</span> • Cor: <span className="font-bold text-slate-700 dark:text-slate-300">{item.color}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Quantidade: {item.quantity} x R$ {item.price.toFixed(2).replace(".", ",")}
                  </div>
                </div>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
              </div>
            </div>
          ))}
        </div>

        {/* FINANCIAL SUMMARY */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Subtotal</span>
            <span>R$ {order.subtotal.toFixed(2).replace(".", ",")}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Desconto (Cupom: {order.couponCode || "Ativo"})</span>
              <span>- R$ {order.discount.toFixed(2).replace(".", ",")}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Frete ({order.shippingMethod})</span>
            <span>
              {order.shippingPrice === 0 ? "Grátis" : `R$ ${order.shippingPrice.toFixed(2).replace(".", ",")}`}
            </span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-800 text-base font-black text-slate-900 dark:text-white">
            <span>Total Pago</span>
            <span className="text-xl" style={{ color: cms.secondaryColor || "#e11d48" }}>
              R$ {order.total.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>
      </div>

      {/* 5. DELIVERY ADDRESS & CUSTOMER INFO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <MapPin className="w-4 h-4 text-rose-500" />
            <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white">
              Endereço de Entrega
            </h4>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong>{order.customerName}</strong><br />
            {order.shippingStreet}, Nº {order.shippingNumber}
            {order.shippingComplement ? ` - ${order.shippingComplement}` : ""}<br />
            {order.shippingNeighborhood} - {order.shippingCity}/{order.shippingState}<br />
            CEP: {order.shippingCep}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white">
              Contato & Data
            </h4>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p><strong>E-mail:</strong> {order.customerEmail}</p>
            <p><strong>Telefone/WhatsApp:</strong> {order.customerPhone}</p>
            <p><strong>Data da Compra:</strong> {new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>
      </div>

      {/* 6. WHATSAPP SUPPORT & TRACKING SHORTCUTS */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-slate-50 to-emerald-500/10 dark:from-emerald-950/20 dark:via-slate-900 dark:to-emerald-950/20 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-500" />
            <span>Precisa de ajuda com o seu pedido?</span>
          </h4>
          <p className="text-xs text-slate-500">
            Fale diretamente com nossa equipe no WhatsApp para tirar dúvidas sobre entrega ou pagamento.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-2 shadow"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Suporte WhatsApp</span>
          </a>
          <Link
            href="/meus-pedidos"
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 transition flex items-center gap-2 shadow"
          >
            <Package className="w-4 h-4" />
            <span>Meus Pedidos</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
