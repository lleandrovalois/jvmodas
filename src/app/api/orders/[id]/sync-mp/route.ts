import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mpPayment } from "@/lib/mercadopago";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await req.json().catch(() => ({}));
    const paymentId = body.paymentId;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    if (order.paymentStatus === "APPROVED") {
      return NextResponse.json({ success: true, order });
    }

    const checkPaymentId = paymentId || order.paymentId;

    if (checkPaymentId) {
      try {
        const paymentData = await mpPayment.get({ id: String(checkPaymentId) });

        if (paymentData.status === "approved") {
          const updated = await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: "APPROVED",
              orderStatus: "PAGO",
              paymentId: String(checkPaymentId),
              paymentMethod: paymentData.payment_method_id?.toUpperCase() || order.paymentMethod,
            },
            include: { items: true },
          });

          return NextResponse.json({ success: true, updated: true, order: updated });
        }
      } catch (err: any) {
        console.warn("Sync MP notice:", err?.message || err);
      }
    }

    return NextResponse.json({ success: true, updated: false, order });
  } catch (error: any) {
    console.error("Error syncing payment with Mercado Pago:", error);
    return NextResponse.json(
      { error: "Erro ao sincronizar pagamento: " + (error?.message || error) },
      { status: 500 }
    );
  }
}
