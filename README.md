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
  select-week.tsx          pick which recipes are on the menu this week
  recipe/
    new.tsx                 add a recipe
    [id]/index.tsx            recipe detail
    [id]/edit.tsx               edit a recipe
lib/                      shared types, theme, shopping list aggregation
contexts/
  RecipesContext.tsx        local recipe state, backed by AsyncStorage
  MealPlanContext.tsx        weekly selection + shopping list check-off state
components/                 RecipeCard, RecipeForm
android-keystore/             stable debug signing key used by CI
.github/workflows/             the Android build pipeline
```

## Notes

- Recipe images are entered as a URL for now (paste a link to a photo).
- The shopping list combines ingredients by exact text match (case-insensitive),
  showing a `×2` count when the same line appears in more than one recipe.
  It doesn't parse quantities/units, so "1 cup flour" and "2 cups flour"
  show up as two separate lines rather than being added together.
- This build is meant for installing directly on your own phone (sideloading)
  — not intended for the Play Store. If you ever want that, it would need a
  proper release keystore and Play Store submission, which is a separate
  step from what's set up here.
