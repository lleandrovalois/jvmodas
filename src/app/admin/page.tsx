"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCms } from "@/context/CmsContext";
import { Product, Order, CmsSettings, Category } from "@/types";
import {
  ShieldCheck,
  LayoutDashboard,
  Palette,
  Package,
  ShoppingBag,
  LogOut,
  Save,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Eye,
  AlertTriangle,
  Flame,
  Search,
  DollarSign,
  TrendingUp,
  Boxes,
  MessageCircle,
  RefreshCw,
  X,
  Check,
  Sun,
  Moon,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Layers,
  Monitor,
  FolderTree,
} from "lucide-react";
import { THEME_PRESETS, FACTORY_DEFAULT_PRESET, ThemePreset } from "@/lib/theme-presets";

export default function AdminPage() {
  const { cms, refreshCms } = useCms();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "cms" | "products" | "orders">("dashboard");

  // CMS Form State
  const [cmsForm, setCmsForm] = useState<CmsSettings>(cms);
  const [savingCms, setSavingCms] = useState(false);
  const [cmsSuccessMessage, setCmsSuccessMessage] = useState("");

  // Categories State
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    categoryId: "",
    originalPrice: 149.9,
    price: 119.9,
    badge: "LANÇAMENTO",
    featured: true,
    description: "",
    imagesText: "",
    variants: [
      { size: "P", color: "Preto Carbono", colorHex: "#18181b", stock: 15 },
      { size: "M", color: "Preto Carbono", colorHex: "#18181b", stock: 20 },
      { size: "G", color: "Preto Carbono", colorHex: "#18181b", stock: 15 },
      { size: "GG", color: "Preto Carbono", colorHex: "#18181b", stock: 10 },
    ],
  });

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState("");

  // Check auth on load
  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/check");
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        loadData();
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Update CMS form when context changes
  useEffect(() => {
    if (cms) {
      setCmsForm(cms);
    }
  }, [cms]);

  const loadData = async () => {
    fetchProducts();
    fetchOrders();
    fetchCategories();
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategoriesList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Senha incorreta.");
      }
      setIsAuthenticated(true);
      loadData();
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Erro ao efetuar login");
    } finally {
      setLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
  };

  // Save CMS handler
  const handleSaveCms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCms(true);
    setCmsSuccessMessage("");

    try {
      const res = await fetch("/api/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cmsForm),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setIsAuthenticated(false);
          throw new Error("Sua sessão expirou ou não está autorizada. Por favor, efetue login novamente.");
        }
        throw new Error(errJson.error || "Erro ao salvar configurações do CMS");
      }

      await refreshCms();
      setCmsSuccessMessage("✅ Identidade visual e layout salvos e refletidos com sucesso!");
      setTimeout(() => setCmsSuccessMessage(""), 5000);
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Falha ao salvar configurações.");
    } finally {
      setSavingCms(false);
    }
  };

  // Preset handlers
  const handleApplyPreset = (preset: ThemePreset) => {
    const updated: CmsSettings = {
      ...cmsForm,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      backgroundColor: preset.backgroundColor,
      cardColor: preset.cardColor,
      textColor: preset.textColor,
      buttonTextColor: preset.buttonTextColor,
      activePreset: preset.id,
    };
    setCmsForm(updated);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--background", preset.backgroundColor);
      root.style.setProperty("--foreground", preset.textColor);
      root.style.setProperty("--card-bg", preset.cardColor);
      root.style.setProperty("--text-primary", preset.textColor);
      root.style.setProperty("--primary-color", preset.primaryColor);
      root.style.setProperty("--secondary-color", preset.secondaryColor);
      root.style.setProperty("--accent-color", preset.accentColor);
      root.style.setProperty("--btn-text", preset.buttonTextColor);
    }
    setCmsSuccessMessage(`✨ Preset "${preset.name}" aplicado! Clique em "Salvar e Publicar" para confirmar.`);
    setTimeout(() => setCmsSuccessMessage(""), 5000);
  };

  const handleRestoreFactoryColors = () => {
    handleApplyPreset(FACTORY_DEFAULT_PRESET);
    setCmsSuccessMessage("🛡️ Cores de fábrica (Dark Fitness) restauradas na prévia! Clique em 'Salvar e Publicar' para confirmar.");
    setTimeout(() => setCmsSuccessMessage(""), 5000);
  };

  const handleCustomColorChange = (key: keyof CmsSettings, value: string) => {
    const updated: CmsSettings = {
      ...cmsForm,
      [key]: value,
      activePreset: "custom",
    };
    setCmsForm(updated);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (key === "backgroundColor") {
        root.style.setProperty("--background", value);
      } else if (key === "cardColor") {
        root.style.setProperty("--card-bg", value);
      } else if (key === "textColor") {
        root.style.setProperty("--text-primary", value);
        root.style.setProperty("--foreground", value);
      } else if (key === "secondaryColor") {
        root.style.setProperty("--secondary-color", value);
      } else if (key === "accentColor") {
        root.style.setProperty("--accent-color", value);
      } else if (key === "buttonTextColor") {
        root.style.setProperty("--btn-text", value);
      } else if (key === "primaryColor") {
        root.style.setProperty("--primary-color", value);
      }
    }
  };

  // Product CRUD
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    const firstActive = categoriesList.find((c) => c.isActive);
    setProductForm({
      name: "",
      categoryId: firstActive ? firstActive.id : "",
      originalPrice: 149.9,
      price: 119.9,
      badge: "LANÇAMENTO",
      featured: true,
      description: "",
      imagesText:
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop",
      variants: [
        { size: "P", color: "Preto Carbono", colorHex: "#18181b", stock: 15 },
        { size: "M", color: "Preto Carbono", colorHex: "#18181b", stock: 20 },
        { size: "G", color: "Preto Carbono", colorHex: "#18181b", stock: 15 },
        { size: "GG", color: "Preto Carbono", colorHex: "#18181b", stock: 10 },
      ],
    });
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    let imgs = [];
    try {
      imgs = typeof prod.images === "string" ? JSON.parse(prod.images) : prod.images;
    } catch {
      imgs = [prod.images];
    }

    const currentCatId =
      prod.categoryId ||
      (typeof prod.category === "object" ? prod.category?.id : "") ||
      (typeof prod.category === "string" ? categoriesList.find((c) => c.name === prod.category)?.id : "") ||
      "";

    setProductForm({
      name: prod.name,
      categoryId: currentCatId,
      originalPrice: prod.originalPrice,
      price: prod.price,
      badge: prod.badge || "",
      featured: prod.featured,
      description: prod.description,
      imagesText: Array.isArray(imgs) ? imgs.join("\n") : String(imgs),
      variants: prod.variants.map((v) => ({
        size: v.size,
        color: v.color,
        colorHex: v.colorHex,
        stock: v.stock,
      })),
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const imagesArray = productForm.imagesText
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: productForm.name,
      categoryId: productForm.categoryId || null,
      originalPrice: productForm.originalPrice,
      price: productForm.price,
      badge: productForm.badge || null,
      featured: productForm.featured,
      description: productForm.description,
      images: imagesArray,
      variants: productForm.variants,
    };

    try {
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setProductModalOpen(false);
      fetchProducts();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar produto");
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja remover o produto "${name}" do catálogo?`)) {
      try {
        const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.error || "Erro ao remover produto do catálogo");
          return;
        }
        fetchProducts();
      } catch (e) {
        console.error(e);
        alert("Erro de conexão ao tentar remover produto");
      }
    }
  };

  // Order status update
  const handleUpdateOrderStatus = async (orderId: string, status: string, tracking?: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: status, trackingCode: tracking }),
      });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, paymentStatus: status as Order["paymentStatus"], trackingCode: tracking || prev.trackingCode } : null
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Metrics calculation
  const approvedOrders = orders.filter((o) => o.paymentStatus === "APPROVED" || o.paymentStatus === "SHIPPED");
  const totalRevenue = approvedOrders.reduce((sum, o) => sum + o.total, 0);
  const averageTicket = approvedOrders.length > 0 ? totalRevenue / approvedOrders.length : 0;
  const lowStockVariants = products
    .flatMap((p) => p.variants.map((v) => ({ ...v, productName: p.name })))
    .filter((v) => v.stock < 10);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === "ALL") return true;
    return o.paymentStatus === orderStatusFilter;
  });

  // 1. RENDER LOGIN SCREEN IF NOT AUTHENTICATED
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-rose-600/20 text-rose-500 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">
              Painel Admin JVMODAS
            </h1>
            <p className="text-xs text-slate-400">
              Gerencie a identidade visual (CMS), produtos, estoque e pedidos em tempo real.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Senha Administrativa
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Digite a senha (padrão: admin123)"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Dica de demonstração: senha padrão <strong>admin123</strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition active:scale-95 disabled:opacity-50"
            >
              {loggingIn ? "Autenticando..." : "Entrar no Painel"}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition">
              ← Voltar para a Loja
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs font-bold">
        Verificando credenciais...
      </div>
    );
  }

  // 2. MAIN ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-black text-lg tracking-tight text-white flex items-center gap-1">
              <span className="text-rose-500">JV</span>
              <span>MODAS</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 ml-2">
                ADMIN CMS
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Loja ao Vivo</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 overflow-x-auto scrollbar-none border-t border-slate-800/60">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
              activeTab === "dashboard"
                ? "border-rose-500 text-rose-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("cms")}
            className={`py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
              activeTab === "cms"
                ? "border-rose-500 text-rose-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Identidade Visual & CMS</span>
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
              activeTab === "products"
                ? "border-rose-500 text-rose-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catálogo ({products.length})</span>
          </button>

          <Link
            href="/admin/categorias"
            className="py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 border-transparent text-slate-400 hover:text-rose-400 transition"
          >
            <FolderTree className="w-4 h-4 text-rose-500" />
            <span>Categorias ({categoriesList.length})</span>
          </Link>

          <button
            onClick={() => setActiveTab("orders")}
            className={`py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
              activeTab === "orders"
                ? "border-rose-500 text-rose-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Pedidos ({orders.length})</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* ============================================================== */}
        {/* TAB 1: DASHBOARD METRICS */}
        {/* ============================================================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Faturamento Aprovado
                  </div>
                  <div className="text-xl font-black text-white mt-0.5">
                    R$ {totalRevenue.toFixed(2).replace(".", ",")}
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Pedidos Totais
                  </div>
                  <div className="text-xl font-black text-white mt-0.5">
                    {orders.length}{" "}
                    <span className="text-xs text-emerald-400 font-bold">
                      ({approvedOrders.length} aprovados)
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Ticket Médio
                  </div>
                  <div className="text-xl font-black text-white mt-0.5">
                    R$ {averageTicket.toFixed(2).replace(".", ",")}
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Produtos Ativos
                  </div>
                  <div className="text-xl font-black text-white mt-0.5">
                    {products.length} modelos
                  </div>
                </div>
              </div>

            </div>

            {/* Low Stock Alerts */}
            {lowStockVariants.length > 0 && (
              <div className="p-6 rounded-3xl bg-amber-950/20 border border-amber-900/40 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase tracking-wider">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Atenção: Variações com Estoque Baixo (&lt; 10 unidades)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {lowStockVariants.slice(0, 6).map((v, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white line-clamp-1">{v.productName}</div>
                        <div className="text-slate-400 text-[11px]">
                          Tam: {v.size} | Cor: {v.color}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs">
                        {v.stock} un
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders Preview */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                  Últimos Pedidos Recebidos
                </h3>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-xs text-rose-400 hover:underline font-bold"
                >
                  Ver Todos os Pedidos →
                </button>
              </div>

              <div className="divide-y divide-slate-800/60">
                {orders.slice(0, 5).map((ord) => (
                  <div
                    key={ord.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{ord.id}</span>
                        <span className="text-slate-400 font-normal">• {ord.customerName}</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {ord.items.length} {ord.items.length === 1 ? "item" : "itens"} • Pagamento via{" "}
                        <strong>{ord.paymentMethod}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-white">
                        R$ {ord.total.toFixed(2).replace(".", ",")}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          ord.paymentStatus === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : ord.paymentStatus === "SHIPPED"
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {ord.paymentStatus === "APPROVED"
                          ? "Aprovado"
                          : ord.paymentStatus === "SHIPPED"
                          ? "Enviado"
                          : "Pendente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: VISUAL IDENTITY & CMS MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === "cms" && (
          <form onSubmit={handleSaveCms} className="space-y-8 animate-fadeIn max-w-4xl">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight uppercase">
                  Identidade Visual e Layout Dinâmico
                </h2>
                <p className="text-xs text-slate-400">
                  Qualquer alteração feita aqui é gravada no banco de dados e refletida imediatamente em todo o e-commerce.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingCms}
                className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingCms ? "Salvando..." : "Salvar e Publicar"}</span>
              </button>
            </div>

            {cmsSuccessMessage && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{cmsSuccessMessage}</span>
              </div>
            )}

            {/* Section 1: Colors, Presets & Recovery Mode */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base uppercase tracking-wider text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-rose-500" />
                    <span>Presets de Cores & Identidade Visual</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Alterne instantaneamente entre temas pré-calibrados de alta conversão ou refine cores manualmente com segurança.
                  </p>
                </div>
                
                {/* Active Preset Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300">
                  <span className="w-2 h-2 rounded-full animate-ping bg-rose-500" />
                  <span>
                    Preset Ativo:{" "}
                    <strong className="text-white">
                      {cmsForm.activePreset === "dark-fitness"
                        ? "Dark Fitness (Escuro)"
                        : cmsForm.activePreset === "clean-active"
                        ? "Clean Active (Claro)"
                        : cmsForm.activePreset === "dark-neon"
                        ? "Dark Neon Sport"
                        : cmsForm.activePreset === "clean-rose"
                        ? "Clean Rose Active"
                        : "Personalizado (Custom)"}
                    </strong>
                  </span>
                </div>
              </div>

              {/* 1. PRESETS CARDS GRID */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Escolha um Preset Pré-Definido (1 Clique)</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Preset 1: Dark Fitness */}
                  <div
                    className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                      cmsForm.activePreset === "dark-fitness"
                        ? "bg-slate-800/90 border-rose-500/80 ring-2 ring-rose-500/30"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-sm text-white flex items-center gap-1.5">
                          <Moon className="w-4 h-4 text-indigo-400" />
                          <span>Dark Fitness (Padrão Escuro)</span>
                        </span>
                        {cmsForm.activePreset === "dark-fitness" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-3">
                        Slate escuro (#0F172A), cards (#1E293B), texto claro (#F8FAFC) e botões vibrantes em rosa/vinho (#E11D48).
                      </p>
                      {/* Swatches */}
                      <div className="flex items-center gap-1.5 mb-4">
                        <span className="w-5 h-5 rounded-md border border-white/20 shadow-sm" style={{ backgroundColor: "#0F172A" }} title="Fundo: #0F172A" />
                        <span className="w-5 h-5 rounded-md border border-white/20 shadow-sm" style={{ backgroundColor: "#1E293B" }} title="Card: #1E293B" />
                        <span className="w-5 h-5 rounded-md border border-white/20 shadow-sm" style={{ backgroundColor: "#F8FAFC" }} title="Texto: #F8FAFC" />
                        <span className="w-5 h-5 rounded-md border border-white/20 shadow-sm" style={{ backgroundColor: "#E11D48" }} title="Botão: #E11D48" />
                        <span className="w-5 h-5 rounded-md border border-white/20 shadow-sm" style={{ backgroundColor: "#10B981" }} title="Acento: #10B981" />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset(THEME_PRESETS["dark-fitness"])}
                      className="w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center gap-2 transition active:scale-95"
                    >
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Aplicar Tema Escuro</span>
                    </button>
                  </div>

                  {/* Preset 2: Clean Active */}
                  <div
                    className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                      cmsForm.activePreset === "clean-active"
                        ? "bg-slate-800/90 border-cyan-500/80 ring-2 ring-cyan-500/30"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-sm text-white flex items-center gap-1.5">
                          <Sun className="w-4 h-4 text-amber-400" />
                          <span>Clean Active (Padrão Claro)</span>
                        </span>
                        {cmsForm.activePreset === "clean-active" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-3">
                        Fundo cinza claro esportivo (#F8FAFC), cards brancos (#FFFFFF), texto escuro (#0F172A) e botões em azul (#0284C7).
                      </p>
                      {/* Swatches */}
                      <div className="flex items-center gap-1.5 mb-4">
                        <span className="w-5 h-5 rounded-md border border-slate-600 shadow-sm" style={{ backgroundColor: "#F8FAFC" }} title="Fundo: #F8FAFC" />
                        <span className="w-5 h-5 rounded-md border border-slate-600 shadow-sm" style={{ backgroundColor: "#FFFFFF" }} title="Card: #FFFFFF" />
                        <span className="w-5 h-5 rounded-md border border-slate-600 shadow-sm" style={{ backgroundColor: "#0F172A" }} title="Texto: #0F172A" />
                        <span className="w-5 h-5 rounded-md border border-slate-600 shadow-sm" style={{ backgroundColor: "#0284C7" }} title="Botão: #0284C7" />
                        <span className="w-5 h-5 rounded-md border border-slate-600 shadow-sm" style={{ backgroundColor: "#E11D48" }} title="Acento: #E11D48" />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset(THEME_PRESETS["clean-active"])}
                      className="w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center gap-2 transition active:scale-95"
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Aplicar Tema Claro</span>
                    </button>
                  </div>

                  {/* Preset 3: Dark Neon Sport */}
                  <div
                    className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                      cmsForm.activePreset === "dark-neon"
                        ? "bg-slate-800/90 border-emerald-500/80 ring-2 ring-emerald-500/30"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-sm text-white flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-emerald-400" />
                          <span>Dark Neon Sport</span>
                        </span>
                        {cmsForm.activePreset === "dark-neon" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-3">
                        Preto profundo com botões em Verde Neon (#10B981) para máxima energia atlética.
                      </p>
                      <div className="flex items-center gap-1.5 mb-4">
                        <span className="w-5 h-5 rounded-md border border-white/20 shadow-sm" style={{ backgroundColor: "#090D16" }} />
                        <span className="w-5 h-5 rounded-md border border-white/20 shadow-sm" style={{ backgroundColor: "#131C2E" }} />
                        <span className="w-5 h-5 rounded-md border border-white/20 shadow-sm" style={{ backgroundColor: "#F8FAFC" }} />
                        <span className="w-5 h-5 rounded-md border border-white/20 shadow-sm" style={{ backgroundColor: "#10B981" }} />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset(THEME_PRESETS["dark-neon"])}
                      className="w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center gap-2 transition active:scale-95"
                    >
                      <Flame className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Aplicar Neon Sport</span>
                    </button>
                  </div>

                  {/* Preset 4: Clean Rose Active */}
                  <div
                    className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                      cmsForm.activePreset === "clean-rose"
                        ? "bg-slate-800/90 border-rose-500/80 ring-2 ring-rose-500/30"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-sm text-white flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-rose-400" />
                          <span>Clean Rose Active</span>
                        </span>
                        {cmsForm.activePreset === "clean-rose" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-3">
                        Fundo claro suave com botões em Rose/Magenta (#E11D48) e detalhes atléticos.
                      </p>
                      <div className="flex items-center gap-1.5 mb-4">
                        <span className="w-5 h-5 rounded-md border border-slate-600 shadow-sm" style={{ backgroundColor: "#F8FAFC" }} />
                        <span className="w-5 h-5 rounded-md border border-slate-600 shadow-sm" style={{ backgroundColor: "#FFFFFF" }} />
                        <span className="w-5 h-5 rounded-md border border-slate-600 shadow-sm" style={{ backgroundColor: "#0F172A" }} />
                        <span className="w-5 h-5 rounded-md border border-slate-600 shadow-sm" style={{ backgroundColor: "#E11D48" }} />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset(THEME_PRESETS["clean-rose"])}
                      className="w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center gap-2 transition active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                      <span>Aplicar Rose Claro</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. RECOVERY MODE (SAFETY BUTTON) */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-300">
                      Modo de Recuperação e Segurança Visual
                    </h4>
                    <p className="text-xs text-amber-200/70 mt-0.5">
                      Fez alterações manuais e perdeu o contraste ideal? Restaure a qualquer momento a paleta oficial de fábrica com 1 clique.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRestoreFactoryColors}
                  className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-2 shrink-0 transition active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Cores de Fábrica</span>
                </button>
              </div>

              {/* 3. LIVE THEME PREVIEW CARD */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-rose-500" />
                    <span>Pré-visualização Dinâmica do Tema</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Atualiza em tempo real enquanto você ajusta
                  </span>
                </div>

                <div
                  className="p-5 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row items-center gap-6"
                  style={{
                    backgroundColor: cmsForm.backgroundColor || "#0F172A",
                    borderColor: "rgba(148, 163, 184, 0.2)",
                  }}
                >
                  {/* Mini Card Preview */}
                  <div
                    className="w-full md:w-64 p-4 rounded-xl border shadow-lg space-y-3"
                    style={{
                      backgroundColor: cmsForm.cardColor || "#1E293B",
                      borderColor: "rgba(148, 163, 184, 0.2)",
                      color: cmsForm.textColor || "#F8FAFC",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-white"
                        style={{ backgroundColor: cmsForm.accentColor || "#10B981" }}
                      >
                        LANÇAMENTO
                      </span>
                      <span className="text-xs font-bold text-amber-400">★ 4.9</span>
                    </div>

                    <div>
                      <h5
                        className="font-extrabold text-xs line-clamp-1"
                        style={{ color: cmsForm.textColor || "#F8FAFC" }}
                      >
                        Legging Emana® Zero Transparência
                      </h5>
                      <span
                        className="text-sm font-black mt-1 block"
                        style={{ color: cmsForm.textColor || "#F8FAFC" }}
                      >
                        R$ 149,90
                      </span>
                    </div>

                    <button
                      type="button"
                      className="w-full py-2 rounded-lg font-black text-xs uppercase tracking-wider shadow transition"
                      style={{
                        backgroundColor: cmsForm.secondaryColor || "#E11D48",
                        color: cmsForm.buttonTextColor || "#FFFFFF",
                      }}
                    >
                      Comprar Agora
                    </button>
                  </div>

                  {/* Context explanation */}
                  <div className="flex-1 space-y-1.5 text-xs" style={{ color: cmsForm.textColor || "#F8FAFC" }}>
                    <div className="font-extrabold text-sm uppercase">
                      Como os visitantes verão sua loja:
                    </div>
                    <p className="opacity-80 leading-relaxed text-xs">
                      O fundo adota <strong>{cmsForm.backgroundColor}</strong>, os cartões de produtos utilizam <strong>{cmsForm.cardColor}</strong>, o texto principal é <strong>{cmsForm.textColor}</strong> e os botões chamam atenção com <strong>{cmsForm.secondaryColor}</strong> (texto <strong>{cmsForm.buttonTextColor}</strong>).
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. MANUAL COLOR PICKERS (AJUSTE FINO) */}
              <div className="pt-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-rose-500" />
                  <span>Ajuste Fino de Cores Individuais</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Background Color */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      1. Fundo do Site (Background)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cmsForm.backgroundColor || "#0f172a"}
                        onChange={(e) => handleCustomColorChange("backgroundColor", e.target.value)}
                        className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cmsForm.backgroundColor || "#0f172a"}
                        onChange={(e) => handleCustomColorChange("backgroundColor", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  {/* Card Color */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      2. Superfície dos Cards (Card/Surface)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cmsForm.cardColor || "#1e293b"}
                        onChange={(e) => handleCustomColorChange("cardColor", e.target.value)}
                        className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cmsForm.cardColor || "#1e293b"}
                        onChange={(e) => handleCustomColorChange("cardColor", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  {/* Text Color */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      3. Texto Principal (Primary Text)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cmsForm.textColor || "#f8fafc"}
                        onChange={(e) => handleCustomColorChange("textColor", e.target.value)}
                        className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cmsForm.textColor || "#f8fafc"}
                        onChange={(e) => handleCustomColorChange("textColor", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  {/* Secondary / Button Color */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      4. Destaque / Botões Principais (Action)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cmsForm.secondaryColor || "#e11d48"}
                        onChange={(e) => handleCustomColorChange("secondaryColor", e.target.value)}
                        className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cmsForm.secondaryColor || "#e11d48"}
                        onChange={(e) => handleCustomColorChange("secondaryColor", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  {/* Button Text Color */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      5. Texto em Botões (Button Text)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cmsForm.buttonTextColor || "#ffffff"}
                        onChange={(e) => handleCustomColorChange("buttonTextColor", e.target.value)}
                        className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cmsForm.buttonTextColor || "#ffffff"}
                        onChange={(e) => handleCustomColorChange("buttonTextColor", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      6. Realce / Badges & Sucesso (Accent)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cmsForm.accentColor || "#10b981"}
                        onChange={(e) => handleCustomColorChange("accentColor", e.target.value)}
                        className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cmsForm.accentColor || "#10b981"}
                        onChange={(e) => handleCustomColorChange("accentColor", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  {/* Primary Color (Brand / Navbar Top) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      7. Cor da Barra / Marca (Primary)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cmsForm.primaryColor || "#0f172a"}
                        onChange={(e) => handleCustomColorChange("primaryColor", e.target.value)}
                        className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cmsForm.primaryColor || "#0f172a"}
                        onChange={(e) => handleCustomColorChange("primaryColor", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. BRAND INFO */}
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3">
                  Informações da Marca & Identidade
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Nome da Marca
                    </label>
                    <input
                      type="text"
                      value={cmsForm.brandName}
                      onChange={(e) => setCmsForm({ ...cmsForm, brandName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Slogan da Loja
                    </label>
                    <input
                      type="text"
                      value={cmsForm.brandTagline}
                      onChange={(e) => setCmsForm({ ...cmsForm, brandTagline: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Top Announcement Bar */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>Barra de Anúncios no Topo (Top Bar)</span>
                </h3>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={cmsForm.topBarActive}
                    onChange={(e) => setCmsForm({ ...cmsForm, topBarActive: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>Exibir Barra no Topo</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Texto do Anúncio (Ex: Frete Grátis, Cupons, Avisos)
                </label>
                <input
                  type="text"
                  value={cmsForm.topBarText}
                  onChange={(e) => setCmsForm({ ...cmsForm, topBarText: e.target.value })}
                  placeholder="Ex: 🔥 FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 199 COM CUPOM: JV10"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            {/* Section 3: Hero Banner */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-white pb-3 border-b border-slate-800">
                Banner Principal da Home (Hero)
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Título Principal
                  </label>
                  <input
                    type="text"
                    value={cmsForm.heroTitle}
                    onChange={(e) => setCmsForm({ ...cmsForm, heroTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Subtítulo Explicativo
                  </label>
                  <textarea
                    rows={2}
                    value={cmsForm.heroSubtitle}
                    onChange={(e) => setCmsForm({ ...cmsForm, heroSubtitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      URL da Imagem de Fundo (Alta Resolução)
                    </label>
                    <input
                      type="text"
                      value={cmsForm.heroBannerUrl}
                      onChange={(e) => setCmsForm({ ...cmsForm, heroBannerUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Texto do Botão CTA
                    </label>
                    <input
                      type="text"
                      value={cmsForm.heroCtaText}
                      onChange={(e) => setCmsForm({ ...cmsForm, heroCtaText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Secondary Promo Banner */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-white pb-3 border-b border-slate-800">
                Banner Secundário de Campanha (Promo Banner)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Título do Banner
                  </label>
                  <input
                    type="text"
                    value={cmsForm.promoBannerTitle}
                    onChange={(e) => setCmsForm({ ...cmsForm, promoBannerTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={cmsForm.promoBannerSubtitle}
                    onChange={(e) => setCmsForm({ ...cmsForm, promoBannerSubtitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    URL da Imagem do Banner
                  </label>
                  <input
                    type="text"
                    value={cmsForm.promoBannerUrl}
                    onChange={(e) => setCmsForm({ ...cmsForm, promoBannerUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Store Rules & Contacts */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-white pb-3 border-b border-slate-800">
                Regras da Loja e Contatos
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Valor Mínimo para Frete Grátis (R$)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={cmsForm.freeShippingThreshold}
                    onChange={(e) => setCmsForm({ ...cmsForm, freeShippingThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    WhatsApp para Atendimento
                  </label>
                  <input
                    type="text"
                    value={cmsForm.whatsappNumber}
                    onChange={(e) => setCmsForm({ ...cmsForm, whatsappNumber: e.target.value })}
                    placeholder="Ex: 5511999998888"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    URL do Instagram
                  </label>
                  <input
                    type="text"
                    value={cmsForm.instagramUrl}
                    onChange={(e) => setCmsForm({ ...cmsForm, instagramUrl: e.target.value })}
                    placeholder="https://instagram.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingCms}
                className="px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-xl flex items-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Todas as Configurações</span>
              </button>
            </div>

          </form>
        )}

        {/* ============================================================== */}
        {/* TAB 3: PRODUCTS CATALOG MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === "products" && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight uppercase">
                  Gestão do Catálogo de Produtos
                </h2>
                <p className="text-xs text-slate-400">
                  Cadastre novos produtos, gerencie preços promocionais de/por e estoque por variação.
                </p>
              </div>

              <button
                onClick={handleOpenAddProduct}
                className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-md flex items-center gap-2 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Produto</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase font-black tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Produto</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Preço (De / Por)</th>
                      <th className="py-3 px-4">Variações & Estoque</th>
                      <th className="py-3 px-4">Badge</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          <Package className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
                          <div className="text-sm font-bold text-slate-400">Nenhum produto cadastrado no catálogo</div>
                          <p className="text-xs text-slate-500 mt-1">Clique em "Adicionar Produto" acima para cadastrar seu primeiro produto.</p>
                        </td>
                      </tr>
                    ) : (
                      products.map((prod) => {
                        let imgs: string[] = [];
                        try {
                          imgs = typeof prod.images === "string" ? JSON.parse(prod.images) : prod.images;
                        } catch {
                          imgs = [prod.images as unknown as string];
                        }
                        const totalStock = prod.variants.reduce((sum, v) => sum + v.stock, 0);

                        return (
                          <tr key={prod.id} className="hover:bg-slate-800/30 transition">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-12 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={imgs[0]}
                                    alt={prod.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="font-bold text-white line-clamp-1">{prod.name}</div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    {prod.slug}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-bold text-slate-400">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-slate-950 border border-slate-800 text-slate-300 font-semibold">
                                {typeof prod.category === "object" ? prod.category?.name : (prod.category || "Sem Categoria")}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="text-slate-400 line-through text-[11px]">
                                R$ {prod.originalPrice.toFixed(2).replace(".", ",")}
                              </div>
                              <div className="font-black text-white text-sm">
                                R$ {prod.price.toFixed(2).replace(".", ",")}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white">
                                {totalStock} unidades totais
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {prod.variants.length} variações cadastradas
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {prod.badge ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  {prod.badge}
                                </span>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEditProduct(prod)}
                                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                                  title="Editar"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: ORDERS MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight uppercase">
                  Gestão de Pedidos dos Clientes
                </h2>
                <p className="text-xs text-slate-400">
                  Visualize comprovantes, aprove pagamentos e insira códigos de rastreio dos Correios.
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Status:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white focus:outline-none"
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="PENDING">Pendentes</option>
                  <option value="APPROVED">Aprovados</option>
                  <option value="SHIPPED">Enviados</option>
                  <option value="CANCELLED">Cancelados</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase font-black tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Pedido ID</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Pagamento</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Rastreio</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4 font-black text-white">
                          {ord.id}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{ord.customerName}</div>
                          <div className="text-[11px] text-slate-500">{ord.customerPhone}</div>
                        </td>

                        <td className="py-3.5 px-4 font-black text-white">
                          R$ {ord.total.toFixed(2).replace(".", ",")}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold">{ord.paymentMethod}</span>
                          {ord.cardInstallments && (
                            <span className="text-[11px] text-slate-500 block">
                              {ord.cardInstallments}x
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              ord.paymentStatus === "APPROVED"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : ord.paymentStatus === "SHIPPED"
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                : ord.paymentStatus === "CANCELLED"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {ord.paymentStatus === "APPROVED"
                              ? "Aprovado"
                              : ord.paymentStatus === "SHIPPED"
                              ? "Enviado"
                              : ord.paymentStatus === "CANCELLED"
                              ? "Cancelado"
                              : "Pendente"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {ord.trackingCode ? (
                            <span className="font-mono text-cyan-400 font-bold">
                              {ord.trackingCode}
                            </span>
                          ) : (
                            <span className="text-slate-600">Não informado</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedOrder(ord);
                              setTrackingInput(ord.trackingCode || "");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
                          >
                            Gerenciar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ============================================================== */}
      {/* ROOT LEVEL MODALS (Outside animated tab containers) */}
      {/* ============================================================== */}

      {/* PRODUCT ADD / EDIT MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm p-3 sm:p-6 flex justify-center items-start">
          <div
            onClick={() => setProductModalOpen(false)}
            className="fixed inset-0 -z-10"
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl z-10 my-auto flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] overflow-hidden"
          >
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  {editingProduct ? "Editar Produto" : "Novo Produto no Catálogo"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {editingProduct ? "Atualize as informações, fotos e estoque." : "Cadastre novo produto com fotos e grade de estoque."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="product-form" onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ex: Legging Emana Zero Transparência"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-400">
                      Categoria *
                    </label>
                    <Link
                      href="/admin/categorias"
                      target="_blank"
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1"
                    >
                      <FolderTree className="w-3 h-3" /> Gerenciar
                    </Link>
                  </div>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-bold"
                  >
                    <option value="" disabled>Selecione uma categoria...</option>
                    {categoriesList
                      .filter((c) => c.isActive || c.id === productForm.categoryId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {!c.isActive ? "(Inativa)" : ""}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Badge Promocional
                  </label>
                  <input
                    type="text"
                    value={productForm.badge}
                    onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                    placeholder="LANÇAMENTO, MAIS VENDIDO..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Preço Original "De" (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Preço Promocional "Por" (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Descrição Completa
                </label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  URLs das Fotos (uma por linha)
                </label>
                <textarea
                  rows={3}
                  value={productForm.imagesText}
                  onChange={(e) => setProductForm({ ...productForm, imagesText: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              {/* Variants Grid */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-400 mb-2">
                  Grade de Estoque por Variação (Tamanho / Cor / Estoque):
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {productForm.variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center gap-3 text-xs"
                    >
                      <span className="font-black text-rose-400 w-8">{v.size}</span>
                      <span className="flex-1 font-bold">{v.color}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-[11px]">Estoque:</span>
                        <input
                          type="number"
                          min={0}
                          value={v.stock}
                          onChange={(e) => {
                            const updated = [...productForm.variants];
                            updated[idx].stock = Number(e.target.value);
                            setProductForm({ ...productForm, variants: updated });
                          }}
                          className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-600 text-white font-bold text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/95 flex justify-end items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="product-form"
                className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 text-white hover:bg-rose-500 shadow-md transition"
              >
                Salvar Produto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm p-3 sm:p-6 flex justify-center items-start">
          <div
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 -z-10"
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl z-10 my-auto flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  Pedido {selectedOrder.id}
                </h3>
                <p className="text-xs text-slate-400">
                  {new Date(selectedOrder.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Customer and Delivery Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-1">
                <div className="font-black text-white uppercase text-[11px] mb-2">
                  Dados do Comprador
                </div>
                <div className="font-bold text-white">{selectedOrder.customerName}</div>
                <div className="text-slate-400">{selectedOrder.customerEmail}</div>
                <div className="text-slate-400">CPF: {selectedOrder.customerCpf}</div>
                <div className="text-slate-400">Tel: {selectedOrder.customerPhone}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-1">
                <div className="font-black text-white uppercase text-[11px] mb-2">
                  Endereço de Entrega
                </div>
                <div className="text-slate-300">
                  {selectedOrder.shippingStreet}, {selectedOrder.shippingNumber}
                </div>
                <div className="text-slate-400">
                  {selectedOrder.shippingNeighborhood} - {selectedOrder.shippingCity}/
                  {selectedOrder.shippingState}
                </div>
                <div className="text-slate-400">CEP: {selectedOrder.shippingCep}</div>
                <div className="text-cyan-400 font-bold mt-1">
                  Envio: {selectedOrder.shippingMethod}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                Itens Comprados
              </h4>
              <div className="divide-y divide-slate-800 bg-slate-800/40 rounded-2xl border border-slate-800 overflow-hidden">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-white">{item.productName}</div>
                        <div className="text-slate-400 text-[11px]">
                          Tam: {item.size} | Cor: {item.color} | Qtd: {item.quantity}
                        </div>
                      </div>
                    </div>
                    <span className="font-black text-white">
                      R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Code Input */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Código de Rastreamento dos Correios / Transportadora
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                  placeholder="Ex: BR123456789SP"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-white"
                />
                <button
                  onClick={() =>
                    handleUpdateOrderStatus(
                      selectedOrder.id,
                      selectedOrder.paymentStatus,
                      trackingInput
                    )
                  }
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Salvar Rastreio
                </button>
              </div>
            </div>

            {/* Status Actions */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-400">Alterar Status do Pedido:</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, "APPROVED")}
                  className="py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Aprovar Pagamento
                </button>
                <button
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, "SHIPPED")}
                  className="py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Marcar como Enviado
                </button>
                <button
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, "CANCELLED")}
                  className="py-2.5 rounded-xl text-xs font-bold bg-rose-600/80 hover:bg-rose-600 text-white"
                >
                  Cancelar Pedido
                </button>
              </div>

              {/* WhatsApp message button */}
              <a
                href={`https://wa.me/${selectedOrder.customerPhone.replace(
                  /\D/g,
                  ""
                )}?text=${encodeURIComponent(
                  `Olá ${selectedOrder.customerName}, tudo bem? Aqui é da equipe JVMODAS sobre o seu pedido ${selectedOrder.id}!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Falar com o Cliente no WhatsApp</span>
              </a>
            </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
