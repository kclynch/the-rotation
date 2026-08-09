# The Rotaysh 🍲

*(pronounced "roh-TAYSH" — an abbreviation of "Rotation")*

A simple recipe book for your phone. Browse, add, edit, and delete recipes,
pick what you're making this week, and get a shopping list. No account,
no sign-in — everything is stored locally on your device.

## How it works

- **App**: [Expo](https://expo.dev) (React Native) + [Expo Router](https://expo.dev/router) + TypeScript.
- **Storage**: recipes are saved on-device with `AsyncStorage` — nothing leaves
  your phone, no backend, no account required.
- **Builds**: a GitHub Actions workflow ([`.github/workflows/build-android.yml`](.github/workflows/build-android.yml))
  builds an installable Android `.apk` in the cloud and attaches it to the
  workflow run as a downloadable artifact — no Android Studio, no Expo/EAS
  account needed.

## Get the app

1. Go to the repo's **Actions** tab → **Build Android APK** workflow.
2. Open the latest successful run.
3. Under **Artifacts**, download `rotaysh-release-apk` (a zip containing the `.apk`).
4. Unzip it, transfer `app-release.apk` to your Android phone (or open the
   download link directly on your phone's browser), and tap it to install.
   Android will ask permission to install from that source the first time —
   allow it.

This is a **release** build, meaning the JavaScript is bundled directly
into the `.apk` — it runs fully offline with no dev server needed (unlike
a debug build, which expects to fetch JS live from Metro on your computer).

Every build is signed with the same fixed key (`android-keystore/debug.keystore`,
committed in this repo — a debug-style key used here purely so every build
has a consistent signature, not for the Play Store), so installing a newer
`.apk` over an older one **updates the app in place and keeps your saved
recipes** — no need to uninstall first.

## Run it locally (optional, for development)

```bash
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone (this project uses
no native modules that require a custom dev client), or press `a` for an
Android emulator.

## Trigger a new build yourself

Any push to this branch triggers the workflow automatically. You can also
trigger it manually: repo → **Actions** → **Build Android APK** → **Run workflow**.

## Project structure

```
app/
  (tabs)/
    index.tsx             recipe book (list + search)
    plan.tsx               this week's recipes + shopping list
    discover.tsx             browse/search/filter the built-in recipe catalog
  select-week.tsx          pick which recipes are on the menu this week
  discover/[id].tsx         preview a catalog recipe + add it to your book
  recipe/
    new.tsx                 add a recipe (manually, or import from a URL)
    [id]/index.tsx            recipe detail
    [id]/edit.tsx               edit a recipe
lib/
  types.ts, theme.ts         shared types, theme
  ingredients.ts               ingredient quantity parsing + merging
  recipeImport.ts               scrape a recipe URL's schema.org data
  discoverCatalog.ts            100 built-in easy weeknight-dinner recipes
contexts/
  RecipesContext.tsx        local recipe state, backed by AsyncStorage
  MealPlanContext.tsx        weekly selection + shopping list state
components/                 RecipeCard, RecipeForm
android-keystore/             stable debug signing key used by CI
.github/workflows/             the Android build pipeline
```

## Notes

- **Discover tab**: 100 original, easy weeknight-dinner recipes bundled
  directly in the app (`lib/discoverCatalog.ts`) - written from scratch
  rather than scraped from real sites, both to keep Discover fully
  offline and to avoid copying anyone else's recipe text. Search by
  title/ingredient/tag, filter by protein/method/cuisine or a "≤ 30 min"
  toggle, sort by name or total time, and tap "Add to My Book" on any
  recipe to copy it into your own editable book.
- Recipe images are entered as a URL for now (paste a link to a photo),
  unless imported from a recipe URL (see below), which fills it in
  automatically when the source page provides one.
- **Importing from a URL** (New Recipe screen → "Import from a link")
  fetches the page and reads its embedded schema.org `Recipe` data - the
  structured data most recipe sites already publish for Google search
  results. No AI or third-party service involved, and nothing saves until
  you review the pre-filled form and tap Add Recipe. Sites that don't
  publish this structured data (rare, but it happens) won't import - just
  enter the recipe manually in that case.
- **Shopping list grouping**: ingredients are combined by their "core"
  item after stripping quantity, unit, and a fixed list of descriptive/prep
  words (boneless, fresh, chopped, room temperature, etc.) and
  singular/plural differences, so "2 boneless, skinless chicken breasts"
  and "3 chicken breasts" become "5 chicken breasts". The unit still has
  to match exactly - "2 cups flour" and "1 lb flour" stay separate, since
  combining them would need a unit conversion, not just addition. It's
  pattern matching, not real language understanding, so unrecognized
  synonyms ("scallion" vs "green onion") won't merge. Anything that
  doesn't cleanly merge still gets deduplicated by exact text match, and
  the whole list is editable regardless - fix up merges/misses by hand
  with the pencil/trash icons.
- This build is meant for installing directly on your own phone (sideloading)
  — not intended for the Play Store. If you ever want that, it would need a
  proper release keystore and Play Store submission, which is a separate
  step from what's set up here.
