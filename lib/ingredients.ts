// Lightweight ingredient-line parsing so the shopping list can combine
// matching ingredients across recipes (e.g. "2 boneless, skinless chicken
// breasts" + "3 chicken breasts" -> "5 chicken breasts") without needing a
// network call or a heavy NLP dependency.
//
// This is a heuristic, not a real parser: it recognizes a leading number
// (including simple/mixed fractions and common unicode fraction glyphs),
// an optional unit word from a fixed dictionary, and strips a fixed list
// of descriptive/prep words (boneless, fresh, diced, room temperature,
// etc.) and singular/plural differences from the item name before
// comparing. Two lines merge when what's left - the "core" food item -
// and the unit match; the unit must still match exactly ("2 cups flour"
// and "1 lb flour" stay separate, since combining them needs a unit
// conversion, not just addition), and unrecognized synonyms ("scallion"
// vs "green onion") still won't merge.

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
  /** Fully reduced form (descriptors stripped, singularized, lowercased) - matching only, never shown. */
  itemKey: string;
  /** Original phrasing (minus a trailing prep note) - shown for a standalone, unmerged item. */
  itemDisplay: string;
  /** Descriptors stripped but casing kept - used to build the text for a *merged* item. */
  itemCore: string;
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

// Descriptive/prep words that don't change *what* you need to buy, only
// how it's prepped or which variety - stripped wherever they appear (not
// just trailing) so "2 boneless, skinless chicken breasts" and "3 chicken
// breasts" are recognized as the same thing to purchase. Longer phrases
// are listed so they match as a unit ("room temperature", not "room" +
// "temperature" separately).
const DESCRIPTOR_WORDS = [
  "extra virgin",
  "extra large",
  "bone-in",
  "bone in",
  "skin-on",
  "skin on",
  "boneless",
  "skinless",
  "fresh",
  "frozen",
  "dried",
  "ground",
  "ripe",
  "large",
  "small",
  "medium",
  "jumbo",
  "virgin",
  "unsalted",
  "salted",
  "organic",
  "whole",
  "lean",
  "low-fat",
  "low fat",
  "nonfat",
  "fat-free",
  "room temperature",
  "at room temperature",
  "cold",
  "warm",
  "hot",
  "raw",
  "cooked",
  "uncooked",
  "lightly",
  "firmly packed",
  "loosely packed",
  "packed",
  "plus more",
  "to taste",
  "for garnish",
  "for serving",
  "optional",
  "divided",
  "finely chopped",
  "coarsely chopped",
  "roughly chopped",
  "thinly sliced",
  "finely diced",
  "diced",
  "chopped",
  "minced",
  "sliced",
  "grated",
  "melted",
  "softened",
  "chilled",
  "cubed",
  "shredded",
  "halved",
  "quartered",
  "crushed",
  "beaten",
  "peeled",
  "deveined",
  "rinsed",
  "drained",
  "trimmed",
  "seeded",
  "cored",
  "julienned",
].sort((a, b) => b.length - a.length); // longest first so phrases match before their sub-words

const DESCRIPTOR_PATTERN = new RegExp(
  `\\b(${DESCRIPTOR_WORDS.map((w) => w.replace(/[-\s]/g, "[- ]")).join("|")})\\b`,
  "gi"
);

/** Strips descriptive/prep words, keeping the food name itself. Preserves original casing. */
function coreItemText(text: string): string {
  const withoutCommas = text.replace(/,/g, " ");
  const stripped = withoutCommas.replace(DESCRIPTOR_PATTERN, " ");
  return stripped.replace(/\s+/g, " ").trim();
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

// A handful of common food words whose crude "strip trailing s" singular
// would collide with a genuinely different, unrelated word - skip those.
const SINGULARIZE_EXCEPTIONS = new Set([
  "hummus",
  "asparagus",
  "citrus",
  "molasses",
  "swiss",
  "grass",
]);

// Deliberately simple English singularization so "chicken breast" and
// "chicken breasts" key the same way. This only affects the internal
// grouping key, never the displayed text, so an imperfect stem (e.g.
// "asparagus" losing its final "s") is harmless as long as it's applied
// consistently - it still only merges two lines that are actually the
// same food.
function singularize(word: string): string {
  if (SINGULARIZE_EXCEPTIONS.has(word)) return word;
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.endsWith("oes") && word.length > 4) return word.slice(0, -2);
  if (/(sh|ch|x|z)es$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 2) return word.slice(0, -1);
  return word;
}

function normalizeKey(s: string): string {
  const core = coreItemText(s).toLowerCase();
  const words = core.split(" ").filter(Boolean);
  const lastIndex = words.length - 1;
  if (lastIndex >= 0) words[lastIndex] = singularize(words[lastIndex]);
  return words.join(" ");
}

function buildParsed(
  quantity: number | null,
  unit: string | null,
  itemDisplay: string
): ParsedIngredient {
  const itemCore = coreItemText(itemDisplay) || itemDisplay;
  return { quantity, unit, itemKey: normalizeKey(itemDisplay), itemDisplay, itemCore };
}

export function parseIngredient(text: string): ParsedIngredient {
  const trimmed = text.trim();
  const numResult = parseLeadingNumber(trimmed);

  if (!numResult) {
    return buildParsed(null, null, trimmed);
  }

  const { value } = numResult;
  let rest = numResult.rest.trim();

  // A range like "2-3 apples" can't be safely summed - bail out to
  // unparseable so it falls back to exact-text matching only.
  if (/^-\s*\d/.test(rest)) {
    return buildParsed(null, null, trimmed);
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

  return buildParsed(value, unit, itemDisplay);
}

function formatQuantity(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function pluralizeUnit(unit: string, quantity: number): string {
  if (quantity === 1) return unit;
  return PLURALIZABLE_UNITS[unit] ?? unit;
}

function pluralizeWord(word: string): string {
  if (word.endsWith("y") && word.length > 1 && !/[aeiou]y$/i.test(word)) {
    return word.slice(0, -1) + "ies";
  }
  if (/(s|sh|ch|x|z)$/i.test(word)) return word + "es";
  return word + "s";
}

// Only pluralizes when there's no unit word (units like "2 cups flour"
// don't need "flour" itself to pluralize - it's a mass noun; countable
// items like "chicken breast(s)" or "onion(s)" do).
function pluralizeItemDisplay(display: string, quantity: number): string {
  if (quantity === 1) return display;
  const words = display.split(" ");
  const lastIndex = words.length - 1;
  const last = words[lastIndex];
  if (!last || singularize(last.toLowerCase()) !== last.toLowerCase()) return display; // already plural-looking
  words[lastIndex] = pluralizeWord(last);
  return words.join(" ");
}

export function formatIngredientText(
  quantity: number,
  unit: string | null,
  itemDisplay: string
): string {
  const qtyStr = formatQuantity(quantity);
  if (unit) return `${qtyStr} ${pluralizeUnit(unit, quantity)} ${itemDisplay}`;
  return `${qtyStr} ${pluralizeItemDisplay(itemDisplay, quantity)}`;
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
      const combinedText = formatIngredientText(combinedQty, parsed.unit, parsed.itemCore);
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
          const combinedText = formatIngredientText(combinedQty, parsed.unit, parsed.itemCore);
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
