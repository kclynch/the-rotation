import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { RecipesProvider } from "@/contexts/RecipesContext";
import { theme } from "@/lib/theme";

export default function RootLayout() {
  return (
    <RecipesProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.colors.background },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Recipe Book" }} />
        <Stack.Screen name="recipe/[id]/index" options={{ title: "Recipe" }} />
        <Stack.Screen name="recipe/[id]/edit" options={{ title: "Edit Recipe" }} />
        <Stack.Screen name="recipe/new" options={{ title: "New Recipe", presentation: "modal" }} />
      </Stack>
    </RecipesProvider>
  );
}
