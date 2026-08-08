import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RecipeInput } from "@/lib/types";
import { theme } from "@/lib/theme";

type Props = {
  initialValue?: Partial<RecipeInput>;
  submitLabel: string;
  onSubmit: (value: RecipeInput) => Promise<void>;
};

function ListEditor({
  label,
  placeholder,
  items,
  onChange,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.listRow}>
          <Text style={styles.listIndex}>{index + 1}.</Text>
          <TextInput
            style={styles.listInput}
            value={item}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.muted}
            onChangeText={(text) => {
              const next = [...items];
              next[index] = text;
              onChange(next);
            }}
            multiline
          />
          <Pressable
            onPress={() => onChange(items.filter((_, i) => i !== index))}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={20} color={theme.colors.muted} />
          </Pressable>
        </View>
      ))}
      <Pressable style={styles.addRow} onPress={() => onChange([...items, ""])}>
        <Ionicons name="add" size={16} color={theme.colors.primaryDark} />
        <Text style={styles.addRowText}>Add {label.toLowerCase().replace(/s$/, "")}</Text>
      </Pressable>
    </View>
  );
}

export function RecipeForm({ initialValue, submitLabel, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState(initialValue?.title ?? "");
  const [description, setDescription] = useState(initialValue?.description ?? "");
  const [ingredients, setIngredients] = useState<string[]>(initialValue?.ingredients ?? [""]);
  const [instructions, setInstructions] = useState<string[]>(
    initialValue?.instructions ?? [""]
  );
  const [tags, setTags] = useState(initialValue?.tags?.join(", ") ?? "");
  const [prepTime, setPrepTime] = useState(
    initialValue?.prep_time_minutes != null ? String(initialValue.prep_time_minutes) : ""
  );
  const [cookTime, setCookTime] = useState(
    initialValue?.cook_time_minutes != null ? String(initialValue.cook_time_minutes) : ""
  );
  const [servings, setServings] = useState(
    initialValue?.servings != null ? String(initialValue.servings) : ""
  );
  const [imageUrl, setImageUrl] = useState(initialValue?.image_url ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Give your recipe a title.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        ingredients: ingredients.map((i) => i.trim()).filter(Boolean),
        instructions: instructions.map((i) => i.trim()).filter(Boolean),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        prep_time_minutes: prepTime ? parseInt(prepTime, 10) : null,
        cook_time_minutes: cookTime ? parseInt(cookTime, 10) : null,
        servings: servings ? parseInt(servings, 10) : null,
        image_url: imageUrl.trim() || null,
      });
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 48 + insets.bottom }]}
    >
      <View style={styles.field}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Sunday Morning Pancakes"
          placeholderTextColor={theme.colors.muted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="A short note about this recipe"
          placeholderTextColor={theme.colors.muted}
          multiline
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, styles.rowItem]}>
          <Text style={styles.label}>Prep (min)</Text>
          <TextInput
            style={styles.input}
            value={prepTime}
            onChangeText={setPrepTime}
            keyboardType="number-pad"
            placeholder="10"
            placeholderTextColor={theme.colors.muted}
          />
        </View>
        <View style={[styles.field, styles.rowItem]}>
          <Text style={styles.label}>Cook (min)</Text>
          <TextInput
            style={styles.input}
            value={cookTime}
            onChangeText={setCookTime}
            keyboardType="number-pad"
            placeholder="20"
            placeholderTextColor={theme.colors.muted}
          />
        </View>
        <View style={[styles.field, styles.rowItem]}>
          <Text style={styles.label}>Servings</Text>
          <TextInput
            style={styles.input}
            value={servings}
            onChangeText={setServings}
            keyboardType="number-pad"
            placeholder="4"
            placeholderTextColor={theme.colors.muted}
          />
        </View>
      </View>

      <ListEditor
        label="Ingredients"
        placeholder="2 cups flour"
        items={ingredients}
        onChange={setIngredients}
      />

      <ListEditor
        label="Instructions"
        placeholder="Mix dry ingredients"
        items={instructions}
        onChange={setInstructions}
      />

      <View style={styles.field}>
        <Text style={styles.label}>Tags (comma separated)</Text>
        <TextInput
          style={styles.input}
          value={tags}
          onChangeText={setTags}
          placeholder="breakfast, quick, kid-friendly"
          placeholderTextColor={theme.colors.muted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Image URL (optional)</Text>
        <TextInput
          style={styles.input}
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://..."
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="none"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>{submitLabel}</Text>
        )}
      </Pressable>
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
    paddingBottom: 48,
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowItem: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.muted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  listIndex: {
    color: theme.colors.muted,
    fontSize: 14,
    paddingTop: 12,
    width: 18,
  },
  listInput: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.text,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  addRowText: {
    color: theme.colors.primaryDark,
    fontWeight: "600",
    fontSize: 13,
  },
  error: {
    color: theme.colors.danger,
    marginBottom: 12,
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
