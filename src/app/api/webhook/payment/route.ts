import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Support both direct orderId and standard MercadoPago / Asaas webhook payloads
    let orderId: string | undefined = body.orderId;

    if (!orderId && body.data?.id) {
      // Mercado Pago webhook format: { type: 'payment', data: { id: '...' } }
      // Or external reference
      orderId = body.external_reference || body.data?.external_reference;
    }

    if (!orderId && body.payment?.externalReference) {
      // Asaas webhook format
      orderId = body.payment.externalReference;
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "Identificador do pedido (orderId) não fornecido no payload." },
        { status: 400 }
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
        paymentStatus: "APPROVED",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Pagamento do pedido ${orderId} aprovado com sucesso via Webhook.`,
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
