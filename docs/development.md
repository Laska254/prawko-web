# Development

## Scripts

Run (needs a running [Prawko Server](https://github.com/Laska254/prawko-server))

`npm run dev`

Build

`npm run build`

Lint ([Biome](https://biomejs.dev/), lint rules only, formatting is not checked)

`npm run lint`

Test

`npm test`

Coverage (fails below 100%, report in `coverage/`)

`npm run coverage`

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
