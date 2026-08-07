import { useRouter } from "expo-router";
import { RecipeForm } from "@/components/RecipeForm";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { RecipeInput } from "@/lib/types";

export default function NewRecipe() {
  const router = useRouter();
  const { household, session } = useAuth();

  const handleSubmit = async (value: RecipeInput) => {
    if (!household || !session) throw new Error("You need a recipe book to add to.");

    const { error } = await supabase.from("recipes").insert({
      ...value,
      household_id: household.id,
      created_by: session.user.id,
    });

    if (error) throw error;
    router.back();
  };

  return <RecipeForm submitLabel="Add Recipe" onSubmit={handleSubmit} />;
}
