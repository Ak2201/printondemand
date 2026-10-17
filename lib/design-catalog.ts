export interface CatalogDesign {
  slug: string;
  name: string;
  tagline: string;
  src: string; // "/designs/<slug>.svg"
  category: string;
  tags: string[];
  suits: "light" | "dark" | "any";
  defaultColor: string; // valid colour name for the T-shirt
  productIds: string[];
}

const all = ["tshirt", "hoodie", "mug", "phonecase", "canvas"];
const wear = ["tshirt", "hoodie"];
const d = (slug: string, name: string, tagline: string, category: string, tags: string[], suits: CatalogDesign["suits"], defaultColor: string, productIds = all): CatalogDesign =>
  ({ slug, name, tagline, src: `/designs/${slug}.svg`, category, tags, suits, defaultColor, productIds });

export const catalogDesigns: CatalogDesign[] = [
  d("retro-sunset", "Retro Sunset", "Synthwave sun over the horizon", "Retro", ["sunset", "80s", "vaporwave"], "dark", "Black"),
  d("mountain-badge", "Summit Badge", "Peaks inside a trail badge", "Outdoors", ["mountain", "hiking", "badge"], "dark", "Navy"),
  d("wave-circle", "Ocean Wave", "Layered waves under a pale sun", "Outdoors", ["ocean", "surf", "wave"], "dark", "Navy"),
  d("tropical-palm", "Tropical Palm", "Palm tree at golden hour", "Outdoors", ["palm", "beach", "summer"], "any", "White"),
  d("desert-cactus", "Desert Cactus", "A cactus against a sunset disc", "Outdoors", ["cactus", "desert"], "light", "White"),
  d("monstera-leaf", "Monstera Line", "Minimal monstera leaf line art", "Nature", ["plant", "leaf", "minimal"], "dark", "Black"),
  d("moon-phases", "Moon Phases", "Lunar cycle with twinkling stars", "Celestial", ["moon", "stars", "night"], "dark", "Black", wear.concat(["canvas"])),
  d("constellation", "Constellation", "Star map and crescent moon", "Celestial", ["stars", "space", "night"], "dark", "Navy", wear.concat(["canvas"])),
  d("compass-rose", "Compass Rose", "Golden compass for wanderers", "Travel", ["compass", "travel", "explore"], "any", "Navy"),
  d("coffee-cup", "Coffee Time", "A warm cup, steam rising", "Food & Drink", ["coffee", "cafe"], "light", "White"),
  d("cat-line", "Cat Line Art", "One-line style cat face", "Animals", ["cat", "pets", "minimal"], "any", "White"),
  d("fox-line", "Geometric Fox", "Low-poly fox outline", "Animals", ["fox", "geometric"], "any", "White"),
  d("crest-shield", "Star Crest", "Bold shield with a gold star", "Badges", ["shield", "crest", "star"], "any", "White"),
  d("mandala-bloom", "Mandala Bloom", "Radiating petals in vivid colour", "Patterns", ["mandala", "flower", "pattern"], "dark", "Black"),
  d("geo-diamonds", "Diamond Pattern", "Colourful diamond tiles in a circle", "Patterns", ["pattern", "geometric", "colour"], "any", "White"),
  d("gradient-blobs", "Gradient Blobs", "Soft abstract shapes", "Abstract", ["abstract", "gradient"], "any", "Black"),
];

export const designCategories = Array.from(new Set(catalogDesigns.map((x) => x.category)));
export const getCatalogDesign = (slug: string) => catalogDesigns.find((x) => x.slug === slug);
