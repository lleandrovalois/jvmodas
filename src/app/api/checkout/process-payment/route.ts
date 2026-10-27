import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mpPayment } from "@/lib/mercadopago";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, formData } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Identificador do pedido (orderId) ausente." },
        { status: 400 }
      );
    }

    if (!formData || !formData.payment_method_id) {
      return NextResponse.json(
        { success: false, error: "Dados de pagamento do Mercado Pago ausentes." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: `Pedido ${orderId} não encontrado.` },
        { status: 404 }
      );
    }

    // Payer formatting
    const cleanCpf = (formData.payer?.identification?.number || order.customerCpf || "").replace(/\D/g, "");
    const [firstName, ...rest] = (order.customerName || "Cliente").trim().split(" ");
    const lastName = rest.join(" ") || "Cliente";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jvmodas.klynner.com.br";

    const paymentBody: any = {
      transaction_amount: Number(order.total.toFixed(2)),
      description: `Pedido ${order.id} - JVMODAS FITNESS`,
      payment_method_id: formData.payment_method_id,
      payer: {
        email: formData.payer?.email || order.customerEmail,
        first_name: formData.payer?.first_name || firstName,
        last_name: formData.payer?.last_name || lastName,
        identification: {
          type: formData.payer?.identification?.type || "CPF",
          number: cleanCpf || "19119119100",
        },
      },
      external_reference: order.id,
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      statement_descriptor: "JVMODAS",
    };

    // Credit / Debit Card specifics
    if (formData.token) {
      paymentBody.token = formData.token;
      paymentBody.installments = Number(formData.installments || 1);
      if (formData.issuer_id) {
        paymentBody.issuer_id = Number(formData.issuer_id);
      }
    }

    // Unique Idempotency Key
    const idempotencyKey = `pay-${order.id}-${Date.now()}`;

    const paymentRes = await mpPayment.create({
      body: paymentBody,
      requestOptions: {
        idempotencyKey,
      },
    });

    const status = paymentRes.status;
    const statusDetail = paymentRes.status_detail;
    const paymentId = String(paymentRes.id);

    // 1. APPROVED
    if (status === "approved") {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "APPROVED",
          orderStatus: "PAGO",
          paymentId,
          paymentMethod: paymentRes.payment_method_id?.toUpperCase() || order.paymentMethod,
          cardLastDigits: paymentRes.card?.last_four_digits || order.cardLastDigits,
          cardInstallments: paymentRes.installments || order.cardInstallments,
        },
        include: { items: true },
      });

      return NextResponse.json({
        success: true,
        status: "approved",
        statusDetail,
        paymentId,
        order: updatedOrder,
      });
    }

    // 2. PENDING / IN_PROCESS (Pix, Boleto, Analise Manual)
    if (status === "pending" || status === "in_process") {
      const qrCode = paymentRes.point_of_interaction?.transaction_data?.qr_code || null;
      const qrCodeBase64 = paymentRes.point_of_interaction?.transaction_data?.qr_code_base64 || null;

      const updateData: any = {
        paymentStatus: "PENDING",
        paymentId,
        paymentMethod: paymentRes.payment_method_id?.toUpperCase() || order.paymentMethod,
      };

      if (qrCode) updateData.pixCopyPasteCode = qrCode;
      if (qrCodeBase64) updateData.pixQrCodeUrl = `data:image/png;base64,${qrCodeBase64}`;
      if (paymentRes.card?.last_four_digits) updateData.cardLastDigits = paymentRes.card.last_four_digits;
      if (paymentRes.installments) updateData.cardInstallments = paymentRes.installments;

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: updateData,
        include: { items: true },
      });

      return NextResponse.json({
        success: true,
        status,
        statusDetail,
        paymentId,
        pix: qrCode
          ? {
              qrCode,
              qrCodeBase64: qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : null,
            }
          : null,
        order: updatedOrder,
      });
    }

    // 3. REJECTED
    const rejectionMessages: Record<string, string> = {
      cc_rejected_bad_filled_card_number: "Número de cartão inválido. Verifique os dígitos.",
      cc_rejected_bad_filled_date: "Data de vencimento incorreta.",
      cc_rejected_bad_filled_security_code: "Código de segurança (CVV) inválido.",
      cc_rejected_bad_filled_other: "Dados do cartão incorretos.",
      cc_rejected_insufficient_amount: "Saldo insuficiente no cartão.",
      cc_rejected_call_for_authorize: "Pagamento não autorizado pelo banco emissor. Ligue para a central do seu cartão.",
      cc_rejected_card_disabled: "O cartão informado não está desbloqueado ou ativo.",
      cc_rejected_duplicated_payment: "Um pagamento idêntico foi processado recentemente.",
      cc_rejected_high_risk: "Pagamento recusado por segurança. Sugerimos tentar pagar com PIX.",
      cc_rejected_max_attempts: "Limite de tentativas excedido. Tente novamente mais tarde ou use Pix.",
    };

    const friendlyError =
      rejectionMessages[statusDetail || ""] ||
      "O pagamento foi recusado pela operadora do cartão. Verifique os dados ou tente pagar via PIX.";

    return NextResponse.json(
      {
        success: false,
        status: "rejected",
        statusDetail,
        paymentId,
        error: friendlyError,
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error processing Mercado Pago payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Ocorreu um erro ao processar o pagamento com o Mercado Pago.",
      },
      { status: 500 }
    );
  }
}
