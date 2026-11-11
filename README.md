# Prawko Web

[![codecov](https://codecov.io/gh/Laska254/prawko-web/graph/badge.svg)](https://codecov.io/gh/Laska254/prawko-web)

## Table of Contents

* [Table of Contents](#table-of-contents)
* [Overview](#overview)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [IDE setup](#ide-setup)
* [Project structure](#project-structure)
* [Usage](#usage)

---

## Overview

**Prawko Web** is a web client created with React 19, TypeScript and Material UI for Prawko projects.

It is the frontend for [Prawko Server](https://github.com/Laska254/prawko-server). All data and authentication
are handled by the server, so it must be running for the web client to work.

---

## Prerequisites

* Node.js 24.15+ (CI runs the version in `.nvmrc`)
* npm
* Running [Prawko Server](https://github.com/Laska254/prawko-server)

### Debian 13

Debian's own `nodejs` package is too old, use [NodeSource](https://github.com/nodesource/distributions) instead
(it includes npm)

`curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -`

`sudo apt install nodejs`

### Windows

`winget install OpenJS.NodeJS.LTS`

---

## Installation

Run Prawko Server first. You can find instructions in
its [README](https://github.com/Laska254/prawko-server/blob/main/README.md).

Clone repository

`git clone git@github.com:Laska254/prawko-web.git`

`cd prawko-web`

Install dependencies

`npm install`

Run

`npm run dev`

Build

`npm run build`

Lint ([Biome](https://biomejs.dev/), lint rules only, formatting is not checked)

`npm run lint`

Test

`npm test`

Coverage (fails below 100%, report in `coverage/`)

`npm run coverage`

---

## IDE setup

### WebStorm

Biome only lints. Its formatter is off in `biome.json`, so WebStorm's own formatter (Reformat Code) stays in use.

* Settings → Plugins → Marketplace: install **Biome**.
* Settings → Languages & Frameworks → Biome: keep **Automatic Biome configuration** (it picks up
  `node_modules/@biomejs/biome` and `biome.json`). Leave **Enable LSP-based code formatting**, **Run format on save**,
  **Run safe fixes on save** and **Sort import on save** off.
* Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint: **Disable ESLint configuration**
  (the project doesn't use ESLint).

Biome problems then show in the editor, with quick fixes under Alt+Enter.

---

## Project structure

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

### Imports

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

### Where code goes

* New code starts in the feature that uses it. It moves down to `components/` (or `api/`, `session/`, `utils/`) once
  a second feature needs it, or when it is planned as a shared design-system part.
* `api/` mirrors the server: one file per resource, all DTOs in `api/dto/`. Hooks that adapt requests to screens live
  in the feature; only `useFormSubmission`, which sends the forms of every feature, lives in `api/`.
* Server data goes through TanStack Query: feature hooks read with `useQuery` and change with `useMutation`, using
  the keys from `api/queryKeys.tsx`, and a mutation invalidates the keys of the resource it changed.
* UI text goes in `i18n/locales/<language>/<namespace>.json`, in English (`en`) and Polish (`pl`) with the same keys
  (`common` for shared components, `errors` for `api/` messages, `app` for the shell, one per feature) and is read with
  `useTranslation`. Code outside `i18n/` holds keys, typed as `ParseKeys<"namespace">`; `api/` returns keys and the
  caller translates them. Dates and numbers are shown through `useFormat` (`i18n/useFormat.tsx`).
* Types live next to the code that owns them; there is no `types/` folder.
* A component's SCSS and imported assets sit next to it. `public/` is only for files served as-is.
* All routes are defined in `app/`; their pages are loaded on demand with `lazyPage`.

### Naming

* Every source and test file is `.tsx` (JSON locales excepted).
* Components `PascalCase.tsx`, one exported component per file, named after the file; everything else `camelCase.tsx`.
* Suffixes: `XPage` for route components, `RequireX` for guards, `XDto` for DTOs, `useX` for hooks.
* Named exports only.

---

## Usage

Application URL: `http://localhost:5173/`

Server URL: `http://localhost:8080/` (set via `VITE_API_URL` in `.env.development`; set it in the environment or a `.env.production` for production builds)

Prawko Server must allow CORS requests from the application URL.

### Sign in with Google

Optional: without `VITE_GOOGLE_CLIENT_ID` the button isn't shown.

1. In the [Google Cloud console](https://console.cloud.google.com/apis/credentials), create an OAuth client ID of type
   *Web application*. Under *Authorized JavaScript origins* add the application URL of each environment; for development
   that's both `http://localhost` and `http://localhost:5173`.
2. Set its ID as `VITE_GOOGLE_CLIENT_ID`, in `.env.development.local` (not committed) or the environment of a production
   build.
3. Give the server the same ID, as it checks that ID tokens were issued for it; without it `POST /auth/google` answers
   `404`. In production set `GOOGLE_CLIENT_IDS`; locally set `google.client-ids` in `application-dev.yaml`, see the
   server's README › Local configuration.

A Content Security Policy has to allow Google's script: `https://accounts.google.com/gsi/client` in `script-src`,
`https://accounts.google.com/gsi/` in `frame-src` and `connect-src`, and `https://accounts.google.com/gsi/style` in
`style-src`.

### Sign in with GitHub

Optional: without `VITE_GITHUB_CLIENT_ID` the button isn't shown. It also needs HTTPS or `localhost`, as browsers can't
create the PKCE challenge anywhere else.

1. In [GitHub's developer settings](https://github.com/settings/developers), create an OAuth app for each environment
   and give it two callback URLs: the application URL followed by `/auth/github/callback` for signing in, and by
   `/auth/github/callback/link` for linking GitHub on the profile. For development those are
   `http://localhost:5173/auth/github/callback` and `http://localhost:5173/auth/github/callback/link`. GitHub matches
   each exactly, so leave wildcard matching off.
2. Set its client ID as `VITE_GITHUB_CLIENT_ID`, in `.env.development.local` (not committed) or the environment of a
   production build.
3. Generate a client secret and give the server both, as it exchanges the code for GitHub's access token; without them
   `POST /auth/github` answers `404`. In production set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`; locally set
   `github.client-id` and `github.client-secret` in `application-dev.yaml`, see the server's README › Local
   configuration.

### Pages

* `/auth` sign in and create an account
* `/` home page
* `/exam` exam (placeholder)
* `/history` past exams (placeholder)
* `/profile` account data, pending email change, sign-in methods (link and unlink Google and GitHub), settings link and
  sign out
* `/settings` preferences (placeholder)
* `/auth/github/callback` finishes signing in with GitHub
* `/auth/github/callback/link` hands GitHub's code to the profile to link the account (signed in)
* `/auth/verify` verify email
* `/auth/verify/sent` verification link sent after registration
* `/auth/password/forgot` request a password reset link
* `/auth/password/reset` set a new password
* any other path: 404 page, with a link home (or to sign in when signed out)

### Used endpoints

* `/auth`
    + `POST` sign in
    + `POST /google` sign in with a Google ID token
    + `POST /github` sign in with a GitHub authorization code
    + `POST /refresh` get a new token pair
    + `POST /logout` sign out (revoke the refresh token)
    + `POST /verify` verify email
    + `POST /verify/resend` resend verification link
    + `POST /password/forgot` request a password reset link
    + `POST /password/reset` set a new password
* `/users`
    + `POST` register new user
    + `GET /me` get the signed-in user
    + `GET /me/stats` get the signed-in user's exam statistics
    + `POST /me/identities/google`, `POST /me/identities/github` link a provider account
    + `DELETE /me/identities/{provider}` unlink a provider account
    + `PATCH /{id}` update a user
    + `PATCH /me/password` change password
    + `DELETE /me` delete own account
    + `GET` list users (admin)
    + `GET /{id}` get a user (admin)
    + `DELETE /{id}` delete a user (admin)
* `/exams`
    + `POST` create an exam
    + `GET /{id}` get an exam
    + `GET` list a user's exams
    + `POST /{id}/answers` submit an answer
    + `POST /{id}/finish` finish an exam
* `/questions`
    + `GET /random` get a random question
    + `GET` list questions (admin)
    + `GET /{id}` get a question
    + `POST` upload questions from CSV (admin)
