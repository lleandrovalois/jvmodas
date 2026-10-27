"use client";

import React, { useState, useMemo } from "react";
import { Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { SizeGuideModal } from "@/components/SizeGuideModal";
import {
  SlidersHorizontal,
  Flame,
  ArrowUpDown,
  Filter,
  Check,
  Search,
  Sparkles,
} from "lucide-react";

export function VitrineSection({
  initialProducts,
  initialCategory = "Todos",
  searchTerm = "",
}: {
  initialProducts: Product[];
  initialCategory?: string;
  searchTerm?: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("recent");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const categories = [
    "Todos",
    "Leggings",
    "Tops",
    "Conjuntos",
    "Shorts",
    "Macacões",
    "Acessórios",
  ];

  const sizes = ["P", "M", "G", "GG"];

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // Category filter
      if (selectedCategory !== "Todos" && product.category !== selectedCategory) {
        return false;
      }

      // Size filter
      if (selectedSize) {
        const hasSize = product.variants.some(
          (v) => v.size === selectedSize && v.stock > 0
        );
        if (!hasSize) return false;
      }

      // Search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(term);
        const matchesDesc = product.description.toLowerCase().includes(term);
        const matchesCategory = product.category.toLowerCase().includes(term);
        if (!matchesName && !matchesDesc && !matchesCategory) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "best_sellers") return b.reviewsCount - a.reviewsCount;
      if (sortBy === "rating") return b.rating - a.rating;
      // recent
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [initialProducts, selectedCategory, selectedSize, searchTerm, sortBy]);

  return (
    <section id="vitrine" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-600 mb-1">
            <Flame className="w-4 h-4 fill-current" />
            <span>Catálogo Completo</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            {selectedCategory === "Todos" ? "Moda Fitness em Destaque" : `Coleção: ${selectedCategory}`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Exibindo <strong>{filteredProducts.length}</strong> produtos prontos para envio
          </p>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <ArrowUpDown className="w-4 h-4" />
            <span>Ordenar por:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="recent">Mais Recentes</option>
            <option value="best_sellers">Mais Vendidos</option>
            <option value="price_asc">Menor Preço</option>
            <option value="price_desc">Maior Preço</option>
            <option value="rating">Melhor Avaliados</option>
          </select>
        </div>
      </div>

      {/* 2. CATEGORY PILLS & SIZE FILTER */}
      <div className="py-6 space-y-4">
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md scale-105"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sizes Quick Filter */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Filtrar por Tamanho:</span>
            <div className="flex gap-1.5">
              {sizes.map((sz) => {
                const isSelected = selectedSize === sz;
                return (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(isSelected ? null : sz)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                      isSelected
                        ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
              {selectedSize && (
                <button
                  onClick={() => setSelectedSize(null)}
                  className="text-[11px] text-rose-600 hover:underline font-bold ml-1 self-center"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setSizeGuideOpen(true)}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white underline"
          >
            Ver Tabela de Medidas
          </button>
        </div>
      </div>

      {/* 3. PRODUCTS GRID */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-3xl p-8 border border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Filter className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Nenhum produto encontrado com os filtros selecionados
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Tente remover os filtros de tamanho ou selecionar outra categoria.
          </p>
          <button
            onClick={() => {
              setSelectedCategory("Todos");
              setSelectedSize(null);
            }}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow"
          >
            Limpar Todos os Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>
      )}

      {/* 4. MODALS */}
      <ProductQuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        onOpenSizeGuide={() => setSizeGuideOpen(true)}
      />

      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
      />

    </section>
  );
}
