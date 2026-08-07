import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Recipe, RecipeInput } from "@/lib/types";

const STORAGE_KEY = "rotaysh:recipes";

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

type RecipesContextValue = {
  recipes: Recipe[];
  isLoading: boolean;
  getRecipe: (id: string) => Recipe | undefined;
  addRecipe: (input: RecipeInput) => Promise<Recipe>;
  updateRecipe: (id: string, input: RecipeInput) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
};

const RecipesContext = createContext<RecipesContextValue | undefined>(undefined);

export function RecipesProvider({ children }: PropsWithChildren) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setRecipes(JSON.parse(raw));
      })
      .catch((err) => console.warn("Failed to load recipes", err))
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback(async (next: Recipe[]) => {
    setRecipes(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const getRecipe = useCallback(
    (id: string) => recipes.find((r) => r.id === id),
    [recipes]
  );

  const addRecipe = useCallback(
    async (input: RecipeInput) => {
      const now = new Date().toISOString();
      const recipe: Recipe = { ...input, id: generateId(), created_at: now, updated_at: now };
      const next = [...recipes, recipe].sort((a, b) => a.title.localeCompare(b.title));
      await persist(next);
      return recipe;
    },
    [recipes, persist]
  );

  const updateRecipe = useCallback(
    async (id: string, input: RecipeInput) => {
      const next = recipes
        .map((r) => (r.id === id ? { ...r, ...input, updated_at: new Date().toISOString() } : r))
        .sort((a, b) => a.title.localeCompare(b.title));
      await persist(next);
    },
    [recipes, persist]
  );

  const deleteRecipe = useCallback(
    async (id: string) => {
      await persist(recipes.filter((r) => r.id !== id));
    },
    [recipes, persist]
  );

  return (
    <RecipesContext.Provider
      value={{ recipes, isLoading, getRecipe, addRecipe, updateRecipe, deleteRecipe }}
    >
      {children}
    </RecipesContext.Provider>
  );
}

export function useRecipes() {
  const ctx = useContext(RecipesContext);
  if (!ctx) throw new Error("useRecipes must be used within a RecipesProvider");
  return ctx;
}
