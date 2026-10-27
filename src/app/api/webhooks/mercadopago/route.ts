import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mpPayment } from "@/lib/mercadopago";

export async function processMercadoPagoWebhook(req: Request) {
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

    let orderId: string | undefined = body.orderId;
    let paymentId: string | undefined = undefined;
    let paymentStatus: "APPROVED" | "PENDING" | "CANCELLED" = "APPROVED";
    let orderStatus: "REALIZADO" | "PAGO" | "CANCELADO" = "PAGO";
    let paymentMethod: string | undefined = undefined;
    let pixQrCodeUrl: string | undefined = undefined;
    let pixCopyPasteCode: string | undefined = undefined;

    const mpPaymentId = body.data?.id || queryId || (topic === "payment" ? queryId : undefined);

    if (mpPaymentId) {
      paymentId = String(mpPaymentId);
      try {
        const paymentData = await mpPayment.get({ id: String(mpPaymentId) });
        if (paymentData.external_reference) {
          orderId = paymentData.external_reference;
        }
        if (paymentData.payment_method_id) {
          paymentMethod = paymentData.payment_method_id.toUpperCase();
        }

        const qrCode = paymentData.point_of_interaction?.transaction_data?.qr_code;
        const qrCodeBase64 = paymentData.point_of_interaction?.transaction_data?.qr_code_base64;
        if (qrCode) pixCopyPasteCode = qrCode;
        if (qrCodeBase64) pixQrCodeUrl = `data:image/png;base64,${qrCodeBase64}`;

        if (paymentData.status === "approved") {
          paymentStatus = "APPROVED";
          orderStatus = "PAGO";
        } else if (paymentData.status === "rejected" || paymentData.status === "cancelled") {
          paymentStatus = "CANCELLED";
          orderStatus = "CANCELADO";
        } else {
          paymentStatus = "PENDING";
          orderStatus = "REALIZADO";
        }
      } catch (err: any) {
        console.warn("Mercado Pago Webhook lookup error:", err?.message || err);
      }
    }

    if (!orderId && (body.external_reference || body.data?.external_reference)) {
      orderId = body.external_reference || body.data?.external_reference;
    }

    if (!orderId) {
      return NextResponse.json(
        { message: "Aviso: Notificação de webhook recebida sem ID de pedido vinculado." },
        { status: 200 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: `Pedido ${orderId} não encontrado no banco de dados.` },
        { status: 404 }
      );
    }

    const updateData: any = {
      paymentStatus,
      orderStatus,
    };

    if (paymentId) updateData.paymentId = paymentId;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (pixQrCodeUrl) updateData.pixQrCodeUrl = pixQrCodeUrl;
    if (pixCopyPasteCode) updateData.pixCopyPasteCode = pixCopyPasteCode;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Status do pedido ${orderId} atualizado para ${paymentStatus} (${orderStatus}) via Webhook.`,
      order: updated,
    });
  } catch (error: any) {
    console.error("Error processing Mercado Pago webhook:", error);
    return NextResponse.json(
      { error: "Erro interno no webhook: " + (error?.message || "Erro desconhecido") },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return processMercadoPagoWebhook(req);
}

export async function GET(req: Request) {
  return processMercadoPagoWebhook(req);
}
