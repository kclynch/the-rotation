// Lightweight ingredient-line parsing so the shopping list can combine
// matching ingredients across recipes (e.g. "2 chicken breasts" +
// "3 chicken breasts" -> "5 chicken breasts") without needing a network
// call or a heavy NLP dependency.
//
// This is a heuristic, not a real parser: it recognizes a leading number
// (including simple/mixed fractions and common unicode fraction glyphs)
// and an optional unit word from a fixed dictionary. Two lines only merge
// when both the item name (after stripping the quantity/unit and any
// trailing ", note" clause) and the unit match exactly. Different
// phrasing ("chicken breast" vs "chicken breasts"), synonyms, or
// mismatched units are intentionally left unmerged rather than risking
// wrong math.

const UNICODE_FRACTIONS: Record<string, number> = {
  "¼": 0.25,
  "½": 0.5,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

const UNIT_ALIASES: Record<string, string> = {
  cup: "cup",
  cups: "cup",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tbsp: "tbsp",
  tbsps: "tbsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  tsp: "tsp",
  tsps: "tsp",
  ounce: "oz",
  ounces: "oz",
  oz: "oz",
  pound: "lb",
  pounds: "lb",
  lb: "lb",
  lbs: "lb",
  gram: "g",
  grams: "g",
  g: "g",
  kilogram: "kg",
  kilograms: "kg",
  kg: "kg",
  milliliter: "ml",
  milliliters: "ml",
  ml: "ml",
  liter: "l",
  liters: "l",
  l: "l",
  clove: "clove",
  cloves: "clove",
  can: "can",
  cans: "can",
  package: "package",
  packages: "package",
  pkg: "package",
  pkgs: "package",
  slice: "slice",
  slices: "slice",
  piece: "piece",
  pieces: "piece",
  pinch: "pinch",
  pinches: "pinch",
  bunch: "bunch",
  bunches: "bunch",
  stick: "stick",
  sticks: "stick",
};

// Units whose display form pluralizes with the count; abbreviations like
// "tbsp"/"oz"/"g" stay the same regardless of quantity.
const PLURALIZABLE_UNITS: Record<string, string> = {
  cup: "cups",
  lb: "lbs",
  clove: "cloves",
  can: "cans",
  package: "packages",
  slice: "slices",
  piece: "pieces",
  pinch: "pinches",
  bunch: "bunches",
  stick: "sticks",
};

export type ParsedIngredient = {
  quantity: number | null;
  unit: string | null;
  itemKey: string;
  itemDisplay: string;
};

// Words that only ever appear as a *trailing* prep instruction after a
// comma (e.g. "onion, diced"). Deliberately excludes adjectives like
// "boneless"/"skinless"/"fresh" that commonly appear *before* the noun
// with a comma of their own ("boneless, skinless chicken breasts") -
// stripping on those would mangle the item name instead of cleaning it.
const TRAILING_NOTE_PATTERN =
  /^(diced|chopped|minced|sliced|grated|melted|softened|chilled|cubed|shredded|halved|quartered|crushed|beaten|peeled|deveined|rinsed|drained|trimmed|seeded|cored|julienned|to taste|for garnish|for serving|room temperature|at room temperature|divided|packed|finely chopped|coarsely chopped|thinly sliced|roughly chopped)\b/i;

function stripTrailingNote(text: string): string {
  const commaIndex = text.indexOf(",");
  if (commaIndex === -1) return text;
  const head = text.slice(0, commaIndex).trim();
  const tail = text.slice(commaIndex + 1).trim();
  return TRAILING_NOTE_PATTERN.test(tail) ? head : text;
}

function parseLeadingNumber(input: string): { value: number; rest: string } | null {
  const s = input.trimStart();

  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)\b/);
  if (m) {
    const whole = parseInt(m[1], 10);
    const num = parseInt(m[2], 10);
    const den = parseInt(m[3], 10);
    if (den !== 0) return { value: whole + num / den, rest: s.slice(m[0].length) };
  }

  m = s.match(/^(\d+)\s*([¼½¾⅓⅔⅛⅜⅝⅞])/);
  if (m) {
    return { value: parseInt(m[1], 10) + UNICODE_FRACTIONS[m[2]], rest: s.slice(m[0].length) };
  }

  m = s.match(/^(\d+)\/(\d+)\b/);
  if (m) {
    const den = parseInt(m[2], 10);
    if (den !== 0) return { value: parseInt(m[1], 10) / den, rest: s.slice(m[0].length) };
  }

  m = s.match(/^(\d+(?:\.\d+)?)\b/);
  if (m) {
    return { value: parseFloat(m[1]), rest: s.slice(m[0].length) };
  }

  m = s.match(/^([¼½¾⅓⅔⅛⅜⅝⅞])/);
  if (m) {
    return { value: UNICODE_FRACTIONS[m[1]], rest: s.slice(m[0].length) };
  }

  return null;
}

function normalizeKey(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

export function parseIngredient(text: string): ParsedIngredient {
  const trimmed = text.trim();
  const numResult = parseLeadingNumber(trimmed);

  if (!numResult) {
    return { quantity: null, unit: null, itemKey: normalizeKey(trimmed), itemDisplay: trimmed };
  }

  const { value } = numResult;
  let rest = numResult.rest.trim();

  // A range like "2-3 apples" can't be safely summed - bail out to
  // unparseable so it falls back to exact-text matching only.
  if (/^-\s*\d/.test(rest)) {
    return { quantity: null, unit: null, itemKey: normalizeKey(trimmed), itemDisplay: trimmed };
  }

  let unit: string | null = null;
  const unitMatch = rest.match(/^([a-zA-Z.]+)\.?\s*/);
  if (unitMatch) {
    const word = unitMatch[1].toLowerCase().replace(/\.$/, "");
    const canonical = UNIT_ALIASES[word];
    if (canonical) {
      unit = canonical;
      rest = rest.slice(unitMatch[0].length);
    }
  }

  rest = rest.trim().replace(/^of\s+/i, "");
  const itemDisplay = stripTrailingNote(rest.trim()) || rest.trim();

  return { quantity: value, unit, itemKey: normalizeKey(itemDisplay), itemDisplay };
}

function formatQuantity(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function pluralizeUnit(unit: string, quantity: number): string {
  if (quantity === 1) return unit;
  return PLURALIZABLE_UNITS[unit] ?? unit;
}

export function formatIngredientText(
  quantity: number,
  unit: string | null,
  itemDisplay: string
): string {
  const qtyStr = formatQuantity(quantity);
  if (unit) return `${qtyStr} ${pluralizeUnit(unit, quantity)} ${itemDisplay}`;
  return `${qtyStr} ${itemDisplay}`;
}

/**
 * Adds an ingredient line to a shopping list, merging it into an existing
 * item when both have a parseable quantity and the same unit + item name.
 * Falls back to skipping exact-text duplicates, then to appending a new
 * item.
 */
export function mergeIngredientIntoItems<T extends { id: string; text: string }>(
  items: T[],
  rawText: string,
  makeItem: (text: string) => T
): T[] {
  const text = rawText.trim();
  if (!text) return items;

  const parsed = parseIngredient(text);

  if (parsed.quantity != null) {
    const matchIndex = items.findIndex((item) => {
      const existingParsed = parseIngredient(item.text);
      return (
        existingParsed.quantity != null &&
        existingParsed.unit === parsed.unit &&
        existingParsed.itemKey === parsed.itemKey
      );
    });

    if (matchIndex !== -1) {
      const existing = items[matchIndex];
      const existingParsed = parseIngredient(existing.text);
      const combinedQty = (existingParsed.quantity ?? 0) + parsed.quantity;
      const combinedText = formatIngredientText(combinedQty, parsed.unit, parsed.itemDisplay);
      const next = [...items];
      next[matchIndex] = { ...existing, text: combinedText };
      return next;
    }
  }

  const dupExists = items.some((item) => item.text.trim().toLowerCase() === text.toLowerCase());
  if (dupExists) return items;

  return [...items, makeItem(text)];
}

/**
 * Re-merges an entire shopping list using the same rules as
 * mergeIngredientIntoItems. Run this over items loaded from storage so
 * lines saved before a parsing fix (or before this feature existed) still
 * get combined, without waiting for the next add/edit to trigger it.
 * A merged item is checked only if every line that fed into it was
 * checked.
 */
export function consolidateItems<T extends { id: string; text: string; checked: boolean }>(
  items: T[]
): T[] {
  const result: T[] = [];

  for (const item of items) {
    const parsed = parseIngredient(item.text);
    let matchIndex = -1;

    if (parsed.quantity != null) {
      matchIndex = result.findIndex((existing) => {
        const existingParsed = parseIngredient(existing.text);
        return (
          existingParsed.quantity != null &&
          existingParsed.unit === parsed.unit &&
          existingParsed.itemKey === parsed.itemKey
        );
      });
    }

    if (matchIndex === -1) {
      matchIndex = result.findIndex(
        (existing) => existing.text.trim().toLowerCase() === item.text.trim().toLowerCase()
      );
    }

    if (matchIndex !== -1) {
      const existing = result[matchIndex];
      if (parsed.quantity != null) {
        const existingParsed = parseIngredient(existing.text);
        if (existingParsed.quantity != null) {
          const combinedQty = existingParsed.quantity + parsed.quantity;
          const combinedText = formatIngredientText(combinedQty, parsed.unit, parsed.itemDisplay);
          result[matchIndex] = {
            ...existing,
            text: combinedText,
            checked: existing.checked && item.checked,
          };
          continue;
        }
      }
      result[matchIndex] = { ...existing, checked: existing.checked && item.checked };
      continue;
    }

    result.push(item);
  }

  return result;
}
