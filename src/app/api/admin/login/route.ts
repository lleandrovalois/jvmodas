import { NextResponse } from "next/server";
import { createAdminSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const correctPassword = process.env.ADMIN_PASSWORD || "jv291615";

    if (!password || password !== correctPassword) {
      return NextResponse.json(
        { error: "Senha de administrador incorreta." },
        { status: 401 }
      );
    }

    await createAdminSession(req);

    return NextResponse.json({
      success: true,
      message: "Autenticação realizada com sucesso.",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erro ao processar login." },
      { status: 500 }
    );
  }
}
