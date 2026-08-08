import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RecipesProvider } from "@/contexts/RecipesContext";
import { MealPlanProvider } from "@/contexts/MealPlanContext";
import { theme } from "@/lib/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RecipesProvider>
        <MealPlanProvider>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerShadowVisible: false,
              headerStyle: { backgroundColor: theme.colors.background },
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="recipe/[id]/index" options={{ title: "Recipe" }} />
            <Stack.Screen name="recipe/[id]/edit" options={{ title: "Edit Recipe" }} />
            <Stack.Screen
              name="recipe/new"
              options={{ title: "New Recipe", presentation: "modal" }}
            />
            <Stack.Screen
              name="select-week"
              options={{ title: "Choose Recipes", presentation: "modal" }}
            />
          </Stack>
        </MealPlanProvider>
      </RecipesProvider>
    </SafeAreaProvider>
  );
}
