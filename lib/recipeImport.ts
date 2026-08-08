// Imports a recipe from a URL by fetching the page and reading its
// schema.org Recipe structured data (JSON-LD), which the vast majority of
// recipe sites embed for Google/search-engine rich results. No headless
// browser or third-party API involved - just a GET request + JSON parsing.

import { RecipeInput } from "@/lib/types";

export class RecipeImportError extends Error {}

export async function fetchRecipeFromUrl(url: string): Promise<RecipeInput> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        // Some sites serve a stripped-down page to unrecognized clients.
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html",
      },
    });
  } catch {
    throw new RecipeImportError("Couldn't reach that page. Check the link and your connection.");
  }

  if (!response.ok) {
    throw new RecipeImportError(`That page returned an error (HTTP ${response.status}).`);
  }

  const html = await response.text();
  const node = extractRecipeJsonLd(html);
  if (!node) {
    throw new RecipeImportError(
      "Couldn't find recipe data on that page. Some sites don't publish it in a format this app can read - try entering it manually."
    );
  }

  return mapJsonLdToRecipeInput(node);
}

function extractRecipeJsonLd(html: string): any | null {
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const candidates: any[] = [];
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      candidates.push(JSON.parse(match[1].trim()));
    } catch {
      // Malformed JSON-LD block - ignore and keep looking.
    }
  }

  for (const candidate of candidates) {
    const found = findRecipeNode(candidate);
    if (found) return found;
  }
  return null;
}

function findRecipeNode(node: any): any | null {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object") return null;

  const type = node["@type"];
  const isRecipe = type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"));
  if (isRecipe) return node;

  if (node["@graph"]) return findRecipeNode(node["@graph"]);
  return null;
}

function mapJsonLdToRecipeInput(node: any): RecipeInput {
  const title = typeof node.name === "string" && node.name.trim() ? node.name.trim() : "Imported Recipe";
  const description =
    typeof node.description === "string" && node.description.trim() ? node.description.trim() : null;

  const ingredients: string[] = toStringArray(node.recipeIngredient ?? node.ingredients);
  const instructions: string[] = extractInstructions(node.recipeInstructions);

  const tags: string[] = [];
  if (typeof node.recipeCategory === "string") tags.push(node.recipeCategory);
  else if (Array.isArray(node.recipeCategory)) tags.push(...node.recipeCategory.map(String));
  if (typeof node.recipeCuisine === "string") tags.push(node.recipeCuisine);

  return {
    title,
    description,
    ingredients,
    instructions,
    tags: Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean))),
    prep_time_minutes: parseIsoDurationToMinutes(node.prepTime),
    cook_time_minutes: parseIsoDurationToMinutes(node.cookTime),
    servings: parseServings(node.recipeYield),
    image_url: extractImageUrl(node.image),
  };
}

function toStringArray(raw: any): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => String(s).trim()).filter(Boolean);
}

function extractInstructions(raw: any): string[] {
  if (!raw) return [];

  if (typeof raw === "string") {
    return raw
      .split(/\r?\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (Array.isArray(raw)) {
    const steps: string[] = [];
    for (const step of raw) {
      if (typeof step === "string") {
        steps.push(step.trim());
      } else if (step && typeof step === "object") {
        if (step["@type"] === "HowToSection" && Array.isArray(step.itemListElement)) {
          steps.push(...extractInstructions(step.itemListElement));
        } else if (typeof step.text === "string") {
          steps.push(step.text.trim());
        } else if (typeof step.name === "string") {
          steps.push(step.name.trim());
        }
      }
    }
    return steps.filter(Boolean);
  }

  return [];
}

function parseIsoDurationToMinutes(duration: any): number | null {
  if (typeof duration !== "string") return null;
  const match = duration.match(/^P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?$/i);
  if (!match) return null;
  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const total = hours * 60 + minutes;
  return total > 0 ? total : null;
}

function parseServings(raw: any): number | null {
  let value = raw;
  if (Array.isArray(value)) value = value[0];
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const match = value.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  return null;
}

function extractImageUrl(raw: any): string | null {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return extractImageUrl(raw[0]);
  if (raw && typeof raw === "object" && typeof raw.url === "string") return raw.url;
  return null;
}
