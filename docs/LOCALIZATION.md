# Localization

The clients use `i18next` and `react-i18next`. The shared setup lives in
`packages/core/src/i18n/index.ts` and imports resources and defaults from the
`@pelagica/i18n` package.

## Language selection

- Shared locale resources and the English fallback are configured by
  `i18nextOptions` from `@pelagica/i18n`.
- The language detector checks the saved `i18nextLng` choice before the device
  or browser language, then caches manual choices in local storage.
- The TV Settings screen changes language with `i18n.changeLanguage` and gets
  its language list from `SUPPORTED_LANGUAGES` in `packages/core/src/i18n`.
- Missing translations fall back to English. A translation file alone does not
  add a language to the Settings picker; that list comes from the shared
  language package.

## Littora-specific strings

Do not edit `node_modules/@pelagica/i18n` for Littora features. It is a shared
dependency. Keep Littora-owned translations in this repository, grouped by
language and namespace:

```text
packages/tv-frontend/src/locales/en/profiles.json
packages/tv-frontend/src/locales/pt/profiles.json
```

`packages/tv-frontend/src/i18n/registerProfiles.ts` merges those files into the
shared `profiles` namespace with `i18n.addResourceBundle`. `App.tsx` imports the
registration module once. Screens then use the normal `useTranslation` API,
for example:

```tsx
const { t } = useTranslation(['profiles', 'common']);
t('profiles:disconnect_profile');
```

Write the English text in the `en` resource and add the corresponding
translation under the same key in `pt`. Keep UI components language-neutral;
avoid embedding translated strings in JSX or registering locale dictionaries
inside screen files. Add other locale files when Littora-specific wording needs
them. The shared language picker already includes Portuguese (`pt`).

The shared package currently supplies the base profile labels in English and
German. Littora's local English and Portuguese profile resources override those
base labels and add the TV-specific server, disconnect, and empty-state text.
