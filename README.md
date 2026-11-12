# Prawko Web

[![codecov](https://codecov.io/gh/Laska254/prawko-web/graph/badge.svg)](https://codecov.io/gh/Laska254/prawko-web)

## Table of Contents

* [Overview](#overview)
* [Documentation](#documentation)
* [Prerequisites](#prerequisites)
* [Quick start](#quick-start)

---

## Overview

**Prawko Web** is a web client created with React 19, TypeScript and Material UI for Prawko projects.

It is the frontend for [Prawko Server](https://github.com/Laska254/prawko-server). All data and authentication
are handled by the server, so it must be running for the web client to work.

---

## Documentation

* [Development](docs/development.md) - scripts (build, lint, test, coverage), WebStorm setup for Biome
* [Configuration](docs/configuration.md) - server URL and CORS, Google and GitHub sign-in
* [Project structure](docs/project-structure.md) - folders, import rules, where code goes, naming
* [Pages and endpoints](docs/routes.md) - routes of the application, server endpoints it calls

---

## Prerequisites

* Node.js 24.15+ (CI runs the version in `.nvmrc`)
* npm
* Running [Prawko Server](https://github.com/Laska254/prawko-server), see
  its [Quick start](https://github.com/Laska254/prawko-server#quick-start)

### Debian 13

Debian's own `nodejs` package is too old, use [NodeSource](https://github.com/nodesource/distributions) instead
(it includes npm)

`curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -`

`sudo apt install nodejs`

### Windows

`winget install OpenJS.NodeJS.LTS`

---

## Quick start

Clone repository

`git clone git@github.com:Laska254/prawko-web.git`

`cd prawko-web`

Install dependencies

`npm install`

Test (with the 100% coverage check)

`npm run coverage`

Run

`npm run dev`

Then open `http://localhost:5173/`, see [Configuration](docs/configuration.md) for the server URL and sign-in
providers.
