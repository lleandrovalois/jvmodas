"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  ShoppingBag,
  ExternalLink,
  LogOut,
  FolderTree,
  Tag,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { CategoryWithCount } from "@/types";
import {
  getCategoriesWithCount,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} from "@/actions/categories";
import { slugify, categorySchema } from "@/lib/validations/category";

export default function AdminCategoriasPage() {
  // Estado de Autenticação
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Categorias e Filtros
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  // Modais de Criação e Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<{ name?: string; description?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Modal de Exclusão (Segurança)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithCount | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast Feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Verifica Autenticação inicial
  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/check");
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        loadCategories();
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Login
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
      loadCategories();
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Erro ao efetuar login");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
  };

  // Carrega lista de categorias
  const loadCategories = async () => {
    setLoading(true);
    try {
      const result = await getCategoriesWithCount();
      if (result.success && result.data) {
        setCategories(result.data);
      } else {
        showToast(result.error || "Erro ao carregar categorias", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Falha na comunicação com o servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  // Preview de Slug em tempo real
  const computedSlug = useMemo(() => {
    return slugify(formData.name);
  }, [formData.name]);

  // Validação em tempo real para duplicidade no formulário
  const clientValidation = useMemo(() => {
    const trimmed = formData.name.trim();
    if (!trimmed) return null;

    const isDuplicate = categories.some((c) => {
      if (editingCategory && c.id === editingCategory.id) return false;
      return c.name.trim().toLowerCase() === trimmed.toLowerCase();
    });

    if (isDuplicate) {
      return "Já existe uma categoria cadastrada com este nome.";
    }

    const isSlugDuplicate = categories.some((c) => {
      if (editingCategory && c.id === editingCategory.id) return false;
      return c.slug === computedSlug;
    });

    if (isSlugDuplicate) {
      return "O slug gerado já está em uso por outra categoria.";
    }

    return null;
  }, [formData.name, computedSlug, categories, editingCategory]);

  // Abertura do Modal de Criação
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      isActive: true,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Abertura do Modal de Edição
  const handleOpenEditModal = (cat: CategoryWithCount) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || "",
      isActive: cat.isActive,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Submissão do Formulário (Criar ou Atualizar)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validação com Zod
    const validation = categorySchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: { name?: string; description?: string } = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0] === "name") fieldErrors.name = err.message;
        if (err.path[0] === "description") fieldErrors.description = err.message;
      });
      setFormErrors(fieldErrors);
      return;
    }

    if (clientValidation) {
      setFormErrors({ name: clientValidation });
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        // Atualização
        const res = await updateCategory(editingCategory.id, formData);
        if (res.success) {
          showToast(`Categoria "${formData.name}" atualizada com sucesso!`, "success");
          setModalOpen(false);
          loadCategories();
        } else {
          setFormErrors({ name: res.error });
          showToast(res.error || "Erro ao atualizar categoria", "error");
        }
      } else {
        // Criação
        const res = await createCategory(formData);
        if (res.success) {
          showToast(`Categoria "${formData.name}" criada com sucesso!`, "success");
          setModalOpen(false);
          loadCategories();
        } else {
          setFormErrors({ name: res.error });
          showToast(res.error || "Erro ao criar categoria", "error");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Erro inesperado ao salvar categoria", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Alternar Status Ativo/Inativo via switch rápido
  const handleToggleStatus = async (cat: CategoryWithCount) => {
    startTransition(async () => {
      // Atualização otimista
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
      );

      const res = await toggleCategoryStatus(cat.id);
      if (res.success) {
        showToast(
          `Categoria "${cat.name}" ${!cat.isActive ? "ativada" : "desativada"} com sucesso.`
        );
      } else {
        // Reverte se falhou
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, isActive: cat.isActive } : c))
        );
        showToast(res.error || "Erro ao alterar status", "error");
      }
    });
  };

  // Abertura do Modal de Exclusão
  const handleOpenDeleteModal = (cat: CategoryWithCount) => {
    setCategoryToDelete(cat);
    setDeleteModalOpen(true);
  };

  // Executar Exclusão Segura
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);

    try {
      const res = await deleteCategory(categoryToDelete.id);
      if (res.success) {
        showToast(res.message || "Categoria excluída com sucesso!", "success");
        setDeleteModalOpen(false);
        setCategoryToDelete(null);
        loadCategories();
      } else {
        showToast(res.error || "Falha ao excluir categoria", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Erro inesperado ao excluir categoria", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Categorias Filtradas por Busca
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.slug.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term))
    );
  }, [categories, searchTerm]);

  // Contadores de Resumo
  const totalCategories = categories.length;
  const activeCategoriesCount = categories.filter((c) => c.isActive).length;
  const totalProductsLinked = categories.reduce((acc, c) => acc + (c._count?.products || 0), 0);

  // Tela de Login se não autenticado
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-slate-100">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-600/10 border border-rose-500/20 text-rose-500 mb-2">
              <FolderTree className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">JV MODAS ADMIN</h1>
            <p className="text-sm text-slate-400">
              Acesso restrito ao Gestor de Categorias
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Senha de Administrador
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Digite a senha..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
              />
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Acessando...
                </>
              ) : (
                "Entrar no Módulo de Categorias"
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Voltar para a Loja Virtual
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Carregando inicial
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
          <span className="text-sm font-medium">Carregando Gestão de Categorias...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification Flutuante */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4 ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/90 border-rose-500/40 text-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* TOP HEADER ADMINISTRATIVO */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <span className="font-black text-xl tracking-tighter text-white group-hover:text-rose-500 transition-colors">
                JV <span className="text-rose-500">MODAS</span>
              </span>
              <span className="text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase">
                ADMIN CMS
              </span>
            </Link>

            {/* Separador */}
            <div className="h-4 w-px bg-slate-700 hidden sm:block" />

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <Link href="/admin" className="hover:text-slate-200 transition-colors">
                Painel Geral
              </Link>
              <span>/</span>
              <span className="text-white font-semibold">Categorias</span>
            </div>
          </div>

          {/* Menus e Ações */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/admin"
              className="text-xs font-semibold px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Painel Geral</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              className="text-xs font-semibold px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Ver Loja</span>
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs font-semibold px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* TÍTULO E BOTÃO DE AÇÃO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <FolderTree className="w-6 h-6 text-rose-500" />
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Gestão de Categorias
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Cadastre, edite e gerencie as categorias do catálogo com regras de integridade e revalidação instantânea.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadCategories}
              disabled={loading}
              title="Recarregar Categorias"
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-rose-500" : ""}`} />
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Categoria</span>
            </button>
          </div>
        </div>

        {/* CARDS DE RESUMO RÁPIDO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-rose-500 shrink-0">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total de Categorias
              </span>
              <div className="text-2xl font-black text-white">{totalCategories}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Categorias Ativas
              </span>
              <div className="text-2xl font-black text-emerald-400">{activeCategoriesCount}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Produtos Vinculados
              </span>
              <div className="text-2xl font-black text-blue-400">{totalProductsLinked}</div>
            </div>
          </div>
        </div>

        {/* BARRA DE FERRAMENTAS E BUSCA */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou slug..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Exibindo{" "}
            <span className="text-white font-bold">{filteredCategories.length}</span> de{" "}
            <span className="text-white font-bold">{totalCategories}</span> categorias
          </div>
        </div>

        {/* TABELA DE LISTAGEM */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-4 px-6">Categoria</th>
                  <th className="py-4 px-6">Slug (URL)</th>
                  <th className="py-4 px-6 text-center">Produtos</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-rose-500" />
                        <span>Carregando categorias...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <div className="max-w-sm mx-auto space-y-2">
                        <FolderTree className="w-10 h-10 mx-auto text-slate-600" />
                        <p className="font-semibold text-slate-300">Nenhuma categoria encontrada</p>
                        <p className="text-xs text-slate-500">
                          {searchTerm
                            ? `Nenhum resultado corresponde à busca "${searchTerm}".`
                            : "Comece cadastrando sua primeira categoria no botão acima."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => {
                    const productCount = cat._count?.products ?? 0;
                    return (
                      <tr
                        key={cat.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Nome & Descrição */}
                        <td className="py-4 px-6">
                          <div className="space-y-0.5">
                            <span className="font-bold text-white text-base group-hover:text-rose-400 transition-colors flex items-center gap-2">
                              {cat.name}
                            </span>
                            {cat.description && (
                              <p className="text-xs text-slate-400 line-clamp-1 max-w-md">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Slug */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 font-mono text-xs bg-slate-950 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-md">
                            <Tag className="w-3 h-3 text-rose-500" />
                            {cat.slug}
                          </span>
                        </td>

                        {/* Qtd. Produtos Vinculados */}
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              productCount > 0
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            <ShoppingBag className="w-3 h-3" />
                            {productCount} {productCount === 1 ? "produto" : "produtos"}
                          </span>
                        </td>

                        {/* Status com Switch Rápido */}
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleToggleStatus(cat)}
                            disabled={isPending}
                            title={cat.isActive ? "Clique para desativar" : "Clique para ativar"}
                            className="inline-flex items-center gap-2 text-xs font-bold transition-all"
                          >
                            <div
                              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                                cat.isActive ? "bg-emerald-600" : "bg-slate-800 border border-slate-700"
                              }`}
                            >
                              <div
                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                  cat.isActive ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </div>
                            <span
                              className={`text-xs font-semibold ${
                                cat.isActive ? "text-emerald-400" : "text-slate-500"
                              }`}
                            >
                              {cat.isActive ? "Ativa" : "Inativa"}
                            </span>
                          </button>
                        </td>

                        {/* Ações */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(cat)}
                              title="Editar Categoria"
                              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenDeleteModal(cat)}
                              title="Excluir Categoria"
                              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
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
      </main>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cabeçalho do Modal */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-500">
                <FolderTree className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                </span>
              </div>
              <h2 className="text-xl font-black text-white">
                {editingCategory ? `Editar "${editingCategory.name}"` : "Cadastrar Nova Categoria"}
              </h2>
              <p className="text-xs text-slate-400">
                O slug será gerado automaticamente a partir do nome e servirá para filtros na loja.
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Campo Nome */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Nome da Categoria <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Leggings Emana, Tops Alta Sustentação..."
                  className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all ${
                    formErrors.name || clientValidation
                      ? "border-rose-500/50 bg-rose-950/10"
                      : "border-slate-800"
                  }`}
                />

                {/* Preview de Slug em tempo real */}
                {formData.name.trim() && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
                    <span className="text-slate-500">Slug gerado:</span>
                    <span className="font-mono text-rose-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-semibold">
                      /{computedSlug}
                    </span>
                  </div>
                )}

                {/* Erros de Validação */}
                {(formErrors.name || clientValidation) && (
                  <p className="text-xs text-rose-400 font-medium flex items-center gap-1 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {formErrors.name || clientValidation}
                  </p>
                )}
              </div>

              {/* Campo Descrição */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Descrição Rápida (Opcional / SEO)
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Modelagem de alta performance para treinos intensos..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-sm resize-none"
                />
                {formErrors.description && (
                  <p className="text-xs text-rose-400 font-medium">{formErrors.description}</p>
                )}
              </div>

              {/* Campo Status Ativo */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <span className="text-sm font-bold text-white block">Status da Categoria</span>
                  <span className="text-xs text-slate-400">
                    Categorias inativas não aparecem nos filtros da loja pública.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className="inline-flex items-center gap-2 cursor-pointer"
                >
                  <div
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      formData.isActive ? "bg-emerald-600" : "bg-slate-800 border border-slate-700"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        formData.isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </button>
              </div>

              {/* Botões do Formulário */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submitting || !!clientValidation}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : editingCategory ? (
                    "Atualizar Categoria"
                  ) : (
                    "Salvar Categoria"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO SEGURA COM PROTEÇÃO DE INTEGRIDADE */}
      {deleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl relative">
            {/* CASO A: BLOQUEIO POR INTEGRIDADE REFERENCIAL (_count.products > 0) */}
            {(categoryToDelete._count?.products ?? 0) > 0 ? (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-lg font-black text-white">Exclusão Bloqueada</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Esta categoria não pode ser excluída pois possui{" "}
                    <span className="font-bold text-amber-400">
                      {categoryToDelete._count?.products} produto(s) associado(s)
                    </span>
                    .
                  </p>
                  <p className="text-xs text-slate-500">
                    Reatribua os produtos para outra categoria antes de remover para preservar a integridade do catálogo.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setCategoryToDelete(null);
                    }}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            ) : (
              /* CASO B: SEM PRODUTOS VINCULADOS - MODAL DESTRUTIVO DE CONFIRMAÇÃO */
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-lg font-black text-white">Confirmar Exclusão</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Tem certeza de que deseja excluir permanentemente a categoria{" "}
                    <span className="font-bold text-rose-400">"{categoryToDelete.name}"</span>?
                  </p>
                  <p className="text-xs text-slate-500">
                    Esta ação é irreversível e o slug deixará de existir.
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setCategoryToDelete(null);
                    }}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors text-sm"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {deleting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Excluindo...
                      </>
                    ) : (
                      "Confirmar Exclusão"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
