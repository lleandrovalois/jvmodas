import { NextResponse } from "next/server";
import { toggleCategoryStatus } from "@/actions/categories";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await toggleCategoryStatus(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("API PATCH category toggle error:", error);
    return NextResponse.json(
      { error: "Erro ao alternar status da categoria." },
      { status: 500 }
    );
  }
}
