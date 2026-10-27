import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPixPayment } from "@/lib/pix";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customer, shipping, payment, items, couponCode } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Nenhum produto selecionado no carrinho." },
        { status: 400 }
      );
    }

    if (!customer?.name || !customer?.email || !customer?.cpf || !customer?.phone) {
      return NextResponse.json(
        { error: "Preencha todos os dados pessoais obrigatórios." },
        { status: 400 }
      );
    }

    if (!shipping?.cep || !shipping?.street || !shipping?.number || !shipping?.city) {
      return NextResponse.json(
        { error: "Endereço de entrega incompleto." },
        { status: 400 }
      );
    }

    // 1. Calculate subtotal and verify stock
    interface ValidatedItem {
      variantId: string;
      productId: string;
      productName: string;
      size: string;
      color: string;
      price: number;
      quantity: number;
      imageUrl: string;
    }

    const validatedItems: ValidatedItem[] = [];
    let subtotal = 0;

    for (const item of items) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });

      if (!variant) {
        return NextResponse.json(
          { error: `Variação do produto "${item.productName || item.variantId}" não encontrada.` },
          { status: 404 }
        );
      }

      if (variant.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Estoque insuficiente para "${variant.product.name}" (Tamanho: ${variant.size}, Cor: ${variant.color}). Disponível: ${variant.stock}.`,
          },
          { status: 400 }
        );
      }

      const itemTotal = variant.product.price * item.quantity;
      subtotal += itemTotal;

      let imageUrl = "";
      try {
        const parsed = JSON.parse(variant.product.images);
        imageUrl = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : "";
      } catch {
        imageUrl = variant.product.images || "";
      }

      validatedItems.push({
        variantId: variant.id,
        productId: variant.productId,
        productName: variant.product.name,
        size: variant.size,
        color: variant.color,
        price: variant.product.price,
        quantity: item.quantity,
        imageUrl,
      });
    }

    // 2. Fetch CMS settings for Free Shipping rule
    const cms = await prisma.cmsSettings.findUnique({ where: { id: "default" } });
    const freeShippingThreshold = cms?.freeShippingThreshold ?? 199.0;

    let shippingPrice = Number(shipping.price) || 0;
    if (subtotal >= freeShippingThreshold && shipping.method === "Frete Grátis") {
      shippingPrice = 0;
    }

    // 3. Calculate coupon discount
    let discount = 0;
    const cleanCoupon = (couponCode || "").trim().toUpperCase();
    if (cleanCoupon === "JV10") {
      discount = subtotal * 0.1; // 10%
    } else if (cleanCoupon === "PRIMEIRACOMPRA") {
      discount = subtotal * 0.15; // 15%
    } else if (cleanCoupon === "FITNESS20") {
      discount = subtotal * 0.2; // 20%
    }

    const total = Math.max(0, subtotal - discount + shippingPrice);

    // 4. Generate Unique Order ID (e.g. JVM-849102)
    const orderId = `JVM-${Math.floor(100000 + Math.random() * 900000)}`;

    // 5. Handle Payment Method
    let pixQrCodeUrl: string | null = null;
    let pixCopyPasteCode: string | null = null;
    let cardLastDigits: string | null = null;
    let cardInstallments: number | null = null;
    let paymentStatus = "PENDING";

    if (payment.method === "PIX") {
      const pix = await createPixPayment({
        amount: total,
        txId: orderId,
        merchantName: cms?.brandName || "JVMODAS FITNESS",
      });
      pixQrCodeUrl = pix.qrCodeDataUrl;
      pixCopyPasteCode = pix.copiaECola;
      paymentStatus = "PENDING";
    } else if (payment.method === "CREDIT_CARD") {
      const cleanCard = (payment.card?.number || "").replace(/\D/g, "");
      cardLastDigits = cleanCard.slice(-4) || "4242";
      cardInstallments = Number(payment.card?.installments) || 1;
      // In production, tokenize with Mercado Pago / Asaas SDK
      paymentStatus = "APPROVED";
    }

    // 6. Database Transaction: Create order, create items, decrement stock
    const newOrder = await prisma.$transaction(async (tx) => {
      // Decrement stock
      for (const item of validatedItems) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Create Order
      const createdOrder = await tx.order.create({
        data: {
          id: orderId,
          customerName: customer.name,
          customerEmail: customer.email,
          customerCpf: customer.cpf,
          customerPhone: customer.phone,
          shippingCep: shipping.cep,
          shippingStreet: shipping.street,
          shippingNumber: shipping.number,
          shippingComplement: shipping.complement || null,
          shippingNeighborhood: shipping.neighborhood || "",
          shippingCity: shipping.city,
          shippingState: shipping.state,
          shippingMethod: shipping.method || "PAC Econômico",
          shippingPrice,
          subtotal,
          discount,
          total,
          couponCode: cleanCoupon || null,
          paymentMethod: payment.method,
          paymentStatus,
          pixQrCodeUrl,
          pixCopyPasteCode,
          cardLastDigits,
          cardInstallments,
          items: {
            create: validatedItems.map((vi) => ({
              productId: vi.productId,
              productName: vi.productName,
              size: vi.size,
              color: vi.color,
              price: vi.price,
              quantity: vi.quantity,
              imageUrl: vi.imageUrl,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return createdOrder;
    });

    return NextResponse.json(
      {
        success: true,
        orderId: newOrder.id,
        status: newOrder.paymentStatus,
        total: newOrder.total,
        pixQrCodeUrl: newOrder.pixQrCodeUrl,
        pixCopyPasteCode: newOrder.pixCopyPasteCode,
        order: newOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating checkout order:", error);
    return NextResponse.json(
      { error: "Falha ao processar pedido. Verifique os dados e tente novamente." },
      { status: 500 }
    );
  }
}
