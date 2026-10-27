"use client";

import React, { useEffect, useState, use } from "react";
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
  Zap,
  Package,
  ExternalLink,
} from "lucide-react";

export default function OrderConfirmedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { cms } = useCms();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes

  // Fetch order
  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        if (data.paymentStatus === "APPROVED") {
          // Trigger confetti if newly approved
          confetti({
            particleCount: 100,
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

    // Polling every 3.5 seconds if status is PENDING to listen for webhook/simulated approval
    const interval = setInterval(() => {
      fetchOrder();
    }, 3500);

    return () => clearInterval(interval);
  }, [id]);

  // Countdown timer for PIX
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

  // Simulate payment approval (test webhook)
  const handleSimulatePayment = async () => {
    setSimulating(true);
    try {
      const res = await fetch("/api/webhook/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });
      if (res.ok) {
        await fetchOrder();
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 },
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Carregando detalhes do seu pedido...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Pedido não encontrado
        </h2>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-white"
        >
          Voltar para a Loja
        </Link>
      </div>
    );
  }

  const isApproved = order.paymentStatus === "APPROVED" || order.paymentStatus === "SHIPPED";

  // Pre-formatted WhatsApp support message
  const cleanPhone = (cms.whatsappNumber || "5511999998888").replace(/\D/g, "");
  const whatsappMsg = `Olá, equipe JVMODAS! Acabei de realizar o pedido *${order.id}* no valor de R$ ${order.total
    .toFixed(2)
    .replace(".", ",")}. Seguem os dados para acompanhamento:
- Cliente: ${order.customerName}
- Status: ${isApproved ? "Pagamento Aprovado" : "Aguardando Confirmação PIX"}
- Envio: ${order.shippingCity}/${order.shippingState}`;

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      
      {/* Top Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-tight">
            <span style={{ color: cms.secondaryColor || "#e11d48" }}>JV</span>
            <span>MODAS</span>
          </Link>
          <span className="text-xs font-bold text-slate-500">
            Pedido #{order.id}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-8">
        
        {/* 1. STATUS BANNER */}
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-sm text-center space-y-3 ${
            isApproved
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
          }`}
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md ${
              isApproved ? "bg-emerald-500 text-white" : "bg-amber-500 text-white animate-pulse"
            }`}
          >
            {isApproved ? (
              <CheckCircle2 className="w-10 h-10" />
            ) : (
              <Clock className="w-9 h-9" />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {isApproved
              ? "🎉 Pagamento Confirmado com Sucesso!"
              : "Aguardando Pagamento do PIX"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
            {isApproved
              ? `Obrigado por comprar na JVMODAS, ${order.customerName}! Seu pedido já está sendo preparado com muito carinho pela nossa equipe de expedição.`
              : `Finalize seu pedido efetuando o pagamento do PIX com o QR Code ou código abaixo. O sistema aprovará seu pedido automaticamente!`}
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mt-2">
            <span>Status Atual:</span>
            <span
              className={`font-black uppercase tracking-wider ${
                isApproved ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {order.paymentStatus === "APPROVED"
                ? "Aprovado"
                : order.paymentStatus === "SHIPPED"
                ? "Enviado"
                : "Pendente"}
            </span>
          </div>
        </div>

        {/* 2. PIX PAYMENT BOX (IF PENDING) */}
        {!isApproved && order.paymentMethod === "PIX" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Pague com PIX para Aprovação Instantânea
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
                  <div className="w-56 h-56 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-slate-400" />
                  </div>
                )}
                <span className="text-[11px] font-bold text-slate-500 mt-3 text-center">
                  Abra o app do seu banco e aponte a câmera para o QR Code
                </span>
              </div>

              {/* Instructions and Copy-Paste Code */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Código Pix Copia e Cola
                  </h4>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs break-all text-slate-700 dark:text-slate-300 max-h-24 overflow-y-auto">
                    {order.pixCopyPasteCode || "Código PIX gerado"}
                  </div>
                </div>

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

                {/* Simulation button for demo */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleSimulatePayment}
                    disabled={simulating}
                    className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>
                      {simulating
                        ? "Processando aprovação..."
                        : "Simular Pagamento no Banco (Aprovar Imediatamente)"}
                    </span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-1">
                    Ambiente de teste: Este botão aciona o webhook para aprovação instantânea.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. ORDER ITEMS & SUMMARY */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-rose-500" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Itens do Pedido ({order.items.length})
              </h3>
            </div>
            {order.trackingCode && (
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                Rastreio: <strong>{order.trackingCode}</strong>
              </div>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex gap-4 items-center">
                <div className="w-14 h-18 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {item.productName}
                    </h4>
                    <div className="text-slate-500 mt-0.5">
                      Tamanho: <strong>{item.size}</strong> | Cor: <strong>{item.color}</strong>
                    </div>
                    <div className="text-slate-400 mt-0.5">Qtd: {item.quantity}</div>
                  </div>
                  <div className="font-black text-sm text-slate-900 dark:text-white">
                    R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>R$ {order.subtotal.toFixed(2).replace(".", ",")}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Desconto ({order.couponCode || "Cupom"})</span>
                <span>- R$ {order.discount.toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Frete ({order.shippingMethod})</span>
              <span>
                {order.shippingPrice === 0
                  ? "GRÁTIS"
                  : `R$ ${order.shippingPrice.toFixed(2).replace(".", ",")}`}
              </span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-950 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Valor Total Pago</span>
              <span>R$ {order.total.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>
        </div>

        {/* 4. DELIVERY DETAILS & WHATSAPP SUPPORT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Address */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 text-xs">
            <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white mb-2">
              <Truck className="w-4 h-4 text-rose-500" />
              <span>Endereço de Entrega</span>
            </div>
            <p className="font-bold text-slate-800 dark:text-slate-200">{order.customerName}</p>
            <p className="text-slate-500">
              {order.shippingStreet}, {order.shippingNumber}
              {order.shippingComplement ? ` - ${order.shippingComplement}` : ""}
            </p>
            <p className="text-slate-500">
              {order.shippingNeighborhood} - {order.shippingCity}/{order.shippingState}
            </p>
            <p className="text-slate-500">CEP: {order.shippingCep}</p>
          </div>

          {/* WhatsApp Support CTA */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 font-black text-sm mb-1">
                <MessageCircle className="w-5 h-5" />
                <span>Atendimento no WhatsApp</span>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Deseja falar com nossa equipe ou acompanhar o rastreio diretamente pelo WhatsApp?
              </p>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs uppercase tracking-wider text-center shadow transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Acompanhar pelo WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Back to Home Button */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Continuar Comprando na Loja</span>
          </Link>
        </div>

      </main>
    </div>
  );
}
