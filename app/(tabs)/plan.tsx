import { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRecipes } from "@/contexts/RecipesContext";
import { useMealPlan, ShoppingListItem } from "@/contexts/MealPlanContext";
import { theme } from "@/lib/theme";

function ShoppingListRow({
  item,
  onToggle,
  onSave,
  onDelete,
}: {
  item: ShoppingListItem;
  onToggle: () => void;
  onSave: (text: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);

  const startEditing = () => {
    setDraft(item.text);
    setEditing(true);
  };

  const save = () => {
    onSave(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <View style={styles.itemRow}>
        <TextInput
          style={styles.editInput}
          value={draft}
          onChangeText={setDraft}
          autoFocus
          onSubmitEditing={save}
          returnKeyType="done"
        />
        <Pressable onPress={save} hitSlop={8}>
          <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
        </Pressable>
        <Pressable onPress={() => setEditing(false)} hitSlop={8}>
          <Ionicons name="close-circle" size={22} color={theme.colors.muted} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.itemRow}>
      <Pressable onPress={onToggle} hitSlop={8}>
        <Ionicons
          name={item.checked ? "checkbox" : "square-outline"}
          size={22}
          color={item.checked ? theme.colors.primary : theme.colors.muted}
        />
      </Pressable>
      <Pressable style={styles.itemTextWrap} onPress={onToggle}>
        <Text style={[styles.itemText, item.checked && styles.itemTextChecked]}>{item.text}</Text>
      </Pressable>
      <Pressable onPress={startEditing} hitSlop={8}>
        <Ionicons name="pencil" size={18} color={theme.colors.muted} />
      </Pressable>
      <Pressable onPress={onDelete} hitSlop={8}>
        <Ionicons name="trash" size={18} color={theme.colors.danger} />
      </Pressable>
    </View>
  );
}

export default function WeeklyPlan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipes, isLoading: recipesLoading } = useRecipes();
  const {
    selectedIds,
    isLoading: planLoading,
    toggleRecipe,
    clearWeek,
    items,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    clearList,
    resetChecks,
  } = useMealPlan();
  const [newItemText, setNewItemText] = useState("");

  const selectedRecipes = useMemo(
    () => selectedIds.map((id) => recipes.find((r) => r.id === id)).filter(Boolean) as typeof recipes,
    [recipes, selectedIds]
  );

  const checkedCount = items.filter((item) => item.checked).length;

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    addItem(newItemText);
    setNewItemText("");
  };

  const handleClearWeek = () => {
    Alert.alert("Clear this week's recipes?", "Your shopping list won't be affected.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearWeek },
    ]);
  };

  const handleClearList = () => {
    Alert.alert("Clear the whole list?", "This deletes every item, checked or not.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear List", style: "destructive", onPress: clearList },
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 48 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
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
              Choose recipes to add their ingredients to your shopping list.
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
            <Pressable style={styles.clearWeekButton} onPress={handleClearWeek}>
              <Text style={styles.clearWeekButtonText}>Clear this week's recipes</Text>
            </Pressable>
          </>
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Shopping list{items.length > 0 ? ` (${checkedCount}/${items.length})` : ""}
          </Text>
          {checkedCount > 0 ? (
            <Pressable onPress={resetChecks}>
              <Text style={styles.linkText}>Reset checks</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.addItemRow}>
          <TextInput
            style={styles.addItemInput}
            placeholder="Add something to the list"
            placeholderTextColor={theme.colors.muted}
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          <Pressable style={styles.addItemButton} onPress={handleAddItem}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Your list is empty</Text>
            <Text style={styles.emptySubtitle}>
              Choose recipes above or add an item yourself.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              {items.map((item) => (
                <ShoppingListRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleItem(item.id)}
                  onSave={(text) => updateItem(item.id, text)}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </View>
            <Pressable style={styles.clearWeekButton} onPress={handleClearList}>
              <Text style={styles.clearWeekButtonText}>Clear list</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 12,
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
  addItemRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text,
  },
  addItemButton: {
    width: 46,
    height: 46,
    borderRadius: theme.radius,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
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
  itemTextWrap: {
    flex: 1,
  },
  itemText: {
    fontSize: 15,
    color: theme.colors.text,
  },
  itemTextChecked: {
    color: theme.colors.muted,
    textDecorationLine: "line-through",
  },
  editInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
    paddingVertical: 2,
  },
  clearWeekButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },
  clearWeekButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.danger,
  },
});
