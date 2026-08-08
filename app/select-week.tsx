import { useState } from "react";
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRecipes } from "@/contexts/RecipesContext";
import { useMealPlan } from "@/contexts/MealPlanContext";
import { theme } from "@/lib/theme";

export default function SelectWeek() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipes, isLoading } = useRecipes();
  const { selectedIds, toggleRecipe } = useMealPlan();
  const [query, setQuery] = useState("");

  const filtered = recipes.filter((recipe) => {
    if (!query.trim()) return true;
    return recipe.title.toLowerCase().includes(query.trim().toLowerCase());
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={theme.colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your recipes"
          placeholderTextColor={theme.colors.muted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {recipes.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Your book is empty</Text>
          <Text style={styles.emptySubtitle}>Add a recipe first, then come back to plan your week.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const checked = selectedIds.includes(item.id);
            return (
              <Pressable style={styles.row} onPress={() => toggleRecipe(item.id)}>
                <Ionicons
                  name={checked ? "checkbox" : "square-outline"}
                  size={22}
                  color={checked ? theme.colors.primary : theme.colors.muted}
                />
                <Text style={styles.rowText} numberOfLines={1}>
                  {item.title}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      <Pressable
        style={[styles.doneButton, { marginBottom: 16 + insets.bottom }]}
        onPress={() => router.back()}
      >
        <Text style={styles.doneButtonText}>
          Done{selectedIds.length > 0 ? ` (${selectedIds.length} selected)` : ""}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 6,
    textAlign: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius,
    paddingVertical: 15,
    alignItems: "center",
    marginHorizontal: 16,
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
