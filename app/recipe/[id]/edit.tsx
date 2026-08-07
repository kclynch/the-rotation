import { useCallback, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { RecipeForm } from "@/components/RecipeForm";
import { supabase } from "@/lib/supabase";
import { Recipe, RecipeInput } from "@/lib/types";
import { theme } from "@/lib/theme";

export default function EditRecipe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single()
        .then(({ data }) => {
          setRecipe((data as Recipe) ?? null);
          setLoading(false);
        });
    }, [id])
  );

  const handleSubmit = async (value: RecipeInput) => {
    const { error } = await supabase.from("recipes").update(value).eq("id", id);
    if (error) throw error;
    router.back();
  };

  if (loading || !recipe) {
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

  return (
    <RecipeForm
      initialValue={recipe}
      submitLabel="Save Changes"
      onSubmit={handleSubmit}
    />
  );
}
