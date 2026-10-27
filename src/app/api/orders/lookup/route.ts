import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || searchParams.get("query") || "").trim();

    if (!query) {
      return NextResponse.json(
        { error: "Por favor, digite o número do pedido, seu e-mail ou CPF." },
        { status: 400 }
      );
    }

    const cleanDigits = query.replace(/\D/g, "");
    const isEmail = query.includes("@");
    const upperQuery = query.toUpperCase();

    // 1. Check if direct Order ID (e.g. JVM-123456 or 123456)
    if (upperQuery.startsWith("JVM-") || (!isEmail && cleanDigits.length === 6)) {
      const orderId = upperQuery.startsWith("JVM-") ? upperQuery : `JVM-${cleanDigits}`;
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (order) {
        return NextResponse.json({
          success: true,
          type: "single",
          count: 1,
          orders: [order],
        });
      }
    }

    // 2. Search by Email or CPF or Phone
    const conditions: any[] = [];

    // Search by exact ID
    conditions.push({ id: { equals: upperQuery } });

    // Search by Email
    if (isEmail) {
      conditions.push({ customerEmail: { equals: query.toLowerCase() } });
    }

    // Search by CPF / Phone
    if (cleanDigits.length >= 8) {
      conditions.push({ customerCpf: { contains: cleanDigits } });
      conditions.push({ customerPhone: { contains: cleanDigits } });
      // Also format standard CPF xxx.xxx.xxx-xx if 11 digits
      if (cleanDigits.length === 11) {
        const formattedCpf = cleanDigits.replace(
          /(\d{3})(\d{3})(\d{3})(\d{2})/,
          "$1.$2.$3-$4"
        );
        conditions.push({ customerCpf: { contains: formattedCpf } });
      }
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: conditions,
      },
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take: 20,
    });

    if (orders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          count: 0,
          orders: [],
          message: "Nenhum pedido encontrado com os dados informados.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      type: orders.length === 1 ? "single" : "list",
      count: orders.length,
      orders,
    });
  } catch (error: any) {
    console.error("Error looking up order:", error);
    return NextResponse.json(
      { error: "Erro ao consultar pedidos: " + (error?.message || "Erro desconhecido") },
      { status: 500 }
    );
  }
}
