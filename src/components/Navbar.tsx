"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCms } from "@/context/CmsContext";
import { useCart } from "@/context/CartContext";
import {
  ShoppingBag,
  Search,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  Menu,
  X,
  UserCheck,
} from "lucide-react";

export function Navbar({
  onSearchChange,
  currentCategory,
  onSelectCategory,
}: {
  onSearchChange?: (term: string) => void;
  currentCategory?: string;
  onSelectCategory?: (category: string) => void;
}) {
  const { cms } = useCms();
  const { cartCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const categories = ["Todos", "Leggings", "Tops", "Conjuntos", "Shorts", "Macacões", "Acessórios"];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-200">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      {cms.topBarActive && cms.topBarText && (
        <div
          className="w-full py-2 px-4 text-center text-xs sm:text-sm font-semibold tracking-wide text-white transition-colors duration-300 flex items-center justify-center gap-2 overflow-hidden shadow-sm"
          style={{ backgroundColor: cms.secondaryColor || "#e11d48" }}
        >
          <Flame className="w-3.5 h-3.5 animate-pulse text-amber-300" />
          <span className="truncate">{cms.topBarText}</span>
          <Flame className="w-3.5 h-3.5 animate-pulse text-amber-300 hidden sm:inline" />
        </div>
      )}

      {/* 2. MAIN NAVIGATION BAR */}
      <nav
        className="w-full backdrop-blur-md border-b shadow-sm transition-colors duration-300"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "rgba(148, 163, 184, 0.2)",
          color: "var(--text-primary)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            {cms.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cms.logoUrl} alt={cms.brandName} className="h-10 object-contain" />
            ) : (
              <div className="flex flex-col items-start leading-none">
                <span
                  className="text-2xl sm:text-3xl font-black tracking-tighter uppercase transition-transform group-hover:scale-105"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span style={{ color: cms.secondaryColor || "#e11d48" }}>JV</span>
                  <span>MODAS</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 -mt-0.5">
                  Fitness Wear
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Buscar leggings, tops, conjuntos, shorts..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    if (onSearchChange) onSearchChange("");
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Admin Link Badge */}
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/60 dark:border-slate-700"
              title="Painel Administrativo CMS"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
              <span>Painel CMS</span>
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-full transition-transform active:scale-95 shadow-md flex items-center justify-center"
              style={{
                backgroundColor: cms.secondaryColor || "#e11d48",
                color: cms.buttonTextColor || "#ffffff",
              }}
              aria-label="Abrir Sacola de Compras"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-xs font-black flex items-center justify-center animate-bounce shadow border border-white/20"
                  style={{
                    backgroundColor: cms.accentColor || "#10b981",
                    color: "#ffffff",
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Buscar roupas fitness..."
              className="w-full pl-10 pr-4 py-2 rounded-full text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>
        </div>

        {/* Desktop Category Bar */}
        <div className="hidden lg:block border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-8 py-2.5">
            {categories.map((cat) => {
              const active = currentCategory === cat || (!currentCategory && cat === "Todos");
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory && onSelectCategory(cat)}
                  className={`text-xs uppercase font-extrabold tracking-wider transition-all duration-200 relative pb-1 ${
                    active
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                  }`}
                >
                  {cat}
                  {active && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all"
                      style={{ backgroundColor: cms.secondaryColor || "#e11d48" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3 animate-fadeIn">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Categorias</div>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    if (onSelectCategory) onSelectCategory(cat);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    currentCategory === cat || (!currentCategory && cat === "Todos")
                      ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-800 transition"
              >
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <span>Acessar Painel Admin CMS</span>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
