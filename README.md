# Rotaysh 🍲

*(pronounced "roh-TAYSH" — an abbreviation of "Rotation")*

A shared recipe book for two. Add, edit, delete, and browse recipes; you and
your wife stay in sync in real time because you're both reading/writing the
same backend record. Ships as one codebase to both iOS and Android, and new
JS/UI changes reach installed phones automatically without a reinstall
(EAS Update — see below).

## How it works

- **App**: [Expo](https://expo.dev) (React Native) + [Expo Router](https://expo.dev/router) + TypeScript.
  One codebase, builds for iOS and Android.
- **Backend**: [Supabase](https://supabase.com) (hosted Postgres + Auth + Realtime).
  Free tier is plenty for two people.
- **Sync model**: each recipe belongs to a `household` (the shared "book").
  When you sign up you get your own household automatically. Share your
  invite code from **Settings** and have your wife enter it on her phone —
  she'll join your household and the app switches both of you onto the same
  live-synced set of recipes (Supabase Realtime pushes changes to both
  devices instantly).
- **Updates**: [EAS Update](https://docs.expo.dev/eas-update/introduction/)
  publishes new JS bundles over the air. Installed apps check for and apply
  updates automatically — no App Store / Play Store reinstall needed for
  most changes (see [When you need a full rebuild](#when-you-need-a-full-rebuild)).

## 1. Install dependencies

```bash
npm install
```

## 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the migration in
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   It creates the `households`, `household_members`, and `recipes` tables,
   locks them down with row-level security so a household's recipes are only
   visible to its members, and sets up the invite-code join flow.
3. In **Authentication -> Providers**, email/password sign-up is enabled by
   default — that's all this app uses. (Optional: turn off "Confirm email"
   under Authentication -> Settings if you don't want the confirmation-email
   step while testing.)
4. Copy `.env.example` to `.env` and fill in your project's URL and anon key
   (Settings -> API in the Supabase dashboard):

   ```bash
   cp .env.example .env
   ```

## 3. Run it locally

```bash
npx expo start
```

Scan the QR code with the Expo Go app on your phone (fastest way to try it),
or press `i` / `a` for a simulator/emulator.

## 4. Try the shared-book flow

1. Sign up on your phone. You automatically get a personal book.
2. Go to **Settings** and note your 6-character invite code (or tap Share).
3. Have your wife install the app and sign up on her phone.
4. On her phone: **Settings -> Join a Different Book**, enter your code.
5. Add a recipe on either phone — it appears on both within a second or two.

## 5. Build real apps for your phones (EAS)

```bash
npm install -g eas-cli
eas login
eas init          # links this project to your Expo account, fills in app.json
eas build:configure
```

Build an installable version for your own phones (no store review needed):

```bash
eas build --profile preview --platform all
```

EAS gives you a link/QR code to install the build directly (Android: APK
install; iOS: register your device with `eas device:create` first, since
Apple requires that even for internal installs).

## 6. Push an update without reinstalling

Once a build is installed, any change that's pure JS/TS/styling (not a new
native module or Expo SDK bump) can go out as an over-the-air update instead
of a new build:

```bash
eas update --branch preview --message "Add ingredient search"
```

Both of your phones will fetch and apply it automatically the next time the
app is opened (the app also checks on launch — see `app/_layout.tsx`).

### When you need a full rebuild

A small set of changes require a new `eas build` (and reinstall) instead of
just `eas update`:
- Adding/upgrading a native module (anything with native iOS/Android code)
- Bumping the Expo SDK version
- Changing `app.json` native config (icons, permissions, bundle identifiers)

Day-to-day recipe-app changes (new screens, styling, bug fixes, new fields)
are all OTA-updatable.

## 7. Ship to the App Store / Play Store (optional)

```bash
eas build --profile production --platform all
eas submit --platform ios
eas submit --platform android
```

You only need to do this if you want it installed the "normal" way instead
of via `eas build --profile preview`. Store review only applies to the
initial install (and to future *native* changes) — regular feature updates
still go out instantly via `eas update` once the store build is live.

## Project structure

```
app/
  (auth)/            sign-in, sign-up
  (app)/              tab navigator: recipe book + settings
  recipe/
    new.tsx            add a recipe
    [id]/index.tsx      recipe detail
    [id]/edit.tsx        edit a recipe
lib/                  supabase client, shared types, theme
contexts/AuthContext.tsx   session + household state
components/            RecipeCard, RecipeForm
supabase/migrations/    database schema + RLS policies
```

## Notes

- Recipe images are entered as a URL for now (paste a link to a photo);
  direct photo upload from the camera roll can be added later via Supabase
  Storage.
- The placeholder icon/splash images in `assets/` are solid brand-color
  squares — swap them for real artwork whenever you like, then run
  `eas build` (icon/splash changes need a new build, not just an update).
