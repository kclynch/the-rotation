import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

const SELECTED_KEY = "rotaysh:mealplan:selected";
const CHECKED_KEY = "rotaysh:mealplan:checked";

type MealPlanContextValue = {
  selectedIds: string[];
  isLoading: boolean;
  toggleRecipe: (id: string) => void;
  clearWeek: () => void;
  checkedItems: Record<string, boolean>;
  toggleItem: (key: string) => void;
  clearCheckedItems: () => void;
};

const MealPlanContext = createContext<MealPlanContextValue | undefined>(undefined);

export function MealPlanProvider({ children }: PropsWithChildren) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(SELECTED_KEY), AsyncStorage.getItem(CHECKED_KEY)])
      .then(([selectedRaw, checkedRaw]) => {
        if (selectedRaw) setSelectedIds(JSON.parse(selectedRaw));
        if (checkedRaw) setCheckedItems(JSON.parse(checkedRaw));
      })
      .catch((err) => console.warn("Failed to load meal plan", err))
      .finally(() => setIsLoading(false));
  }, []);

  const persistSelected = useCallback(async (next: string[]) => {
    setSelectedIds(next);
    await AsyncStorage.setItem(SELECTED_KEY, JSON.stringify(next));
  }, []);

  const persistChecked = useCallback(async (next: Record<string, boolean>) => {
    setCheckedItems(next);
    await AsyncStorage.setItem(CHECKED_KEY, JSON.stringify(next));
  }, []);

  const toggleRecipe = useCallback(
    (id: string) => {
      const next = selectedIds.includes(id)
        ? selectedIds.filter((existing) => existing !== id)
        : [...selectedIds, id];
      persistSelected(next);
    },
    [selectedIds, persistSelected]
  );

  const clearWeek = useCallback(() => {
    persistSelected([]);
    persistChecked({});
  }, [persistSelected, persistChecked]);

  const toggleItem = useCallback(
    (key: string) => {
      persistChecked({ ...checkedItems, [key]: !checkedItems[key] });
    },
    [checkedItems, persistChecked]
  );

  const clearCheckedItems = useCallback(() => {
    persistChecked({});
  }, [persistChecked]);

  return (
    <MealPlanContext.Provider
      value={{
        selectedIds,
        isLoading,
        toggleRecipe,
        clearWeek,
        checkedItems,
        toggleItem,
        clearCheckedItems,
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
