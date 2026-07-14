// Curated flavour tags per spirit category. Each category maps to exactly 10
// tags shown as selectable chips in the pour creation/edit flow.

export const FLAVOR_TAGS_BY_CATEGORY = {
  BRANDY: ['Dried fruit', 'Raisin', 'Apricot', 'Vanilla', 'Oak', 'Caramel', 'Orange peel', 'Honey', 'Almond', 'Chocolate'],
  WHISKEY: ['Vanilla', 'Caramel', 'Oak', 'Peat', 'Smoke', 'Dried fruit', 'Honey', 'Spice', 'Leather', 'Chocolate'],
  GIN: ['Juniper', 'Citrus', 'Floral', 'Pepper', 'Coriander', 'Herbal', 'Pine', 'Elderflower', 'Cardamom', 'Fresh'],
  RUM: ['Molasses', 'Vanilla', 'Caramel', 'Tropical fruit', 'Banana', 'Oak', 'Spice', 'Coconut', 'Dried fruit', 'Brown sugar'],
  TEQUILA: ['Agave', 'Pepper', 'Citrus', 'Earthy', 'Herbal', 'Vanilla', 'Oak', 'Mineral', 'Floral', 'Spice'],
  MEZCAL: ['Smoke', 'Agave', 'Earthy', 'Leather', 'Citrus', 'Mineral', 'Dried fruit', 'Pepper', 'Roasted', 'Herbal'],
  VODKA: ['Clean', 'Grain', 'Citrus', 'Pepper', 'Mineral', 'Cream', 'Neutral', 'Smooth', 'Subtle sweetness', 'Fresh'],
  COGNAC: ['Dried fruit', 'Orange peel', 'Vanilla', 'Oak', 'Floral', 'Caramel', 'Spice', 'Leather', 'Walnut', 'Honey'],
  LIQUEUR: ['Sweet', 'Floral', 'Citrus', 'Berry', 'Honey', 'Vanilla', 'Herbal', 'Fruity', 'Almond', 'Cream'],
  OTHER: ['Floral', 'Fruity', 'Spice', 'Herbal', 'Oak', 'Sweet', 'Earthy', 'Citrus', 'Smooth', 'Bold'],
} as const;

export type SpiritCategory = keyof typeof FLAVOR_TAGS_BY_CATEGORY;

// Returns the 10 flavour tags for a category, case-insensitively.
// Falls back to OTHER when the category is unknown or missing.
export function getCategoryTags(category: string): string[] {
  const key = (category ?? '').trim().toUpperCase();
  const tags = (FLAVOR_TAGS_BY_CATEGORY as Record<string, readonly string[]>)[key];
  return [...(tags ?? FLAVOR_TAGS_BY_CATEGORY.OTHER)];
}
