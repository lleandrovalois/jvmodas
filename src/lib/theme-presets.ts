export interface ThemePreset {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  type: "dark" | "light";
  primaryColor: string;     // Navbar / Topbar / Marca
  secondaryColor: string;   // Destaque principal / Botões
  accentColor: string;      // Destaque secundário / Badges
  backgroundColor: string;  // Fundo global do site
  cardColor: string;        // Superfície de cards e seções
  textColor: string;        // Texto principal
  buttonTextColor: string;  // Texto em botões
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  "dark-fitness": {
    id: "dark-fitness",
    name: "Dark Fitness (Padrão Escuro)",
    shortLabel: "Tema Escuro",
    description: "Slate escuro esportivo de alta performance com contrastes vivos em vinho/rosa e verde neon.",
    type: "dark",
    primaryColor: "#0f172a",
    secondaryColor: "#e11d48",   // Vinho/Rosa forte
    accentColor: "#10b981",      // Verde Neon esportivo
    backgroundColor: "#0f172a",  // Slate escuro / quase preto
    cardColor: "#1e293b",        // Superfície do card
    textColor: "#f8fafc",        // Texto primário
    buttonTextColor: "#ffffff",
  },
  "clean-active": {
    id: "clean-active",
    name: "Clean Active (Padrão Claro)",
    shortLabel: "Tema Claro",
    description: "Visual limpo, elegante e altamente legível com fundo cinza suave e azul esportivo atlético.",
    type: "light",
    primaryColor: "#0f172a",
    secondaryColor: "#0284c7",   // Azul esportivo
    accentColor: "#e11d48",      // Rose/Vinho
    backgroundColor: "#f8fafc",  // Cinza claro esportivo
    cardColor: "#ffffff",        // Superfície branca pura
    textColor: "#0f172a",        // Texto primário escuro
    buttonTextColor: "#ffffff",
  },
  "dark-neon": {
    id: "dark-neon",
    name: "Dark Neon Sport",
    shortLabel: "Neon Sport",
    description: "Preto profundo com botões em Verde Neon (#10B981) para alta energia esportiva.",
    type: "dark",
    primaryColor: "#090d16",
    secondaryColor: "#10b981",   // Verde Neon esportivo
    accentColor: "#e11d48",
    backgroundColor: "#090d16",
    cardColor: "#131c2e",
    textColor: "#f8fafc",
    buttonTextColor: "#ffffff",
  },
  "clean-rose": {
    id: "clean-rose",
    name: "Clean Rose Active",
    shortLabel: "Rose Claro",
    description: "Superfície clara com destaque em Rose/Magenta (#E11D48) e acento azul atlético.",
    type: "light",
    primaryColor: "#0f172a",
    secondaryColor: "#e11d48",   // Rose/Magenta
    accentColor: "#0284c7",
    backgroundColor: "#f8fafc",
    cardColor: "#ffffff",
    textColor: "#0f172a",
    buttonTextColor: "#ffffff",
  },
};

// Preset de Fábrica para restauração com 1 clique
export const FACTORY_DEFAULT_PRESET: ThemePreset = THEME_PRESETS["dark-fitness"];
