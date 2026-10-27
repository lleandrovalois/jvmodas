"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useCms } from "@/context/CmsContext";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Truck,
  Tag,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    cartCount,
    couponCode,
    couponDiscount,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { cms } = useCms();

  const [inputCoupon, setInputCoupon] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  if (!isCartOpen) return null;

  const threshold = cms.freeShippingThreshold || 199.0;
  const progress = Math.min(100, Math.round((subtotal / threshold) * 100));
  const remainingForFreeShipping = Math.max(0, threshold - subtotal);
  const total = Math.max(0, subtotal - couponDiscount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    const res = applyCoupon(inputCoupon);
    if (res.success) {
      setCouponFeedback({ type: "success", message: res.message });
      setInputCoupon("");
    } else {
      setCouponFeedback({ type: "error", message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between transform transition-all duration-300">
          
          {/* 1. HEADER */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Sua Sacola ({cartCount})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. FREE SHIPPING PROGRESS BAR */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
              <Truck className="w-4 h-4 text-emerald-500 shrink-0" />
              {subtotal >= threshold ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  🎉 Parabéns! Você ganhou Frete Grátis!
                </span>
              ) : (
                <span>
                  Faltam apenas{" "}
                  <strong className="text-rose-600 dark:text-rose-400">
                    R$ {remainingForFreeShipping.toFixed(2).replace(".", ",")}
                  </strong>{" "}
                  para <strong className="text-emerald-600">Frete Grátis</strong>
                </span>
              )}
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 3. ITEMS LIST */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100 dark:divide-slate-800">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                  Sua sacola está vazia
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">
                  Explore nossas coleções esportivas e encontre as peças perfeitas para seu treino.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 rounded-full font-bold text-sm bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:opacity-90 transition shadow-md"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.variantId} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.productName}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.variantId)}
                          className="text-slate-400 hover:text-rose-500 transition p-1"
                          title="Remover produto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Variant Badges */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          Tam: {item.size}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-slate-300"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <span>{item.color}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Quantity Controls */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                          disabled={item.quantity >= item.maxStock}
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-slate-900 dark:text-white">
                          R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-[10px] text-slate-400">
                            R$ {item.price.toFixed(2).replace(".", ",")} cada
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 4. FOOTER & CHECKOUT */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
              
              {/* Coupon Section */}
              <div>
                {couponCode ? (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Cupom <strong>{couponCode}</strong> aplicado! (-R$ {couponDiscount.toFixed(2).replace(".", ",")})</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-emerald-700 hover:text-rose-600 text-[11px] underline font-bold"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={inputCoupon}
                        onChange={(e) => setInputCoupon(e.target.value)}
                        placeholder="Cupom (ex: JV10)"
                        className="w-full pl-9 pr-3 py-2 text-xs uppercase font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 transition"
                    >
                      Aplicar
                    </button>
                  </form>
                )}

                {couponFeedback.type && (
                  <div
                    className={`mt-1.5 text-[11px] flex items-center gap-1 font-semibold ${
                      couponFeedback.type === "success" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {couponFeedback.type === "success" ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    <span>{couponFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Subtotal and Total */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Desconto do Cupom</span>
                    <span>- R$ {couponDiscount.toFixed(2).replace(".", ",")}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Frete</span>
                  <span>
                    {subtotal >= threshold ? (
                      <span className="text-emerald-600 font-bold">Grátis</span>
                    ) : (
                      "Calculado no checkout"
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total Estimado</span>
                  <span>R$ {total.toFixed(2).replace(".", ",")}</span>
                </div>
                <p className="text-[11px] text-slate-400 text-right">
                  Ou até 12x de R$ {(total / 12).toFixed(2).replace(".", ",")} sem juros
                </p>
              </div>

              {/* Checkout Button */}
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3.5 px-4 rounded-xl text-center font-black text-sm uppercase tracking-wider text-white shadow-lg hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 group"
                style={{ backgroundColor: cms.secondaryColor || "#e11d48" }}
              >
                <span>Finalizar Compra</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
