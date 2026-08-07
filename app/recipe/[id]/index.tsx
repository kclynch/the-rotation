import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { Recipe } from "@/lib/types";
import { theme } from "@/lib/theme";

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("recipes").select("*").eq("id", id).single();
    if (!error) setRecipe(data as Recipe);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = () => {
    Alert.alert("Delete recipe?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("recipes").delete().eq("id", id);
          if (error) {
            Alert.alert("Couldn't delete", error.message);
            return;
          }
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Recipe not found.</Text>
      </View>
    );
  }

  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);

  return (
    <>
      <Stack.Screen
        options={{
          title: recipe.title,
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable onPress={() => router.push(`/recipe/${recipe.id}/edit`)} hitSlop={8}>
                <Ionicons name="pencil" size={20} color={theme.colors.primaryDark} />
              </Pressable>
              <Pressable onPress={handleDelete} hitSlop={8}>
                <Ionicons name="trash" size={20} color={theme.colors.danger} />
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {recipe.image_url ? (
          <Image source={{ uri: recipe.image_url }} style={styles.heroImage} />
        ) : null}

        <Text style={styles.title}>{recipe.title}</Text>
        {recipe.description ? <Text style={styles.description}>{recipe.description}</Text> : null}

        <View style={styles.metaRow}>
          {recipe.prep_time_minutes ? (
            <MetaPill label="Prep" value={`${recipe.prep_time_minutes} min`} />
          ) : null}
          {recipe.cook_time_minutes ? (
            <MetaPill label="Cook" value={`${recipe.cook_time_minutes} min`} />
          ) : null}
          {totalTime > 0 ? <MetaPill label="Total" value={`${totalTime} min`} /> : null}
          {recipe.servings ? <MetaPill label="Serves" value={String(recipe.servings)} /> : null}
        </View>

        {recipe.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {recipe.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
        ) : null}

        {recipe.ingredients.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients.map((item, index) => (
              <Text key={index} style={styles.bulletItem}>
                •  {item}
              </Text>
            ))}
          </View>
        ) : null}

        {recipe.instructions.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.instructions.map((item, index) => (
              <Text key={index} style={styles.stepItem}>
                {index + 1}.  {item}
              </Text>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaPill}>
      <Text style={styles.metaPillValue}>{value}</Text>
      <Text style={styles.metaPillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 15,
  },
  headerActions: {
    flexDirection: "row",
    gap: 16,
  },
  heroImage: {
    width: "100%",
    height: 200,
    borderRadius: theme.radius,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.text,
  },
  description: {
    fontSize: 15,
    color: theme.colors.muted,
    marginTop: 6,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  metaPill: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  metaPillValue: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  metaPillLabel: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 1,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  tag: {
    fontSize: 12,
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 10,
  },
  bulletItem: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 6,
    lineHeight: 21,
  },
  stepItem: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 10,
    lineHeight: 21,
  },
});
