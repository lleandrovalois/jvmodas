// Calculation rules for Shipping (PAC, SEDEX and Local Pickup) by Brazilian State (UF)

export interface ShippingRate {
  id: "RETIRADA" | "PAC" | "SEDEX" | "FRETE_GRATIS";
  method: string;
  name: string;
  subtitle: string;
  price: number;
  badge?: string;
  description: string;
}

export interface RegionShippingConfig {
  regionName: string;
  states: string[];
  pacPrice: number;
  pacDays: string;
  sedexPrice: number;
  sedexDays: string;
}

export const REGIONS_SHIPPING: RegionShippingConfig[] = [
  {
    regionName: "São Paulo (Origem)",
    states: ["SP"],
    pacPrice: 12.9,
    pacDays: "2 a 4 dias úteis",
    sedexPrice: 18.9,
    sedexDays: "1 a 2 dias úteis",
  },
  {
    regionName: "Sudeste",
    states: ["RJ", "MG", "ES"],
    pacPrice: 16.9,
    pacDays: "4 a 6 dias úteis",
    sedexPrice: 26.9,
    sedexDays: "2 a 3 dias úteis",
  },
  {
    regionName: "Sul",
    states: ["PR", "SC", "RS"],
    pacPrice: 19.9,
    pacDays: "5 a 7 dias úteis",
    sedexPrice: 32.9,
    sedexDays: "2 a 4 dias úteis",
  },
  {
    regionName: "Centro-Oeste",
    states: ["DF", "GO", "MT", "MS"],
    pacPrice: 22.9,
    pacDays: "6 a 8 dias úteis",
    sedexPrice: 38.9,
    sedexDays: "2 a 5 dias úteis",
  },
  {
    regionName: "Nordeste",
    states: ["BA", "PE", "CE", "PB", "RN", "AL", "SE", "PI", "MA"],
    pacPrice: 26.9,
    pacDays: "7 a 10 dias úteis",
    sedexPrice: 46.9,
    sedexDays: "3 a 6 dias úteis",
  },
  {
    regionName: "Norte",
    states: ["AM", "PA", "RO", "AC", "RR", "AP", "TO"],
    pacPrice: 32.9,
    pacDays: "10 a 14 dias úteis",
    sedexPrice: 58.9,
    sedexDays: "4 a 8 dias úteis",
  },
];

// Default rates when UF is unknown or not filled yet
export const DEFAULT_SHIPPING = {
  regionName: "Nacional (Estimado)",
  pacPrice: 14.9,
  pacDays: "5 a 8 dias úteis",
  sedexPrice: 26.5,
  sedexDays: "1 a 3 dias úteis",
};

export function getRegionByState(stateUf?: string | null): RegionShippingConfig {
  const uf = (stateUf || "").trim().toUpperCase();
  if (!uf) {
    return {
      regionName: DEFAULT_SHIPPING.regionName,
      states: [],
      pacPrice: DEFAULT_SHIPPING.pacPrice,
      pacDays: DEFAULT_SHIPPING.pacDays,
      sedexPrice: DEFAULT_SHIPPING.sedexPrice,
      sedexDays: DEFAULT_SHIPPING.sedexDays,
    };
  }

  const found = REGIONS_SHIPPING.find((r) => r.states.includes(uf));
  if (found) return found;

  return {
    regionName: `Estado (${uf})`,
    states: [uf],
    pacPrice: DEFAULT_SHIPPING.pacPrice,
    pacDays: DEFAULT_SHIPPING.pacDays,
    sedexPrice: DEFAULT_SHIPPING.sedexPrice,
    sedexDays: DEFAULT_SHIPPING.sedexDays,
  };
}

export function calculateShippingOptions(
  stateUf: string | null | undefined,
  subtotal: number,
  freeShippingThreshold = 199.0
): ShippingRate[] {
  const region = getRegionByState(stateUf);
  const isFreeEligible = subtotal >= freeShippingThreshold;

  const pacOption: ShippingRate = {
    id: isFreeEligible ? "FRETE_GRATIS" : "PAC",
    method: isFreeEligible ? "Frete Grátis" : "PAC",
    name: isFreeEligible ? "Frete Grátis (Promocional)" : "PAC Econômico",
    subtitle: region.pacDays,
    price: isFreeEligible ? 0.0 : region.pacPrice,
    badge: isFreeEligible ? "GRÁTIS" : undefined,
    description: isFreeEligible
      ? `Promocional acima de R$ ${freeShippingThreshold.toFixed(2).replace(".", ",")} (${region.regionName})`
      : `Entrega econômica dos Correios para ${region.regionName}`,
  };

  const sedexOption: ShippingRate = {
    id: "SEDEX",
    method: "SEDEX",
    name: "SEDEX Expresso",
    subtitle: region.sedexDays,
    price: region.sedexPrice,
    description: `Envio rápido e prioritário dos Correios para ${region.regionName}`,
  };

  const pickupOption: ShippingRate = {
    id: "RETIRADA",
    method: "Retirada no Local",
    name: "Retirada no Local",
    subtitle: "Pronto em até 24h úteis",
    price: 0.0,
    badge: "SEM CUSTOS",
    description: "Retire sem custos em nossa loja/showroom (São Paulo - SP)",
  };

  return [pacOption, sedexOption, pickupOption];
}
