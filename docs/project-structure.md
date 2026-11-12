# Project structure

```
src/
  app/          entry (main), route tree (App), theme, layout/ (signed-in app bar and navigation),
                pages/ (pages outside any feature: 404)
  api/          axios setup and requests, error model, form submission, query client and keys, tokens, dto/
  session/      signed-in session: context, current user
  i18n/         translations setup, locales/<language>/<namespace>.json
  components/   shared UI with no feature or server knowledge, grouped by role (form/, feedback/, layout/,
                google/ and github/ for the providers' buttons)
  utils/        generic helpers (planned)
  features/
    <feature>/  auth, home, exam, profile, admin
      pages/        one component per route
      components/   used only by this feature
      hooks/
      guards/
test/           mirrors src/, helpers in test/support/
```

Folders are created when their first file is added.

## Imports

* `@/` points to `src/`, `@test/` to `test/` (tests only).
* Imports inside one feature (or one top-level folder) are relative; all other imports use `@/`.
* No barrel (`index.tsx`) files: import the file itself.
* Allowed directions, checked by `npm run lint` (`biome.json` overrides):

| Folder            | Can import                                                                   |
|-------------------|------------------------------------------------------------------------------|
| `app/`            | anything                                                                     |
| `features/`       | `session/`, `components/`, `api/`, `i18n/`, `utils/` (never another feature) |
| `session/`        | `api/`, `i18n/`                                                              |
| `components/`     | `i18n/`, `utils/`                                                            |
| `api/`            | `utils/`                                                                     |
| `i18n/`, `utils/` | nothing                                                                      |

## Where code goes

* New code starts in the feature that uses it. It moves down to `components/` (or `api/`, `session/`, `utils/`) once
  a second feature needs it, or when it is planned as a shared design-system part.
* `api/` mirrors the server: one file per resource, all DTOs in `api/dto/`. Hooks that adapt requests to screens live
  in the feature; only `useFormSubmission`, which sends the forms of every feature, lives in `api/`.
* Server data goes through TanStack Query: feature hooks read with `useQuery` and change with `useMutation`, using
  the keys from `api/queryKeys.tsx`, and a mutation invalidates the keys of the resource it changed.
* UI text goes in `i18n/locales/<language>/<namespace>.json`, in English (`en`) and Polish (`pl`) with the same keys
  (`common` for shared components, `errors` for `api/` messages, `app` for the shell, one per feature) and is read with
  `useTranslation`. Code outside `i18n/` holds keys, typed as `ParseKeys<"namespace">`; `api/` returns keys and the
  caller translates them. Dates and numbers are shown through `useFormat` (`i18n/useFormat.tsx`). Polish texts write
  the second person lowercase mid-sentence ("sprawdzaj, jak rosną twoje wyniki", "wyślemy ci link").
* Types live next to the code that owns them; there is no `types/` folder.
* A component's SCSS and imported assets sit next to it. `public/` is only for files served as-is.
* All routes are defined in `app/`; their pages are loaded on demand with `lazyPage`.

## Naming

* Every source and test file is `.tsx` (JSON locales excepted).
* Components `PascalCase.tsx`, one exported component per file, named after the file; everything else `camelCase.tsx`.
* Suffixes: `XPage` for route components, `RequireX` for guards, `XDto` for DTOs, `useX` for hooks.
* Named exports only.
