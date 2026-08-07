import { Pressable, Text, View, Image, StyleSheet } from "react-native";
import { Recipe } from "@/lib/types";
import { theme } from "@/lib/theme";

export function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const totalTime =
    (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0) || null;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {recipe.image_url ? (
        <Image source={{ uri: recipe.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.imagePlaceholderText}>🍽️</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {recipe.title}
        </Text>
        {recipe.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {recipe.description}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          {totalTime ? <Text style={styles.meta}>{totalTime} min</Text> : null}
          {recipe.tags.slice(0, 2).map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  image: {
    width: 84,
    height: 84,
  },
  imagePlaceholder: {
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  description: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 6,
    gap: 8,
  },
  meta: {
    fontSize: 12,
    color: theme.colors.primaryDark,
    fontWeight: "600",
  },
  tag: {
    fontSize: 12,
    color: theme.colors.muted,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 6,
    borderRadius: 6,
    overflow: "hidden",
  },
});
