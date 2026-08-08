import { Recipe } from "@/lib/types";

export type ShoppingListItem = {
  key: string;
  text: string;
  count: number;
  recipeTitles: string[];
};

export function buildShoppingList(recipes: Recipe[], selectedIds: string[]): ShoppingListItem[] {
  const byKey = new Map<string, ShoppingListItem>();

  for (const id of selectedIds) {
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) continue;

    for (const ingredient of recipe.ingredients) {
      const text = ingredient.trim();
      if (!text) continue;
      const key = text.toLowerCase();

      const existing = byKey.get(key);
      if (existing) {
        existing.count += 1;
        if (!existing.recipeTitles.includes(recipe.title)) {
          existing.recipeTitles.push(recipe.title);
        }
      } else {
        byKey.set(key, { key, text, count: 1, recipeTitles: [recipe.title] });
      }
    }
  }

  return Array.from(byKey.values()).sort((a, b) => a.text.localeCompare(b.text));
}
