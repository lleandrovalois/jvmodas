export interface ProductVariant {
  id: string;
  productId: string;
  size: string; // P, M, G, GG
  color: string;
  colorHex: string;
  stock: number;
  sku?: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  originalPrice: number;
  price: number;
  images: string; // JSON string of string[]
  featured: boolean;
  badge?: string | null;
  rating: number;
  reviewsCount: number;
  variants: ProductVariant[];
  createdAt: string | Date;
}

export interface CartItem {
  id: string; // `${variantId}`
  productId: string;
  variantId: string;
  productName: string;
  productSlug: string;
  imageUrl: string;
  size: string;
  color: string;
  colorHex: string;
  price: number;
  originalPrice: number;
  quantity: number;
  maxStock: number;
}

export interface CmsSettings {
  id: string;
  brandName: string;
  brandTagline: string;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  buttonTextColor: string;
  activePreset?: string;
  topBarText: string;
  topBarActive: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroBannerUrl: string;
  heroCtaText: string;
  promoBannerTitle: string;
  promoBannerSubtitle: string;
  promoBannerUrl: string;
  promoBannerLink: string;
  instagramUrl: string;
  whatsappNumber: string;
  freeShippingThreshold: number;
  updatedAt?: string | Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerCpf: string;
  customerPhone: string;
  shippingCep: string;
  shippingStreet: string;
  shippingNumber: string;
  shippingComplement?: string | null;
  shippingNeighborhood: string;
  shippingCity: string;
  shippingState: string;
  shippingMethod: string;
  shippingPrice: number;
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string | null;
  paymentMethod: "PIX" | "CREDIT_CARD";
  paymentStatus: "PENDING" | "APPROVED" | "CANCELLED" | "SHIPPED";
  trackingCode?: string | null;
  pixQrCodeUrl?: string | null;
  pixCopyPasteCode?: string | null;
  cardLastDigits?: string | null;
  cardInstallments?: number | null;
  items: OrderItem[];
  createdAt: string | Date;
}
