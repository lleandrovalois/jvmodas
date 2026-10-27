"use client";

import React, { useState } from "react";
import { Product } from "@/types";
import { Navbar } from "@/components/Navbar";
import { HeroBanner } from "@/components/HeroBanner";
import { FeaturesBar } from "@/components/FeaturesBar";
import { VitrineSection } from "@/components/VitrineSection";
import { PromoBanner } from "@/components/PromoBanner";
import { Footer } from "@/components/Footer";

export function HomePageClient({ initialProducts }: { initialProducts: Product[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCategory, setCurrentCategory] = useState("Todos");

  const handleSelectCategory = (category: string) => {
    setCurrentCategory(category);
    const vitrineEl = document.getElementById("vitrine");
    vitrineEl?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Navbar
          onSearchChange={(val) => setSearchTerm(val)}
          currentCategory={currentCategory}
          onSelectCategory={handleSelectCategory}
        />
        <HeroBanner
          onCtaClick={() => {
            const vitrineEl = document.getElementById("vitrine");
            vitrineEl?.scrollIntoView({ behavior: "smooth" });
          }}
        />
        <FeaturesBar />
        <VitrineSection
          initialProducts={initialProducts}
          initialCategory={currentCategory}
          searchTerm={searchTerm}
        />
        <PromoBanner onSelectCategory={handleSelectCategory} />
      </div>
      <Footer />
    </div>
  );
}
