import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { RecipeForm } from "@/components/RecipeForm";
import { useRecipes } from "@/contexts/RecipesContext";
import { RecipeInput } from "@/lib/types";
import { theme } from "@/lib/theme";

export default function EditRecipe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getRecipe, updateRecipe, isLoading } = useRecipes();
  const recipe = getRecipe(id);

  const handleSubmit = async (value: RecipeInput) => {
    await updateRecipe(id, value);
    router.back();
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <Text style={{ color: theme.colors.muted }}>Recipe not found.</Text>
      </View>
    );
  }

  return <RecipeForm initialValue={recipe} submitLabel="Save Changes" onSubmit={handleSubmit} />;
}
