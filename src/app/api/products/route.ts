import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");
    const size = searchParams.get("size");
    const featured = searchParams.get("featured");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (category && category !== "Todos") {
      where.category = category;
    }

    if (featured === "true") {
      where.featured = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
      ];
    }

    if (size) {
      where.variants = {
        some: {
          size: size,
          stock: { gt: 0 },
        },
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { createdAt: "desc" };
    if (sort === "price_asc") {
      orderBy = { price: "asc" };
    } else if (sort === "price_desc") {
      orderBy = { price: "desc" };
    } else if (sort === "best_sellers") {
      orderBy = { reviewsCount: "desc" };
    } else if (sort === "rating") {
      orderBy = { rating: "desc" };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        variants: true,
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      name,
      slug,
      description,
      category,
      originalPrice,
      price,
      images,
      featured,
      badge,
      variants,
    } = body;

    const generatedSlug =
      slug ||
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug: `${generatedSlug}-${Date.now().toString().slice(-4)}`,
        description: description || "",
        category: category || "Leggings",
        originalPrice: Number(originalPrice) || Number(price),
        price: Number(price),
        images: typeof images === "string" ? images : JSON.stringify(images || []),
        featured: Boolean(featured),
        badge: badge || null,
        variants: {
          create: (variants || []).map((v: { size: string; color: string; colorHex: string; stock: number; sku?: string }) => ({
            size: v.size,
            color: v.color,
            colorHex: v.colorHex || "#18181b",
            stock: Number(v.stock) || 0,
            sku: v.sku || undefined,
          })),
        },
      },
      include: {
        variants: true,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Erro ao criar produto no catálogo" },
      { status: 500 }
    );
  }
}
