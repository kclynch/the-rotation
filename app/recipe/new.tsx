import { useState } from "react";
import {
  View,
  Text,
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
import { RecipeForm } from "@/components/RecipeForm";
import { useRecipes } from "@/contexts/RecipesContext";
import { RecipeInput } from "@/lib/types";
import { fetchRecipeFromUrl, RecipeImportError } from "@/lib/recipeImport";
import { theme } from "@/lib/theme";

export default function NewRecipe() {
  const router = useRouter();
  const { addRecipe } = useRecipes();
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importedValue, setImportedValue] = useState<Partial<RecipeInput> | undefined>(undefined);
  const [formKey, setFormKey] = useState(0);

  const handleImport = async () => {
    const url = importUrl.trim();
    if (!url) return;
    setImporting(true);
    try {
      const value = await fetchRecipeFromUrl(url);
      setImportedValue(value);
      setFormKey((k) => k + 1);
    } catch (err) {
      const message =
        err instanceof RecipeImportError
          ? err.message
          : "Something went wrong importing that link.";
      Alert.alert("Couldn't import recipe", message);
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async (value: RecipeInput) => {
    await addRecipe(value);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.importCard}>
        <Text style={styles.importLabel}>Import from a link</Text>
        <View style={styles.importRow}>
          <TextInput
            style={styles.importInput}
            placeholder="Paste a recipe URL"
            placeholderTextColor={theme.colors.muted}
            value={importUrl}
            onChangeText={setImportUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!importing}
          />
          <Pressable style={styles.importButton} onPress={handleImport} disabled={importing}>
            {importing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="download" size={20} color="#fff" />
            )}
          </Pressable>
        </View>
        <Text style={styles.importHint}>
          Works on most recipe sites. Review the fields below before saving.
        </Text>
      </View>

      <RecipeForm key={formKey} initialValue={importedValue} submitLabel="Add Recipe" onSubmit={handleSubmit} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  importCard: {
    margin: 16,
    marginBottom: 0,
    padding: 14,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  importLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  importRow: {
    flexDirection: "row",
    gap: 8,
  },
  importInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: theme.colors.text,
  },
  importButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  importHint: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 8,
  },
});
