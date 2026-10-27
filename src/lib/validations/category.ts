import { z } from "zod";

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "-") // Substitui caracteres não alfanuméricos por hífen
    .replace(/^-+|-+$/g, "") // Remove hifens nas pontas
    .replace(/-{2,}/g, "-"); // Remove múltiplos hifens consecutivos
}

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome da categoria deve ter no mínimo 2 caracteres.")
    .max(60, "O nome da categoria não pode exceder 60 caracteres."),
  description: z
    .string()
    .trim()
    .max(300, "A descrição não pode exceder 300 caracteres.")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;
