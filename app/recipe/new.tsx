import { useRouter } from "expo-router";
import { RecipeForm } from "@/components/RecipeForm";
import { useRecipes } from "@/contexts/RecipesContext";
import { RecipeInput } from "@/lib/types";

export default function NewRecipe() {
  const router = useRouter();
  const { addRecipe } = useRecipes();

  const handleSubmit = async (value: RecipeInput) => {
    await addRecipe(value);
    router.back();
  };

  return <RecipeForm submitLabel="Add Recipe" onSubmit={handleSubmit} />;
}
