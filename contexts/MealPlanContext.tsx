import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRecipes } from "@/contexts/RecipesContext";

const SELECTED_KEY = "rotaysh:mealplan:selected";
const ITEMS_KEY = "rotaysh:mealplan:items";

export type ShoppingListItem = {
  id: string;
  text: string;
  checked: boolean;
};

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type MealPlanContextValue = {
  selectedIds: string[];
  isLoading: boolean;
  toggleRecipe: (id: string) => void;
  clearWeek: () => void;
  items: ShoppingListItem[];
  addItem: (text: string) => void;
  updateItem: (id: string, text: string) => void;
  deleteItem: (id: string) => void;
  toggleItem: (id: string) => void;
  clearList: () => void;
  resetChecks: () => void;
};

const MealPlanContext = createContext<MealPlanContextValue | undefined>(undefined);

export function MealPlanProvider({ children }: PropsWithChildren) {
  const { recipes } = useRecipes();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(SELECTED_KEY), AsyncStorage.getItem(ITEMS_KEY)])
      .then(([selectedRaw, itemsRaw]) => {
        if (selectedRaw) setSelectedIds(JSON.parse(selectedRaw));
        if (itemsRaw) setItems(JSON.parse(itemsRaw));
      })
      .catch((err) => console.warn("Failed to load meal plan", err))
      .finally(() => setIsLoading(false));
  }, []);

  const persistSelected = useCallback(async (next: string[]) => {
    setSelectedIds(next);
    await AsyncStorage.setItem(SELECTED_KEY, JSON.stringify(next));
  }, []);

  const persistItems = useCallback(async (next: ShoppingListItem[]) => {
    setItems(next);
    await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(next));
  }, []);

  const toggleRecipe = useCallback(
    (id: string) => {
      const isSelected = selectedIds.includes(id);
      persistSelected(
        isSelected ? selectedIds.filter((existing) => existing !== id) : [...selectedIds, id]
      );

      if (!isSelected) {
        const recipe = recipes.find((r) => r.id === id);
        if (!recipe) return;
        const existingTexts = new Set(items.map((item) => item.text.trim().toLowerCase()));
        const newItems: ShoppingListItem[] = [];
        for (const ingredient of recipe.ingredients) {
          const text = ingredient.trim();
          if (!text) continue;
          const key = text.toLowerCase();
          if (existingTexts.has(key)) continue;
          existingTexts.add(key);
          newItems.push({ id: generateId(), text, checked: false });
        }
        if (newItems.length > 0) {
          persistItems([...items, ...newItems]);
        }
      }
    },
    [selectedIds, items, recipes, persistSelected, persistItems]
  );

  const clearWeek = useCallback(() => {
    persistSelected([]);
  }, [persistSelected]);

  const addItem = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      persistItems([...items, { id: generateId(), text: trimmed, checked: false }]);
    },
    [items, persistItems]
  );

  const updateItem = useCallback(
    (id: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      persistItems(items.map((item) => (item.id === id ? { ...item, text: trimmed } : item)));
    },
    [items, persistItems]
  );

  const deleteItem = useCallback(
    (id: string) => {
      persistItems(items.filter((item) => item.id !== id));
    },
    [items, persistItems]
  );

  const toggleItem = useCallback(
    (id: string) => {
      persistItems(
        items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
      );
    },
    [items, persistItems]
  );

  const clearList = useCallback(() => {
    persistItems([]);
  }, [persistItems]);

  const resetChecks = useCallback(() => {
    persistItems(items.map((item) => ({ ...item, checked: false })));
  }, [items, persistItems]);

  return (
    <MealPlanContext.Provider
      value={{
        selectedIds,
        isLoading,
        toggleRecipe,
        clearWeek,
        items,
        addItem,
        updateItem,
        deleteItem,
        toggleItem,
        clearList,
        resetChecks,
      }}
    >
      {children}
    </MealPlanContext.Provider>
  );
}

export function useMealPlan() {
  const ctx = useContext(MealPlanContext);
  if (!ctx) throw new Error("useMealPlan must be used within a MealPlanProvider");
  return ctx;
}
