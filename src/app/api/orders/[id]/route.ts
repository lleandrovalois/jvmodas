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

    let mercadoPagoUrl: string | null = null;
    if (order.paymentStatus === "PENDING" && order.items.length > 0) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://177.7.60.189:3002";
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
          },
          shippingPrice: order.shippingPrice,
          backUrls: {
            success: `${baseUrl}/order-confirmed/${order.id}`,
            failure: `${baseUrl}/checkout`,
            pending: `${baseUrl}/order-confirmed/${order.id}`,
          },
        });
        if (pref.success) {
          mercadoPagoUrl = pref.sandboxInitPoint || pref.initPoint || null;
        }
      } catch (err) {
        console.warn("Could not generate Mercado Pago URL on get order:", err);
      }
    }

    return NextResponse.json({
      ...order,
      mercadoPagoUrl,
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
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status do pedido" },
      { status: 500 }
    );
  }
}
