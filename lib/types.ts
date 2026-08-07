export type Recipe = {
  id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type RecipeInput = Pick<
  Recipe,
  | "title"
  | "description"
  | "ingredients"
  | "instructions"
  | "tags"
  | "prep_time_minutes"
  | "cook_time_minutes"
  | "servings"
  | "image_url"
>;
