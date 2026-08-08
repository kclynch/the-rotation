import { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRecipes } from "@/contexts/RecipesContext";
import { useMealPlan } from "@/contexts/MealPlanContext";
import { buildShoppingList } from "@/lib/shoppingList";
import { theme } from "@/lib/theme";

export default function WeeklyPlan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipes, isLoading: recipesLoading } = useRecipes();
  const {
    selectedIds,
    isLoading: planLoading,
    toggleRecipe,
    clearWeek,
    checkedItems,
    toggleItem,
    clearCheckedItems,
  } = useMealPlan();

  const selectedRecipes = useMemo(
    () => selectedIds.map((id) => recipes.find((r) => r.id === id)).filter(Boolean) as typeof recipes,
    [recipes, selectedIds]
  );

  const shoppingList = useMemo(
    () => buildShoppingList(recipes, selectedIds),
    [recipes, selectedIds]
  );

  const checkedCount = shoppingList.filter((item) => checkedItems[item.key]).length;

  const handleClearWeek = () => {
    Alert.alert("Clear this week?", "This removes your selected recipes and shopping list.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearWeek },
    ]);
  };

  if (recipesLoading || planLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 48 + insets.bottom }]}
    >
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Selected for this week</Text>
        <Pressable style={styles.pickButton} onPress={() => router.push("/select-week")}>
          <Ionicons name="add" size={16} color={theme.colors.primaryDark} />
          <Text style={styles.pickButtonText}>Choose recipes</Text>
        </Pressable>
      </View>

      {selectedRecipes.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No recipes picked yet</Text>
          <Text style={styles.emptySubtitle}>
            Choose the recipes you're making this week to build a shopping list.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            {selectedRecipes.map((recipe) => (
              <View key={recipe.id} style={styles.recipeRow}>
                <Text style={styles.recipeRowText} numberOfLines={1}>
                  {recipe.title}
                </Text>
                <Pressable onPress={() => toggleRecipe(recipe.id)} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.muted} />
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Shopping list{shoppingList.length > 0 ? ` (${checkedCount}/${shoppingList.length})` : ""}
            </Text>
            {checkedCount > 0 ? (
              <Pressable onPress={clearCheckedItems}>
                <Text style={styles.linkText}>Reset checks</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.card}>
            {shoppingList.map((item) => {
              const checked = !!checkedItems[item.key];
              return (
                <Pressable
                  key={item.key}
                  style={styles.itemRow}
                  onPress={() => toggleItem(item.key)}
                >
                  <Ionicons
                    name={checked ? "checkbox" : "square-outline"}
                    size={22}
                    color={checked ? theme.colors.primary : theme.colors.muted}
                  />
                  <Text style={[styles.itemText, checked && styles.itemTextChecked]}>
                    {item.text}
                    {item.count > 1 ? ` ×${item.count}` : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.clearWeekButton} onPress={handleClearWeek}>
            <Text style={styles.clearWeekButtonText}>Clear this week</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
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
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  linkText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.primaryDark,
  },
  pickButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pickButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.primaryDark,
  },
  emptyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
    overflow: "hidden",
  },
  recipeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  recipeRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
    marginRight: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
  },
  itemTextChecked: {
    color: theme.colors.muted,
    textDecorationLine: "line-through",
  },
  clearWeekButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  clearWeekButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.danger,
  },
});
