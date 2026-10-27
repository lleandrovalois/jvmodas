"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem } from "@/types";

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  cartCount: number;
  couponCode: string;
  setCouponCode: (code: string) => void;
  couponDiscount: number;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType>({
  cart: [],
  isCartOpen: false,
  setIsCartOpen: () => {},
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  subtotal: 0,
  cartCount: 0,
  couponCode: "",
  setCouponCode: () => {},
  couponDiscount: 0,
  applyCoupon: () => ({ success: false, message: "" }),
  removeCoupon: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponPercent, setCouponPercent] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem("jvmodas_cart");
      if (saved) {
        setCart(JSON.parse(saved));
      }
      const savedCoupon = localStorage.getItem("jvmodas_coupon");
      if (savedCoupon) {
        const { code, percent } = JSON.parse(savedCoupon);
        setCouponCode(code);
        setCouponPercent(percent);
      }
    } catch (e) {
      console.error("Failed to load cart from storage", e);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem("jvmodas_cart", JSON.stringify(cart));
      } catch (e) {
        console.error("Failed to save cart to storage", e);
      }
    }
  }, [cart, isMounted]);

  const addToCart = (newItem: CartItem) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.variantId === newItem.variantId);
      if (existingIndex > -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = Math.min(existing.quantity + newItem.quantity, newItem.maxStock);
        updated[existingIndex] = { ...existing, quantity: newQty };
        return updated;
      }
      return [...prev, newItem];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.variantId === variantId) {
          return { ...item, quantity: Math.min(quantity, item.maxStock) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode("");
    setCouponPercent(0);
    localStorage.removeItem("jvmodas_cart");
    localStorage.removeItem("jvmodas_coupon");
  };

  const applyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === "JV10") {
      setCouponCode(clean);
      setCouponPercent(0.1);
      localStorage.setItem("jvmodas_coupon", JSON.stringify({ code: clean, percent: 0.1 }));
      return { success: true, message: "Cupom JV10 aplicado! 10% de desconto adicionado." };
    }
    if (clean === "PRIMEIRACOMPRA") {
      setCouponCode(clean);
      setCouponPercent(0.15);
      localStorage.setItem("jvmodas_coupon", JSON.stringify({ code: clean, percent: 0.15 }));
      return { success: true, message: "Cupom PRIMEIRACOMPRA aplicado! 15% de desconto adicionado." };
    }
    if (clean === "FITNESS20") {
      setCouponCode(clean);
      setCouponPercent(0.2);
      localStorage.setItem("jvmodas_coupon", JSON.stringify({ code: clean, percent: 0.2 }));
      return { success: true, message: "Cupom FITNESS20 aplicado! 20% de desconto adicionado." };
    }
    return { success: false, message: "Cupom inválido ou expirado." };
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponPercent(0);
    localStorage.removeItem("jvmodas_coupon");
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const couponDiscount = subtotal * couponPercent;

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        cartCount,
        couponCode,
        setCouponCode,
        couponDiscount,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
