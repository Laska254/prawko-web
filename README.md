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
  api/          axios setup and requests, error model, query client and keys, credentials, dto/
  session/      signed-in session: context, current user (planned)
  i18n/         translations setup, locales/<language>/<namespace>.json (planned)
  components/   shared UI with no feature or server knowledge, grouped by role (form/, feedback/, layout/)
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
  in the feature.
* Server data goes through TanStack Query: feature hooks read with `useQuery` and change with `useMutation`, using
  the keys from `api/queryKeys.tsx`, and a mutation invalidates the keys of the resource it changed.
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

### Pages

* `/auth` sign in and create an account
* `/` home page
* `/exam` exam (placeholder)
* `/history` past exams (placeholder)
* `/profile` account (placeholder)
* `/settings` preferences (placeholder)
* `/auth/verify` verify email
* `/auth/verify/sent` verification link sent after registration
* `/auth/password/forgot` request a password reset link
* `/auth/password/reset` set a new password
* any other path: 404 page, with a link home (or to sign in when signed out)

### Used endpoints

* `/auth`
    + `POST` sign in
    + `POST /verify` verify email
    + `POST /verify/resend` resend verification link
    + `POST /password/forgot` request a password reset link
    + `POST /password/reset` set a new password
* `/users`
    + `POST` register new user
