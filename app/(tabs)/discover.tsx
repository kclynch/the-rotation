import { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRecipes } from "@/contexts/RecipesContext";
import { DISCOVER_RECIPES, DISCOVER_FILTER_GROUPS, CatalogRecipe } from "@/lib/discoverCatalog";
import { theme } from "@/lib/theme";

type SortMode = "title" | "quickest" | "slowest";

function totalTime(recipe: CatalogRecipe) {
  return (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
}

export default function Discover() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isCatalogRecipeAdded } = useRecipes();
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [quickOnly, setQuickOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("title");

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const results = useMemo(() => {
    let list = DISCOVER_RECIPES.filter((recipe) => {
      if (quickOnly && totalTime(recipe) > 30) return false;
      if (selectedTags.length > 0 && !selectedTags.every((tag) => recipe.tags.includes(tag))) {
        return false;
      }
      if (query.trim()) {
        const haystack = `${recipe.title} ${recipe.tags.join(" ")} ${recipe.ingredients.join(" ")}`.toLowerCase();
        if (!haystack.includes(query.trim().toLowerCase())) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortMode === "quickest") return totalTime(a) - totalTime(b);
      if (sortMode === "slowest") return totalTime(b) - totalTime(a);
      return a.title.localeCompare(b.title);
    });

    return list;
  }, [query, selectedTags, quickOnly, sortMode]);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={theme.colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes, ingredients, tags"
          placeholderTextColor={theme.colors.muted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <Pressable
          style={[styles.chip, quickOnly && styles.chipActive]}
          onPress={() => setQuickOnly((v) => !v)}
        >
          <Text style={[styles.chipText, quickOnly && styles.chipTextActive]}>≤ 30 min</Text>
        </Pressable>
        {DISCOVER_FILTER_GROUPS.flatMap((group) => group.tags).map((tag) => {
          const active = selectedTags.includes(tag);
          return (
            <Pressable
              key={tag}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{tag}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sortRow}>
        <Text style={styles.resultCount}>
          {results.length} recipe{results.length === 1 ? "" : "s"}
        </Text>
        <View style={styles.sortButtons}>
          <SortButton label="A–Z" active={sortMode === "title"} onPress={() => setSortMode("title")} />
          <SortButton
            label="Quickest"
            active={sortMode === "quickest"}
            onPress={() => setSortMode("quickest")}
          />
          <SortButton
            label="Slowest"
            active={sortMode === "slowest"}
            onPress={() => setSortMode("slowest")}
          />
        </View>
      </View>

      {results.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No matches</Text>
          <Text style={styles.emptySubtitle}>Try a different search or clear a filter.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 24 + insets.bottom }]}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/discover/${item.id}`)}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardMeta}>{totalTime(item)} min</Text>
                  {item.tags.slice(0, 2).map((tag) => (
                    <Text key={tag} style={styles.cardTag}>
                      {tag}
                    </Text>
                  ))}
                </View>
              </View>
              {isCatalogRecipeAdded(item.id) ? (
                <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function SortButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.sortButton, active && styles.sortButtonActive]} onPress={onPress}>
      <Text style={[styles.sortButtonText, active && styles.sortButtonTextActive]}>{label}</Text>
    </Pressable>
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
    marginBottom: 10,
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
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
  },
  chipTextActive: {
    color: "#fff",
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
  },
  resultCount: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: "600",
  },
  sortButtons: {
    flexDirection: "row",
    gap: 6,
  },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sortButtonActive: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.muted,
  },
  sortButtonTextActive: {
    color: "#fff",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  cardDescription: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  cardMeta: {
    fontSize: 12,
    color: theme.colors.primaryDark,
    fontWeight: "600",
  },
  cardTag: {
    fontSize: 11,
    color: theme.colors.muted,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 6,
    borderRadius: 6,
    overflow: "hidden",
  },
});
