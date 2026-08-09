import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRecipes } from "@/contexts/RecipesContext";
import { DISCOVER_RECIPES } from "@/lib/discoverCatalog";
import { theme } from "@/lib/theme";

export default function DiscoverDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addFromCatalog, isCatalogRecipeAdded } = useRecipes();
  const [adding, setAdding] = useState(false);

  const recipe = DISCOVER_RECIPES.find((r) => r.id === id);
  const alreadyAdded = recipe ? isCatalogRecipeAdded(recipe.id) : false;

  if (!recipe) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Recipe not found.</Text>
      </View>
    );
  }

  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);

  const handleAdd = async () => {
    setAdding(true);
    try {
      const { id: _catalogId, ...input } = recipe;
      await addFromCatalog(recipe.id, input);
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: recipe.title }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
      >
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {recipe.ingredients.map((item, index) => (
            <Text key={index} style={styles.bulletItem}>
              •  {item}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {recipe.instructions.map((item, index) => (
            <Text key={index} style={styles.stepItem}>
              {index + 1}.  {item}
            </Text>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
        <Pressable style={styles.addButton} onPress={handleAdd} disabled={adding}>
          {adding ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name={alreadyAdded ? "checkmark-circle" : "add-circle"}
                size={20}
                color="#fff"
              />
              <Text style={styles.addButtonText}>
                {alreadyAdded ? "Add Another Copy" : "Add to My Book"}
              </Text>
            </>
          )}
        </Pressable>
        {alreadyAdded ? <Text style={styles.addedNote}>Already in your book</Text> : null}
      </View>
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
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius,
    paddingVertical: 14,
    width: "100%",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  addedNote: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 6,
  },
});
