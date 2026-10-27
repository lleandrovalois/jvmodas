import { NextResponse } from "next/server";
import { getCategoriesWithCount, createCategory } from "@/actions/categories";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const result = await getCategoriesWithCount(search);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createCategory(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("API POST categories error:", error);
    return NextResponse.json(
      { error: "Erro ao processar criação de categoria" },
      { status: 500 }
    );
  }
}
