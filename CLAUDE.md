# Rotaysh — project conventions

## Safe-area insets (Android nav bar / iOS home indicator)

Nothing should ever render behind the system navigation UI (Android's
gesture bar / 3-button nav, iOS's home indicator). This app targets phones
with all kinds of nav bar configurations, so any bottom-anchored or
bottom-scrolled content must account for `useSafeAreaInsets().bottom`:

- **Fixed/absolutely-positioned bottom elements** (FABs, bottom action
  buttons): add `insets.bottom` to their `bottom` offset or `marginBottom`.
  See `app/(tabs)/index.tsx`'s FAB or `app/select-week.tsx`'s Done button.
- **Scrollable screens** (forms, detail views): add `insets.bottom` to the
  `ScrollView`/`FlatList` content's `paddingBottom`, so the last item or a
  trailing button isn't hidden when scrolled all the way down. See
  `components/RecipeForm.tsx` or `app/recipe/[id]/index.tsx`.

The app is wrapped in `SafeAreaProvider` (`app/_layout.tsx`), so
`useSafeAreaInsets` from `react-native-safe-area-context` works in any
screen. When adding a new screen with bottom-anchored UI or a scrollable
list/form, apply this pattern — don't rely on hardcoded bottom padding
alone.
