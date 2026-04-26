/**
 * Canonical area slugs used to gate access per user.
 *
 * Derived from the 2026 DC Operations organigrama (see docs/MODULAR_SOP.md §1.1).
 * `core` is admin-equivalent for content (Willian, Software Developer, VP).
 * Heads cover multiple sub-areas via the `user_areas` m2m table — never via
 * a single enum on `users`.
 */
export const AREA_SLUGS = [
  "core",
  "maintenance",
  "substation",
  "mining",
  "networking",
  "microelectronics",
  "automation",
  "facilities",
  "safety",
] as const;

export type AreaSlug = (typeof AREA_SLUGS)[number];

export const AREA_LABELS: Record<AreaSlug, string> = {
  core: "Núcleo / Infraestructura",
  maintenance: "Mantenimiento",
  substation: "Subestación",
  mining: "Minería",
  networking: "Redes y Ciberseguridad",
  microelectronics: "Microelectrónica",
  automation: "Automatización",
  facilities: "Instalaciones",
  safety: "Seguridad",
};

export function isAreaSlug(value: unknown): value is AreaSlug {
  return typeof value === "string" && (AREA_SLUGS as readonly string[]).includes(value);
}
