import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateCategory, deleteCategory } from "@/actions/categories";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("API GET category error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar categoria." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = await updateCategory(id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("API PUT category error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar categoria." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteCategory(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, productCount: result.productCount },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    console.error("API DELETE category error:", error);
    return NextResponse.json(
      { error: "Erro ao excluir categoria." },
      { status: 500 }
    );
  }
}
