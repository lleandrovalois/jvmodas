"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useCms } from "@/context/CmsContext";
import {
  ShieldCheck,
  ShoppingBag,
  ArrowLeft,
  Truck,
  CreditCard,
  QrCode,
  CheckCircle2,
  Lock,
  Tag,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  HelpCircle,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    subtotal,
    couponCode,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useCart();
  const { cms } = useCms();

  // Form states
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
  });

  const [shipping, setShipping] = useState({
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    method: "PAC",
    price: 14.9,
  });

  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [card, setCard] = useState({
    number: "",
    holderName: "",
    expiry: "",
    cvv: "",
    installments: 1,
  });

  const [couponInput, setCouponInput] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const threshold = cms.freeShippingThreshold || 199.0;
  const isFreeShipping = subtotal >= threshold;

  // Set default shipping method
  useEffect(() => {
    if (isFreeShipping) {
      setShipping((prev) => ({
        ...prev,
        method: "Frete Grátis",
        price: 0.0,
      }));
    } else {
      setShipping((prev) => ({
        ...prev,
        method: prev.method === "Frete Grátis" ? "PAC" : prev.method,
        price: prev.method === "SEDEX" ? 26.5 : 14.9,
      }));
    }
  }, [subtotal, isFreeShipping]);

  // Mask inputs
  const formatCPF = (val: string) => {
    return val
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  };

  const formatPhone = (val: string) => {
    return val
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{4})$/, "$1-$2")
      .slice(0, 15);
  };

  const formatCEP = (val: string) => {
    return val
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 9);
  };

  const formatCardNumber = (val: string) => {
    return val
      .replace(/\D/g, "")
      .replace(/(\d{4})(\d)/, "$1 $2")
      .replace(/(\d{4})(\d)/, "$1 $2")
      .replace(/(\d{4})(\d)/, "$1 $2")
      .slice(0, 19);
  };

  const formatExpiry = (val: string) => {
    return val
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .slice(0, 5);
  };

  // Auto-complete address via ViaCEP
  const handleCepBlur = async () => {
    const rawCep = shipping.cep.replace(/\D/g, "");
    if (rawCep.length !== 8) return;

    setLoadingCep(true);
    setCepError("");

    try {
      const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await res.json();

      if (data.erro) {
        setCepError("CEP não encontrado. Por favor, digite o endereço manualmente.");
      } else {
        setShipping((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch {
      setCepError("Erro ao consultar CEP. Preencha os campos manualmente.");
    } finally {
      setLoadingCep(false);
    }
  };

  const total = Math.max(0, subtotal - couponDiscount + shipping.price);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (cart.length === 0) {
      setSubmitError("Seu carrinho está vazio.");
      return;
    }

    if (!customer.name || !customer.email || !customer.cpf || !customer.phone) {
      setSubmitError("Por favor, preencha todos os dados pessoais.");
      return;
    }

    if (!shipping.cep || !shipping.street || !shipping.number || !shipping.city) {
      setSubmitError("Por favor, preencha todos os dados de entrega.");
      return;
    }

    if (paymentMethod === "CREDIT_CARD") {
      const cleanCard = card.number.replace(/\D/g, "");
      if (cleanCard.length < 15) {
        setSubmitError("Número de cartão de crédito inválido.");
        return;
      }
      if (!card.holderName || card.expiry.length < 5 || card.cvv.length < 3) {
        setSubmitError("Preencha todos os dados do cartão de crédito corretamente.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          shipping,
          payment: {
            method: paymentMethod,
            card: paymentMethod === "CREDIT_CARD" ? card : undefined,
          },
          items: cart,
          couponCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar checkout.");
      }

      // Clear cart and redirect to order confirmed page
      clearCart();
      router.push(`/order-confirmed/${data.orderId}`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Ocorreu um erro ao finalizar o pedido.");
      setSubmitting(false);
    }
  };

  if (cart.length === 0 && !submitting) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Seu carrinho está vazio
        </h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          Adicione produtos incríveis da coleção JVMODAS antes de prosseguir para o checkout.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md"
        >
          Voltar para a Loja
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      
      {/* 1. TOP HEADER */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para a Loja</span>
          </Link>

          <Link href="/" className="flex items-center gap-1.5 font-black text-xl tracking-tight">
            <span style={{ color: cms.secondaryColor || "#e11d48" }}>JV</span>
            <span>MODAS</span>
          </Link>

          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Checkout 100% Seguro</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN CHECKOUT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: FORM (7 Cols) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
            
            {submitError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* SECTION 1: PERSONAL DATA */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h3 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  Dados Pessoais
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    placeholder="Ex: Amanda Silva Castro"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    E-mail (para confirmação e rastreio) *
                  </label>
                  <input
                    type="email"
                    required
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    placeholder="amanda@exemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    CPF (Nota Fiscal) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.cpf}
                    onChange={(e) => setCustomer({ ...customer, cpf: formatCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    WhatsApp (com DDD) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: formatPhone(e.target.value) })}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: DELIVERY ADDRESS (VIACEP) */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h3 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  Endereço de Entrega
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    CEP *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={shipping.cep}
                      onChange={(e) => setShipping({ ...shipping, cep: formatCEP(e.target.value) })}
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                    {loadingCep && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-rose-500" />
                    )}
                  </div>
                  {cepError && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{cepError}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Rua / Avenida *
                  </label>
                  <input
                    type="text"
                    required
                    value={shipping.street}
                    onChange={(e) => setShipping({ ...shipping, street: e.target.value })}
                    placeholder="Ex: Av. Paulista"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={shipping.number}
                    onChange={(e) => setShipping({ ...shipping, number: e.target.value })}
                    placeholder="123"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={shipping.complement}
                    onChange={(e) => setShipping({ ...shipping, complement: e.target.value })}
                    placeholder="Apto 42, Bloco B"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    required
                    value={shipping.neighborhood}
                    onChange={(e) => setShipping({ ...shipping, neighborhood: e.target.value })}
                    placeholder="Bela Vista"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    placeholder="São Paulo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    UF / Estado *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={shipping.state}
                    onChange={(e) => setShipping({ ...shipping, state: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {/* SHIPPING METHOD SELECTION */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Opções de Envio Disponíveis:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {isFreeShipping ? (
                    <label
                      className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
                        shipping.method === "Frete Grátis"
                          ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="shipping"
                          checked={shipping.method === "Frete Grátis"}
                          onChange={() => setShipping({ ...shipping, method: "Frete Grátis", price: 0 })}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            Frete Grátis (Promocional)
                          </div>
                          <div className="text-[11px] text-slate-500">4 a 7 dias úteis</div>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-600">GRÁTIS</span>
                    </label>
                  ) : (
                    <label
                      className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
                        shipping.method === "PAC"
                          ? "border-rose-500 bg-rose-50/30 dark:bg-rose-950/20"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="shipping"
                          checked={shipping.method === "PAC"}
                          onChange={() => setShipping({ ...shipping, method: "PAC", price: 14.9 })}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            PAC Econômico
                          </div>
                          <div className="text-[11px] text-slate-500">5 a 8 dias úteis</div>
                        </div>
                      </div>
                      <span className="text-xs font-black">R$ 14,90</span>
                    </label>
                  )}

                  <label
                    className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
                      shipping.method === "SEDEX"
                        ? "border-rose-500 bg-rose-50/30 dark:bg-rose-950/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shipping.method === "SEDEX"}
                        onChange={() => setShipping({ ...shipping, method: "SEDEX", price: 26.5 })}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">
                          SEDEX Expresso
                        </div>
                        <div className="text-[11px] text-slate-500">1 a 3 dias úteis</div>
                      </div>
                    </div>
                    <span className="text-xs font-black">R$ 26,50</span>
                  </label>
                </div>
              </div>
            </div>

            {/* SECTION 3: PAYMENT METHOD */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black flex items-center justify-center">
                  3
                </span>
                <h3 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  Forma de Pagamento
                </h3>
              </div>

              {/* Payment Tabs */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("PIX")}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition ${
                    paymentMethod === "PIX"
                      ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <QrCode className="w-6 h-6 text-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    PIX Instantâneo
                  </span>
                  <span className="text-[10px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full">
                    Aprovação Imediata
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("CREDIT_CARD")}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition ${
                    paymentMethod === "CREDIT_CARD"
                      ? "border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-rose-500" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Cartão de Crédito
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    Até 12x Sem Juros
                  </span>
                </button>
              </div>

              {/* PIX DETAILS ACCORDION */}
              {paymentMethod === "PIX" && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2 text-xs text-emerald-900 dark:text-emerald-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Como funciona o pagamento via PIX:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Ao clicar em <strong>"Concluir Pedido"</strong>, geraremos seu QR Code oficial e código Copia e Cola. O sistema reconhecerá seu pagamento em tempo real sem você precisar enviar comprovante!
                  </p>
                </div>
              )}

              {/* CREDIT CARD FORM */}
              {paymentMethod === "CREDIT_CARD" && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Número do Cartão *
                    </label>
                    <input
                      type="text"
                      required={paymentMethod === "CREDIT_CARD"}
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                      placeholder="0000 0000 0000 0000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Nome impresso no Cartão *
                    </label>
                    <input
                      type="text"
                      required={paymentMethod === "CREDIT_CARD"}
                      value={card.holderName}
                      onChange={(e) => setCard({ ...card, holderName: e.target.value.toUpperCase() })}
                      placeholder="AMANDA S CASTRO"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Validade (MM/AA) *
                      </label>
                      <input
                        type="text"
                        required={paymentMethod === "CREDIT_CARD"}
                        value={card.expiry}
                        onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                        placeholder="12/28"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        CVV (3 ou 4 dígitos) *
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        required={paymentMethod === "CREDIT_CARD"}
                        value={card.cvv}
                        onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "") })}
                        placeholder="123"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-mono"
                      />
                    </div>
                  </div>

                  {/* Installments Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Opções de Parcelamento *
                    </label>
                    <select
                      value={card.installments}
                      onChange={(e) => setCard({ ...card, installments: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-bold"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((inst) => {
                        const installmentValue = (total / inst).toFixed(2).replace(".", ",");
                        return (
                          <option key={inst} value={inst}>
                            {inst}x de R$ {installmentValue} sem juros (Total: R$ {total.toFixed(2).replace(".", ",")})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider text-white shadow-xl hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: cms.secondaryColor || "#e11d48" }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processando seu Pedido...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Concluir Pedido • R$ {total.toFixed(2).replace(".", ",")}</span>
                </>
              )}
            </button>
          </form>

          {/* RIGHT COLUMN: ORDER SUMMARY (5 Cols) */}
          <div className="lg:col-span-5 sticky top-24 space-y-6">
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <h3 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Resumo do Pedido ({cart.length} {cart.length === 1 ? "item" : "itens"})
              </h3>

              {/* Items List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
                {cart.map((item) => (
                  <div key={item.variantId} className="py-3 first:pt-0 last:pb-0 flex gap-3">
                    <div className="w-16 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between text-xs">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.productName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-slate-500">
                          <span>Tam: <strong>{item.size}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full border border-slate-300"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            {item.color}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-slate-400">Qtd: {item.quantity}</span>
                        <span className="text-slate-900 dark:text-white">
                          R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon input */}
              <div className="pt-2">
                {couponCode ? (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      Cupom <strong>{couponCode}</strong> ativo
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-rose-600 hover:underline text-[11px]"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Cupom de desconto"
                      className="w-full px-3 py-2 text-xs uppercase font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        applyCoupon(couponInput);
                        setCouponInput("");
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Desconto</span>
                    <span>- R$ {couponDiscount.toFixed(2).replace(".", ",")}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Frete ({shipping.method})</span>
                  <span>
                    {shipping.price === 0 ? (
                      <strong className="text-emerald-600">GRÁTIS</strong>
                    ) : (
                      `R$ ${shipping.price.toFixed(2).replace(".", ",")}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-950 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>

              {/* Security info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Garantia de Satisfação JVMODAS</span>
                </div>
                <p>
                  Sua compra possui código de rastreio em tempo real e direito à 1ª troca grátis em até 30 dias.
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
