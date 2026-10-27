"use client";

import React from "react";
import { CmsProvider } from "@/context/CmsContext";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import { CmsSettings } from "@/types";

export function Providers({
  children,
  initialCms,
}: {
  children: React.ReactNode;
  initialCms?: CmsSettings | null;
}) {
  return (
    <CmsProvider initialSettings={initialCms}>
      <CartProvider>
        {children}
        <CartDrawer />
      </CartProvider>
    </CmsProvider>
  );
}
