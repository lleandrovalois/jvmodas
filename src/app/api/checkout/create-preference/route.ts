import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMercadoPagoPreference } from "@/lib/mercadopago";
import { calculateShippingOptions } from "@/lib/shipping";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customer, shipping, items, couponCode } = body;

    // 1. Basic validation
    if (!customer?.name || !customer?.email || !customer?.cpf || !customer?.phone) {
      return NextResponse.json(
        { error: "Por favor, preencha todos os dados pessoais do comprador (Nome, E-mail, CPF e Telefone)." },
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

    if (!isPickup && (!shippingCep || !shippingStreet || !shippingNumber || !shippingCity || !shippingState)) {
      return NextResponse.json(
        { error: "Por favor, preencha todos os dados de entrega (CEP, Rua, Número, Cidade e Estado)." },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Nenhum produto selecionado no carrinho." },
        { status: 400 }
      );
    }

    // 2. Validate Items & Stock
    const variantIds = items.map((i: any) => i.variantId).filter(Boolean);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    });

    let subtotal = 0;
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

    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) {
        return NextResponse.json(
          { error: `Produto ou variação selecionada não encontrada no sistema.` },
          { status: 400 }
        );
      }

      if (variant.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Estoque insuficiente para "${variant.product.name}" (${variant.size} / ${variant.color}). Disponível: ${variant.stock}.`,
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

    // 3. Fetch CMS settings for Free Shipping rule and verify shipping rates
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

    // 4. Calculate coupon discount
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

    // 5. Generate Order ID
    const orderId = `JVM-${Math.floor(100000 + Math.random() * 900000)}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jvmodas.klynner.com.br";

    // 6. Create Mercado Pago Preference (Checkout Pro Modal)
    const prefResult = await createMercadoPagoPreference({
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
        cpf: customer.cpf,
        phone: customer.phone,
      },
      shippingPrice,
      backUrls: {
        success: `${baseUrl}/pedido/sucesso`,
        failure: `${baseUrl}/checkout`,
        pending: `${baseUrl}/pedido/sucesso`,
      },
      notificationUrl: `${baseUrl}/api/webhooks/mercadopago`,
      autoReturn: "approved",
    });

    if (!prefResult.success || !prefResult.preferenceId) {
      return NextResponse.json(
        { error: prefResult.error || "Não foi possível inicializar o Mercado Pago. Tente novamente." },
        { status: 500 }
      );
    }

    // 7. Persist Order in database inside Transaction
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
      return await tx.order.create({
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
          paymentMethod: "MERCADO_PAGO",
          paymentStatus: "PENDING",
          orderStatus: "REALIZADO",
          preferenceId: prefResult.preferenceId,
          mercadoPagoUrl: prefResult.initPoint,
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
    });

    const publicKey =
      process.env.MERCADO_PAGO_PUBLIC_KEY || "APP_USR-99be3c75-f500-49f6-90c9-61483019d51f";

    return NextResponse.json(
      {
        success: true,
        orderId: newOrder.id,
        preferenceId: prefResult.preferenceId,
        initPoint: prefResult.initPoint,
        publicKey,
        total: newOrder.total,
        order: newOrder,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating checkout preference:", error);
    return NextResponse.json(
      { error: "Falha ao processar checkout: " + (error?.message || "Tente novamente") },
      { status: 500 }
    );
  }
}
