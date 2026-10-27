import { prisma } from "@/lib/prisma";
import { HomePageClient } from "@/components/HomePageClient";
import { Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let products: Product[] = [];
  try {
    const rawProducts = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        variants: true,
        category: true,
      },
    });
    products = JSON.parse(JSON.stringify(rawProducts));
  } catch (error) {
    console.error("Error loading products on home page:", error);
  }

  return <HomePageClient initialProducts={products} />;
}
