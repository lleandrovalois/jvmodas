"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
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
  ExternalLink,
  Loader2,
  Sparkles,
  Wallet,
} from "lucide-react";
import { MercadoPagoModal } from "@/components/MercadoPagoModal";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago: any;
  }
}

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

  const [couponInput, setCouponInput] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [sdkReady, setSdkReady] = useState(false);

  // Modal payment state
  const [createdOrder, setCreatedOrder] = useState<{
    orderId: string;
    preferenceId: string;
    initPoint: string;
    publicKey: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Open Mercado Pago Checkout Modal
  const openMercadoPagoModal = (preferenceId: string, publicKey: string, initPoint: string) => {
    if (typeof window !== "undefined" && window.MercadoPago) {
      try {
        const mp = new window.MercadoPago(publicKey, {
          locale: "pt-BR",
        });

        mp.checkout({
          preference: {
            id: preferenceId,
          },
          autoOpen: true,
        });
        return true;
      } catch (err) {
        console.warn("Mercado Pago autoOpen error, falling back to redirect:", err);
      }
    }
    // Fallback: direct redirect
    window.location.href = initPoint;
    return false;
  };

  // Submit Checkout & Create Preference
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (cart.length === 0) {
      setSubmitError("Seu carrinho está vazio.");
      return;
    }

    if (!customer.name.trim() || !customer.email.trim() || !customer.cpf.trim() || !customer.phone.trim()) {
      setSubmitError("Por favor, preencha todos os seus dados pessoais para emitir a nota e processar a compra.");
      return;
    }

    const cleanCpf = customer.cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      setSubmitError("Por favor, informe um CPF válido com 11 dígitos.");
      return;
    }

    if (!shipping.cep || !shipping.street || !shipping.number || !shipping.city || !shipping.state) {
      setSubmitError("Por favor, preencha todos os dados de entrega.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          shipping,
          items: cart,
          couponCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar checkout.");
      }

      // Save order details to state
      setCreatedOrder({
        orderId: data.orderId,
        preferenceId: data.preferenceId,
        initPoint: data.initPoint,
        publicKey: data.publicKey,
      });

      // Clear local cart
      clearCart();

      // Launch Modal directly without redirecting to a new tab
      setIsModalOpen(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Ocorreu um erro ao finalizar o pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0 && !createdOrder) {
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
    <>
      {/* Official Mercado Pago SDK v2 */}
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
        
        {/* TOP BAR */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para a Loja</span>
            </Link>

            <Link href="/" className="font-black text-xl tracking-tight">
              <span style={{ color: cms.secondaryColor || "#e11d48" }}>JV</span>
              <span>MODAS</span>
            </Link>

            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-black">
              <Lock className="w-3.5 h-3.5" />
              <span>Checkout Seguro</span>
            </div>
          </div>
        </header>

        {/* MODAL OPENED BANNER (WHEN ORDER IS CREATED) */}
        {createdOrder && (
          <div className="max-w-5xl mx-auto px-4 pt-6">
            <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800 shadow-md space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Pedido Criado: #{createdOrder.orderId}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
                Conclua seu pagamento com segurança via PIX ou Cartão no modal oficial do Mercado Pago.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-sky-500 hover:bg-sky-400 text-white shadow-md flex items-center gap-2 transition"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Abrir Pagamento Mercado Pago</span>
                </button>
                <Link
                  href={`/pedido/sucesso?external_reference=${createdOrder.orderId}&status=pending`}
                  className="px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md transition"
                >
                  Acompanhar Meu Pedido
                </Link>
              </div>
            </div>
          </div>
        )}

        <main className="max-w-5xl mx-auto px-4 pt-8">
          <form onSubmit={handleOrderSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: FORM DETAILS (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* SECTION 1: PERSONAL DATA */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black flex items-center justify-center">
                    1
                  </span>
                  <h3 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                    Dados do Comprador
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      placeholder="Ex: Gabriela Souza Lima"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        required
                        value={customer.email}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        placeholder="seu@email.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        CPF (Para emissão da NF) *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.cpf}
                        onChange={(e) => setCustomer({ ...customer, cpf: formatCPF(e.target.value) })}
                        placeholder="000.000.000-00"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      WhatsApp / Celular com DDD *
                    </label>
                    <input
                      type="text"
                      required
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: formatPhone(e.target.value) })}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: SHIPPING ADDRESS */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black flex items-center justify-center">
                    2
                  </span>
                  <h3 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                    Endereço de Entrega
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
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
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-mono"
                        />
                        {loadingCep && (
                          <Loader2 className="w-4 h-4 text-rose-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                      {cepError && (
                        <p className="text-[11px] text-rose-500 mt-1">{cepError}</p>
                      )}
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
                        placeholder="Bairro"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Rua / Avenida *
                      </label>
                      <input
                        type="text"
                        required
                        value={shipping.street}
                        onChange={(e) => setShipping({ ...shipping, street: e.target.value })}
                        placeholder="Nome da sua rua"
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Complemento (Opcional)
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
                        Cidade *
                      </label>
                      <input
                        type="text"
                        required
                        value={shipping.city}
                        onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                        placeholder="Cidade"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Estado (UF) *
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        required
                        value={shipping.state}
                        onChange={(e) => setShipping({ ...shipping, state: e.target.value.toUpperCase() })}
                        placeholder="SP"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 uppercase"
                      />
                    </div>
                  </div>

                  {/* SHIPPING OPTIONS */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Opção de Envio:
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
              </div>

              {/* SECTION 3: MERCADO PAGO CHECKOUT PRO (SECURE MODAL - NO MANUAL SENSITIVE FIELDS) */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black flex items-center justify-center">
                    3
                  </span>
                  <h3 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                    Pagamento Seguro Mercado Pago
                  </h3>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sky-50/50 via-slate-50 to-indigo-50/40 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-sky-950/30 border border-sky-200/70 dark:border-sky-900/40 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-sky-500 text-white shadow-sm shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                        Checkout Pro 100% Protegido
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                        Ao clicar em <strong>CONCLUIR PEDIDO</strong>, abrirá a janela oficial do Mercado Pago para você escolher livremente entre:
                      </p>
                    </div>
                  </div>

                  {/* Payment Options Supported within Mercado Pago */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-1">
                      <QrCode className="w-5 h-5 text-emerald-500 mx-auto" />
                      <div className="text-[11px] font-black text-slate-800 dark:text-slate-200">PIX</div>
                      <div className="text-[9px] text-emerald-600 font-bold">Aprovação 24h</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-1">
                      <CreditCard className="w-5 h-5 text-rose-500 mx-auto" />
                      <div className="text-[11px] font-black text-slate-800 dark:text-slate-200">Cartão</div>
                      <div className="text-[9px] text-slate-500">Até 12x</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-1">
                      <Wallet className="w-5 h-5 text-sky-500 mx-auto" />
                      <div className="text-[11px] font-black text-slate-800 dark:text-slate-200">Saldo MP</div>
                      <div className="text-[9px] text-slate-500">Em 1 Clique</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-1">
                      <Tag className="w-5 h-5 text-amber-500 mx-auto" />
                      <div className="text-[11px] font-black text-slate-800 dark:text-slate-200">Boleto</div>
                      <div className="text-[9px] text-slate-500">Bancário</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="flex items-center gap-1 font-semibold">
                      <Lock className="w-3 h-3 text-emerald-500" /> Criptografia de Ponta a Ponta
                    </span>
                    <span>Zero dados de cartão retidos na loja</span>
                  </div>
                </div>

                {submitError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY (5 COLS) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 sticky top-24">
                <h3 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>Resumo do Pedido</span>
                  <span className="text-xs font-bold text-slate-500">
                    {cart.reduce((acc, i) => acc + i.quantity, 0)} itens
                  </span>
                </h3>

                {/* ITEMS LIST */}
                <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.variantId}
                      className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800/60 last:border-0"
                    >
                      <div className="w-14 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0 border border-slate-200 dark:border-slate-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl || "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400"}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[9px] font-black px-1.5 py-0.5 rounded-tl-lg">
                          x{item.quantity}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {item.productName}
                        </h4>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Tam: {item.size} • Cor: {item.color}
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                          R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* COUPON SECTION */}
                <div className="pt-2">
                  {couponCode ? (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Cupom {couponCode} aplicado!</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-rose-500 font-bold hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Cupom (ex: JV10)"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs focus:outline-none uppercase font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (couponInput) {
                            applyCoupon(couponInput);
                            setCouponInput("");
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition"
                      >
                        Aplicar
                      </button>
                    </div>
                  )}
                </div>

                {/* TOTALS */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Desconto</span>
                      <span>- R$ {couponDiscount.toFixed(2).replace(".", ",")}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Frete ({shipping.method})</span>
                    <span>
                      {shipping.price === 0 ? (
                        <strong className="text-emerald-600 uppercase">Grátis</strong>
                      ) : (
                        `R$ ${shipping.price.toFixed(2).replace(".", ",")}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-800 text-base font-black text-slate-900 dark:text-white">
                    <span>Total</span>
                    <span className="text-xl sm:text-2xl" style={{ color: cms.secondaryColor || "#e11d48" }}>
                      R$ {total.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 text-right">
                    ou em até 12x no cartão de crédito via Mercado Pago
                  </div>
                </div>

                {/* CONCLUIR PEDIDO BUTTON */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider text-white shadow-lg transition-all transform active:scale-98 flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 cursor-pointer"
                  style={{
                    backgroundColor: cms.secondaryColor || "#e11d48",
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Conectando ao Mercado Pago...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>CONCLUIR PEDIDO & PAGAR</span>
                    </>
                  )}
                </button>

                <div className="text-center">
                  <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Ambiente Oficial Seguro Mercado Pago
                  </span>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>

      {/* MERCADO PAGO MODAL CHECKOUT */}
      {createdOrder && (
        <MercadoPagoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          orderId={createdOrder.orderId}
          preferenceId={createdOrder.preferenceId}
          initPoint={createdOrder.initPoint}
          publicKey={createdOrder.publicKey}
          total={total}
          customer={customer}
        />
      )}
    </>
  );
}
