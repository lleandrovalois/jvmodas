import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        variants: true,
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product by id:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produto" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const {
      name,
      description,
      category,
      originalPrice,
      price,
      images,
      featured,
      badge,
      variants,
    } = body;

    let categoryId = body.categoryId;
    if (!categoryId && (category || body.category)) {
      const catIdentifier = category || body.category;
      const foundCat = await prisma.category.findFirst({
        where: {
          OR: [
            { id: catIdentifier },
            { name: catIdentifier },
            { slug: catIdentifier },
          ],
        },
      });
      if (foundCat) categoryId = foundCat.id;
    }

    // Delete existing variants and re-create if provided
    if (variants && Array.isArray(variants)) {
      await prisma.productVariant.deleteMany({
        where: { productId: id },
      });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}),
        originalPrice: Number(originalPrice),
        price: Number(price),
        images: typeof images === "string" ? images : JSON.stringify(images),
        featured: Boolean(featured),
        badge: badge || null,
        ...(variants && Array.isArray(variants)
          ? {
              variants: {
                create: variants.map((v: { size: string; color: string; colorHex: string; stock: number; sku?: string }) => ({
                  size: v.size,
                  color: v.color,
                  colorHex: v.colorHex || "#18181b",
                  stock: Number(v.stock) || 0,
                  sku: v.sku || undefined,
                })),
              },
            }
          : {}),
      },
      include: {
        variants: true,
        category: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Produto removido com sucesso" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Erro ao remover produto" },
      { status: 500 }
    );
  }
}
