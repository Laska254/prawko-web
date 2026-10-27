# Prawko Web

[![codecov](https://codecov.io/gh/Laska254/prawko-web/graph/badge.svg)](https://codecov.io/gh/Laska254/prawko-web)

## Table of Contents

* [Table of Contents](#table-of-contents)
* [Overview](#overview)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [IDE setup](#ide-setup)
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

## Usage

Application URL: `http://localhost:5173/`

Server URL: `http://localhost:8080/` (set via `VITE_API_URL` in `.env.development`; set it in the environment or a `.env.production` for production builds)

Prawko Server must allow CORS requests from the application URL.

### Pages

* `/auth` sign in and create an account
* `/` home page
* `/exam` exam (placeholder)
* `/auth/verify` verify email
* `/auth/verify/sent` verification link sent after registration
* `/auth/password/forgot` request a password reset link
* `/auth/password/reset` set a new password

### Used endpoints

* `/auth`
    + `POST` sign in
    + `POST /verify` verify email
    + `POST /verify/resend` resend verification link
    + `POST /password/forgot` request a password reset link
    + `POST /password/reset` set a new password
* `/users`
    + `POST` register new user
