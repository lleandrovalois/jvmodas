import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";
import { createMercadoPagoPreference } from "@/lib/mercadopago";

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

    let mercadoPagoUrl: string | null = order.mercadoPagoUrl || null;
    let preferenceId: string | null = order.preferenceId || null;

    if (!mercadoPagoUrl && order.paymentStatus === "PENDING" && order.items.length > 0) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jvmodas.klynner.com.br";
        const pref = await createMercadoPagoPreference({
          orderId: order.id,
          items: order.items.map((v) => ({
            id: v.productId || v.id,
            title: `${v.productName} (${v.size}/${v.color})`,
            unitPrice: v.price,
            quantity: v.quantity,
            pictureUrl: v.imageUrl,
          })),
          payer: {
            name: order.customerName,
            email: order.customerEmail,
            cpf: order.customerCpf,
            phone: order.customerPhone,
          },
          shippingPrice: order.shippingPrice,
          backUrls: {
            success: `${baseUrl}/pedido/sucesso`,
            failure: `${baseUrl}/checkout`,
            pending: `${baseUrl}/pedido/sucesso`,
          },
          notificationUrl: `${baseUrl}/api/webhooks/mercadopago`,
        });
        if (pref.success && pref.initPoint) {
          mercadoPagoUrl = pref.initPoint;
          preferenceId = pref.preferenceId || null;
        }
      } catch (err) {
        console.warn("Could not generate Mercado Pago URL on get order:", err);
      }
    }

    return NextResponse.json({
      ...order,
      mercadoPagoUrl,
      preferenceId,
    });
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
    const { paymentStatus, orderStatus, trackingCode } = body;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(orderStatus ? { orderStatus } : {}),
        ...(trackingCode !== undefined ? { trackingCode } : {}),
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status do pedido" },
      { status: 500 }
    );
  }
}
