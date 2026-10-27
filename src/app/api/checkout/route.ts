import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPixPayment } from "@/lib/pix";
import { createMercadoPagoPix, createMercadoPagoPreference } from "@/lib/mercadopago";
import { calculateShippingOptions } from "@/lib/shipping";

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

    const isPickup = shipping?.method === "Retirada no Local";
    const shippingState = shipping?.state || (isPickup ? "SP" : "");
    const shippingCity = shipping?.city || (isPickup ? "São Paulo" : "");
    const shippingStreet = shipping?.street || (isPickup ? "Showroom JVMODAS - Retirada Presencial" : "");
    const shippingNumber = shipping?.number || (isPickup ? "Balcão" : "");
    const shippingNeighborhood = shipping?.neighborhood || (isPickup ? "Centro" : "");
    const shippingCep = shipping?.cep || (isPickup ? "01001-000" : "");

    if (!isPickup && (!shippingCep || !shippingStreet || !shippingNumber || !shippingCity)) {
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

    // 2. Fetch CMS settings for Free Shipping rule and verify shipping rates
    const cms = await prisma.cmsSettings.findUnique({ where: { id: "default" } });
    const freeShippingThreshold = cms?.freeShippingThreshold ?? 199.0;

    let shippingPrice = 0;
    if (isPickup) {
      shippingPrice = 0;
    } else {
      const options = calculateShippingOptions(shippingState, subtotal, freeShippingThreshold);
      const matched = options.find((o) => o.method === shipping.method);
      shippingPrice = matched ? matched.price : Number(shipping.price) || 0;
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

    let mercadoPagoUrl: string | null = null;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jvmodas.klynner.com.br";

    if (payment.method === "PIX") {
      const [firstName, ...rest] = (customer.name || "").trim().split(" ");
      const lastName = rest.join(" ") || "Cliente";

      // 1. Tenta gerar via Mercado Pago oficial
      const mpResult = await createMercadoPagoPix({
        transactionAmount: total,
        description: `Pedido ${orderId} - ${cms?.brandName || "JVMODAS FITNESS"}`,
        orderId,
        payer: {
          email: customer.email,
          firstName,
          lastName,
          cpf: customer.cpf,
        },
        notificationUrl: `${baseUrl}/api/webhook/payment`,
      });

      if (mpResult.success && mpResult.qrCode) {
        pixCopyPasteCode = mpResult.qrCode;
        pixQrCodeUrl = mpResult.qrCodeBase64;
      } else {
        // Fallback seguro para gerador padrão EMV Pix
        const pix = await createPixPayment({
          amount: total,
          txId: orderId,
          merchantName: cms?.brandName || "JVMODAS FITNESS",
        });
        pixQrCodeUrl = pix.qrCodeDataUrl;
        pixCopyPasteCode = pix.copiaECola;
      }
      paymentStatus = "PENDING";
    } else if (payment.method === "CREDIT_CARD") {
      const cleanCard = (payment.card?.number || "").replace(/\D/g, "");
      cardLastDigits = cleanCard.slice(-4) || "4242";
      cardInstallments = Number(payment.card?.installments) || 1;

      // Gera link oficial do Mercado Pago para pagamento seguro
      try {
        const pref = await createMercadoPagoPreference({
          orderId,
          items: validatedItems.map((v) => ({
            id: v.variantId,
            title: `${v.productName} (${v.size}/${v.color})`,
            unitPrice: v.price,
            quantity: v.quantity,
            pictureUrl: v.imageUrl,
          })),
          payer: {
            name: customer.name,
            email: customer.email,
          },
          shippingPrice,
          backUrls: {
            success: `${baseUrl}/order-confirmed/${orderId}`,
            failure: `${baseUrl}/checkout`,
            pending: `${baseUrl}/order-confirmed/${orderId}`,
          },
          notificationUrl: `${baseUrl}/api/webhook/payment`,
        });
        if (pref.success && pref.initPoint) {
          mercadoPagoUrl = pref.initPoint;
        }
      } catch (e) {
        console.warn("Mercado Pago Preference generation notice:", e);
      }

      paymentStatus = "PENDING";
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
          shippingCep,
          shippingStreet,
          shippingNumber,
          shippingComplement: shipping.complement || null,
          shippingNeighborhood,
          shippingCity,
          shippingState,
          shippingMethod: shipping.method || (isPickup ? "Retirada no Local" : "PAC Econômico"),
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
        mercadoPagoUrl,
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
