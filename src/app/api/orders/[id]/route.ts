import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Erro ao buscar detalhes do pedido" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { paymentStatus, trackingCode } = body;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(trackingCode !== undefined ? { trackingCode } : {}),
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status do pedido" },
      { status: 500 }
    );
  }
}
