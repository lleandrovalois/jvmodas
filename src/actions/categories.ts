"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";
import { categorySchema, slugify, CategoryInput } from "@/lib/validations/category";
import { Category, CategoryWithCount } from "@/types";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  productCount?: number;
}

/**
 * Revalida as rotas do frontend e painel administrativo que consom as categorias.
 */
function revalidateCategoryPaths() {
  try {
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/categorias");
    revalidatePath("/admin/produtos");
  } catch (err) {
    console.warn("Aviso ao revalidar caminhos de cache:", err);
  }
}

/**
 * Busca todas as categorias com a contagem de produtos vinculados.
 */
export async function getCategoriesWithCount(
  search?: string
): Promise<ActionResult<CategoryWithCount[]>> {
  try {
    const categories = await prisma.category.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { slug: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      success: true,
      data: categories as unknown as CategoryWithCount[],
    };
  } catch (error) {
    console.error("Erro em getCategoriesWithCount:", error);
    return {
      success: false,
      error: "Falha ao listar categorias do banco de dados.",
    };
  }
}

/**
 * Cria uma nova categoria com slug gerado automaticamente e validação de unicidade case-insensitive.
 */
export async function createCategory(
  formData: CategoryInput
): Promise<ActionResult<Category>> {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return { success: false, error: "Acesso não autorizado. Efetue login como administrador." };
    }

    const validation = categorySchema.safeParse(formData);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues.map((e) => e.message).join(" "),
      };
    }

    const { name, description, isActive } = validation.data;
    const trimmedName = name.trim();
    const slug = slugify(trimmedName);

    if (!slug) {
      return { success: false, error: "O nome fornecido não gerou um slug válido." };
    }

    // Validação de unicidade case-insensitive (Nome e Slug)
    const existingCategories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true },
    });

    const nameExists = existingCategories.some(
      (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameExists) {
      return {
        success: false,
        error: `Já existe uma categoria cadastrada com o nome "${trimmedName}".`,
      };
    }

    const slugExists = existingCategories.some((c) => c.slug === slug);
    if (slugExists) {
      return {
        success: false,
        error: `O identificador (slug) "${slug}" já está em uso por outra categoria.`,
      };
    }

    const newCategory = await prisma.category.create({
      data: {
        name: trimmedName,
        slug,
        description: description || null,
        isActive: isActive ?? true,
      },
    });

    revalidateCategoryPaths();

    return {
      success: true,
      data: newCategory as unknown as Category,
      message: "Categoria criada com sucesso!",
    };
  } catch (error) {
    console.error("Erro em createCategory:", error);
    return {
      success: false,
      error: "Erro inesperado ao registrar categoria.",
    };
  }
}

/**
 * Atualiza os dados de uma categoria existente e recalcula o slug se o nome for alterado.
 */
export async function updateCategory(
  id: string,
  formData: CategoryInput
): Promise<ActionResult<Category>> {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return { success: false, error: "Acesso não autorizado. Efetue login como administrador." };
    }

    const validation = categorySchema.safeParse(formData);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues.map((e) => e.message).join(" "),
      };
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return { success: false, error: "Categoria não encontrada para atualização." };
    }

    const { name, description, isActive } = validation.data;
    const trimmedName = name.trim();
    const newSlug = slugify(trimmedName);

    // Validação de unicidade case-insensitive com outras categorias
    const otherCategories = await prisma.category.findMany({
      where: { id: { not: id } },
      select: { id: true, name: true, slug: true },
    });

    const nameExists = otherCategories.some(
      (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameExists) {
      return {
        success: false,
        error: `Já existe outra categoria cadastrada com o nome "${trimmedName}".`,
      };
    }

    const slugExists = otherCategories.some((c) => c.slug === newSlug);
    if (slugExists) {
      return {
        success: false,
        error: `O slug "${newSlug}" já está em uso por outra categoria.`,
      };
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: trimmedName,
        slug: newSlug,
        description: description || null,
        isActive: isActive ?? true,
      },
    });

    revalidateCategoryPaths();

    return {
      success: true,
      data: updatedCategory as unknown as Category,
      message: "Categoria atualizada com sucesso!",
    };
  } catch (error) {
    console.error("Erro em updateCategory:", error);
    return {
      success: false,
      error: "Erro inesperado ao atualizar categoria.",
    };
  }
}

/**
 * Alterna o status ativo/inativo de uma categoria rapidamente.
 */
export async function toggleCategoryStatus(
  id: string
): Promise<ActionResult<Category>> {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return { success: false, error: "Acesso não autorizado." };
    }

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return { success: false, error: "Categoria não encontrada." };
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        isActive: !category.isActive,
      },
    });

    revalidateCategoryPaths();

    return {
      success: true,
      data: updated as unknown as Category,
      message: `Categoria ${updated.isActive ? "ativada" : "desativada"} com sucesso.`,
    };
  } catch (error) {
    console.error("Erro em toggleCategoryStatus:", error);
    return {
      success: false,
      error: "Falha ao alterar status da categoria.",
    };
  }
}

/**
 * Exclusão segura com proteção de integridade referencial:
 * Se houver produtos vinculados (_count.products > 0), a exclusão é estritamente bloqueada.
 */
export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return { success: false, error: "Acesso não autorizado." };
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return { success: false, error: "Categoria não encontrada." };
    }

    const productCount = category._count?.products ?? 0;
    if (productCount > 0) {
      return {
        success: false,
        error: `Esta categoria não pode ser excluída pois possui ${productCount} produto(s) associado(s). Reatribua os produtos antes de remover.`,
        productCount,
      };
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidateCategoryPaths();

    return {
      success: true,
      message: `Categoria "${category.name}" excluída com sucesso.`,
      productCount: 0,
    };
  } catch (error) {
    console.error("Erro em deleteCategory:", error);
    return {
      success: false,
      error: "Falha ao excluir categoria. Verifique vínculos e tente novamente.",
    };
  }
}
