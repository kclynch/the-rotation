export type Household = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
};

export type HouseholdMember = {
  household_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
};

export type Recipe = {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  image_url: string | null;
  created_by: string | null;
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
