import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mpPayment } from "@/lib/mercadopago";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic") || searchParams.get("type");
    const queryId = searchParams.get("id") || searchParams.get("data.id");

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // Support both direct orderId and standard MercadoPago / Asaas webhook payloads
    let orderId: string | undefined = body.orderId;
    let paymentStatus: "APPROVED" | "PENDING" | "CANCELLED" = "APPROVED";

    const mpPaymentId = body.data?.id || queryId || (topic === "payment" ? queryId : undefined);

    if (mpPaymentId) {
      try {
        const paymentData = await mpPayment.get({ id: String(mpPaymentId) });
        if (paymentData.external_reference) {
          orderId = paymentData.external_reference;
        }
        if (paymentData.status === "approved") {
          paymentStatus = "APPROVED";
        } else if (paymentData.status === "rejected" || paymentData.status === "cancelled") {
          paymentStatus = "CANCELLED";
        } else {
          paymentStatus = "PENDING";
        }
      } catch (err: any) {
        console.warn("Mercado Pago Webhook lookup notice:", err?.message || err);
      }
    }

    if (!orderId && (body.external_reference || body.data?.external_reference)) {
      orderId = body.external_reference || body.data?.external_reference;
    }

    if (!orderId && body.payment?.externalReference) {
      // Asaas webhook format
      orderId = body.payment.externalReference;
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "Identificador do pedido (orderId) não identificado no webhook." },
        { status: 200 } // Return 200 to acknowledge MP notifications even if unhandled
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: `Pedido ${orderId} não encontrado no sistema.` },
        { status: 404 }
      );
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Status do pedido ${orderId} atualizado para ${paymentStatus} via Webhook.`,
      order: updated,
    });
  } catch (error) {
    console.error("Error processing payment webhook:", error);
    return NextResponse.json(
      { error: "Erro ao processar notificação de webhook" },
      { status: 500 }
    );
  }
}
