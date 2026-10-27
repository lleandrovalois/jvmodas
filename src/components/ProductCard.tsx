"use client";

import React, { useState } from "react";
import { Product, ProductVariant } from "@/types";
import { useCms } from "@/context/CmsContext";
import { useCart } from "@/context/CartContext";
import { Star, ShoppingBag, Eye, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export function ProductCard({
  product,
  onQuickView,
}: {
  product: Product;
  onQuickView: (product: Product) => void;
}) {
  const { cms } = useCms();
  const { addToCart } = useCart();
  const router = useRouter();

  // Parse images
  let imagesList: string[] = [];
  try {
    imagesList = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
  } catch {
    imagesList = [product.images as unknown as string];
  }
  const mainImage = imagesList[0] || "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=600";
  const hoverImage = imagesList[1] || mainImage;

  // Extract unique colors from variants
  const uniqueColorsMap = new Map<string, { color: string; colorHex: string }>();
  (product.variants || []).forEach((v) => {
    if (!uniqueColorsMap.has(v.color)) {
      uniqueColorsMap.set(v.color, { color: v.color, colorHex: v.colorHex });
    }
  });
  const colors = Array.from(uniqueColorsMap.values());
  const [selectedColor, setSelectedColor] = useState(colors[0]?.color || "");

  // Calculate discount percentage
  const discountPercent =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  // Handle direct buy
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Pick first available variant matching selected color, or first variant with stock
    const matchingVariant =
      product.variants.find((v) => v.color === selectedColor && v.stock > 0) ||
      product.variants.find((v) => v.stock > 0);

    if (matchingVariant) {
      addToCart({
        id: matchingVariant.id,
        productId: product.id,
        variantId: matchingVariant.id,
        productName: product.name,
        productSlug: product.slug,
        imageUrl: mainImage,
        size: matchingVariant.size,
        color: matchingVariant.color,
        colorHex: matchingVariant.colorHex,
        price: product.price,
        originalPrice: product.originalPrice,
        quantity: 1,
        maxStock: matchingVariant.stock,
      });
    } else {
      onQuickView(product);
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const matchingVariant =
      product.variants.find((v) => v.color === selectedColor && v.stock > 0) ||
      product.variants.find((v) => v.stock > 0);

    if (matchingVariant) {
      addToCart({
        id: matchingVariant.id,
        productId: product.id,
        variantId: matchingVariant.id,
        productName: product.name,
        productSlug: product.slug,
        imageUrl: mainImage,
        size: matchingVariant.size,
        color: matchingVariant.color,
        colorHex: matchingVariant.colorHex,
        price: product.price,
        originalPrice: product.originalPrice,
        quantity: 1,
        maxStock: matchingVariant.stock,
      });
      router.push("/checkout");
    } else {
      onQuickView(product);
    }
  };

  return (
    <div
      onClick={() => onQuickView(product)}
      className="group relative rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "rgba(148, 163, 184, 0.2)",
        color: "var(--text-primary)",
      }}
    >
      {/* 1. IMAGE CONTAINER WITH HOVER EFFECT */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {/* Main Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-105 group-hover:opacity-0"
        />

        {/* Hover Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hoverImage}
          alt={`${product.name} costas`}
          className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-500 scale-100 group-hover:scale-105 opacity-0 group-hover:opacity-100"
        />

        {/* Badges on Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.badge && (
            <span
              className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider text-white shadow-sm"
              style={{ backgroundColor: cms.secondaryColor || "#e11d48" }}
            >
              {product.badge}
            </span>
          )}
          {discountPercent && (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm">
              -{discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Quick View Button on Hover */}
        <div className="absolute inset-x-3 bottom-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="flex-1 py-2.5 px-3 rounded-xl backdrop-blur-md font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:brightness-95 transition"
            style={{
              backgroundColor: "var(--card-bg)",
              color: "var(--text-primary)",
              border: "1px solid rgba(148, 163, 184, 0.25)",
            }}
          >
            <Eye className="w-4 h-4" />
            <span>Ver Detalhes</span>
          </button>
          <button
            onClick={handleQuickAdd}
            className="p-2.5 rounded-xl shadow-md hover:brightness-110 active:scale-95 transition"
            style={{
              backgroundColor: cms.secondaryColor || "#e11d48",
              color: cms.buttonTextColor || "#ffffff",
            }}
            title="Adicionar à Sacola"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. PRODUCT INFO */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="uppercase font-bold tracking-wider">{product.category}</span>
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3
            className="text-sm font-extrabold line-clamp-2 transition-colors"
            style={{ color: "var(--text-primary)" }}
          >
            {product.name}
          </h3>

          {/* Color Swatches */}
          {colors.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              {colors.map((c) => (
                <button
                  key={c.color}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColor(c.color);
                  }}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    selectedColor === c.color
                      ? "ring-2 ring-rose-500 ring-offset-1 scale-110"
                      : "border-slate-300 hover:scale-110"
                  }`}
                  style={{ backgroundColor: c.colorHex }}
                  title={c.color}
                />
              ))}
              <span className="text-[11px] text-slate-400 ml-1">
                {colors.length} {colors.length === 1 ? "cor" : "cores"}
              </span>
            </div>
          )}
        </div>

        {/* Pricing & Installments */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-baseline gap-2">
            {product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                R$ {product.originalPrice.toFixed(2).replace(".", ",")}
              </span>
            )}
            <span
              className="text-base font-black"
              style={{ color: "var(--text-primary)" }}
            >
              R$ {product.price.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            em até <strong>6x de R$ {(product.price / 6).toFixed(2).replace(".", ",")}</strong> sem juros
          </p>

          {/* Fast Buy Action */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleBuyNow}
              className="w-full py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider text-white shadow hover:brightness-110 transition flex items-center justify-center gap-1.5 active:scale-95"
              style={{ backgroundColor: cms.secondaryColor || "#e11d48" }}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Comprar Agora</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
