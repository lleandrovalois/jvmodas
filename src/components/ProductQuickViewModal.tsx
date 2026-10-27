"use client";

import React, { useState, useEffect } from "react";
import { Product, ProductVariant } from "@/types";
import { useCms } from "@/context/CmsContext";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import {
  X,
  Star,
  ShoppingBag,
  Zap,
  Ruler,
  Truck,
  ShieldCheck,
  Check,
  AlertTriangle,
} from "lucide-react";

export function ProductQuickViewModal({
  product,
  isOpen,
  onClose,
  onOpenSizeGuide,
}: {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSizeGuide: () => void;
}) {
  const { cms } = useCms();
  const { addToCart } = useCart();
  const router = useRouter();

  // Images
  let images: string[] = [];
  try {
    images = product ? (typeof product.images === "string" ? JSON.parse(product.images) : product.images) : [];
  } catch {
    images = product?.images ? [product.images as unknown as string] : [];
  }
  const [selectedImage, setSelectedImage] = useState(images[0] || "");

  // Colors
  const uniqueColorsMap = new Map<string, { color: string; colorHex: string }>();
  (product?.variants || []).forEach((v) => {
    if (!uniqueColorsMap.has(v.color)) {
      uniqueColorsMap.set(v.color, { color: v.color, colorHex: v.colorHex });
    }
  });
  const colors = Array.from(uniqueColorsMap.values());
  const [selectedColor, setSelectedColor] = useState(colors[0]?.color || "");

  // Sizes: P, M, G, GG
  const sizes = ["P", "M", "G", "GG"];
  const [selectedSize, setSelectedSize] = useState("M");
  const [quantity, setQuantity] = useState(1);

  // Sync state when product changes
  useEffect(() => {
    if (product) {
      let imgs: string[] = [];
      try {
        imgs = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
      } catch {
        imgs = [product.images as unknown as string];
      }
      setSelectedImage(imgs[0] || "");

      const uColors = Array.from(
        new Map(product.variants.map((v) => [v.color, { color: v.color, colorHex: v.colorHex }])).values()
      );
      if (uColors.length > 0) {
        setSelectedColor(uColors[0].color);
      }
      setSelectedSize("M");
      setQuantity(1);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  // Find matching variant
  const currentVariant = product.variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );
  const currentStock = currentVariant?.stock ?? 0;

  const handleAddToCart = () => {
    if (!currentVariant || currentStock <= 0) return;
    addToCart({
      id: currentVariant.id,
      productId: product.id,
      variantId: currentVariant.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: selectedImage || images[0],
      size: currentVariant.size,
      color: currentVariant.color,
      colorHex: currentVariant.colorHex,
      price: product.price,
      originalPrice: product.originalPrice,
      quantity,
      maxStock: currentStock,
    });
    onClose();
  };

  const handleBuyNow = () => {
    if (!currentVariant || currentStock <= 0) return;
    addToCart({
      id: currentVariant.id,
      productId: product.id,
      variantId: currentVariant.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: selectedImage || images[0],
      size: currentVariant.size,
      color: currentVariant.color,
      colorHex: currentVariant.colorHex,
      price: product.price,
      originalPrice: product.originalPrice,
      quantity,
      maxStock: currentStock,
    });
    onClose();
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      />

      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 z-10 animate-fadeIn">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-500 hover:text-slate-900 dark:hover:text-white transition shadow"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto">
          
          {/* 1. PRODUCT GALLERY */}
          <div className="p-6 bg-slate-50 dark:bg-slate-800/40 flex flex-col items-center justify-between">
            <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage || images[0]}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-all duration-300"
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 mt-4 overflow-x-auto py-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-14 h-18 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === img
                        ? "border-rose-500 scale-105 shadow-sm"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. PRODUCT DETAILS & OPTIONS */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Category & Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase font-black tracking-widest text-rose-600 dark:text-rose-400">
                  {product.category}
                </span>
                {product.badge && (
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-white"
                    style={{ backgroundColor: cms.secondaryColor || "#e11d48" }}
                  >
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                {product.name}
              </h2>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2 text-xs">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300">{product.rating.toFixed(1)}</span>
                <span className="text-slate-400">({product.reviewsCount} avaliações reais)</span>
              </div>

              {/* Pricing */}
              <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-baseline justify-between">
                <div>
                  {product.originalPrice > product.price && (
                    <div className="text-xs text-slate-400 line-through">
                      R$ {product.originalPrice.toFixed(2).replace(".", ",")}
                    </div>
                  )}
                  <div className="text-2xl font-black text-slate-950 dark:text-white">
                    R$ {product.price.toFixed(2).replace(".", ",")}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <div>até <strong>12x sem juros</strong></div>
                  <div className="text-emerald-600 font-bold">5% OFF no PIX</div>
                </div>
              </div>

              {/* Description */}
              <p className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {product.description}
              </p>

              {/* 3. COLOR SELECTOR */}
              <div className="mt-5">
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-800 dark:text-slate-200">
                    Cor: <span className="text-rose-600 font-black">{selectedColor}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  {colors.map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setSelectedColor(c.color)}
                      className={`relative w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                        selectedColor === c.color
                          ? "ring-2 ring-rose-500 ring-offset-2 scale-110 shadow-sm"
                          : "border-slate-300 hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.colorHex }}
                      title={c.color}
                    >
                      {selectedColor === c.color && (
                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. SIZE SELECTOR */}
              <div className="mt-5">
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-800 dark:text-slate-200">
                    Tamanho Selecionado: <span className="text-rose-600 font-black">{selectedSize}</span>
                  </span>
                  <button
                    onClick={onOpenSizeGuide}
                    className="text-slate-500 hover:text-rose-600 flex items-center gap-1 underline"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Tabela de Medidas</span>
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {sizes.map((sz) => {
                    const variantForSize = product.variants.find(
                      (v) => v.color === selectedColor && v.size === sz
                    );
                    const isAvailable = (variantForSize?.stock ?? 0) > 0;
                    const isSelected = selectedSize === sz;

                    return (
                      <button
                        key={sz}
                        disabled={!isAvailable}
                        onClick={() => setSelectedSize(sz)}
                        className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all border ${
                          isSelected
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 shadow"
                            : isAvailable
                            ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-900"
                            : "bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-dashed border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-50"
                        }`}
                      >
                        {sz}
                        {!isAvailable && <span className="block text-[9px] font-normal">Esgotado</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stock Notice */}
              <div className="mt-4">
                {currentStock > 0 ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {currentStock <= 5 ? (
                        <span className="text-amber-600">
                          Apenas {currentStock} unidades restantes neste tamanho!
                        </span>
                      ) : (
                        "Em estoque para envio imediato (Pronta Entrega)"
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Produto esgotado nesta combinação de cor e tamanho.</span>
                  </div>
                )}
              </div>
            </div>

            {/* 5. QUANTITY & ACTIONS */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 h-12">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 h-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 font-black text-sm text-slate-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    disabled={quantity >= currentStock}
                    className="px-3 h-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={currentStock <= 0}
                  className="flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Adicionar à Sacola</span>
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={currentStock <= 0}
                className="w-full py-3.5 px-4 rounded-xl text-center font-black text-xs uppercase tracking-wider text-white shadow-lg hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: cms.secondaryColor || "#e11d48" }}
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Comprar Agora com 1 Clique</span>
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-emerald-500" /> Frete Rápido
                </span>
                <span>•</span>
                <span>🔒 Compra 100% Segura</span>
                <span>•</span>
                <span>1ª Troca Grátis</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
