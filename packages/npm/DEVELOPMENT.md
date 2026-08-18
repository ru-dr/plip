# `@ru-dr/plip` — package development guide

Source for the published npm package. This file is for contributors; the README
that ships to npm is **not** maintained here.

> **`packages/npm/README.md`, `LICENSE`, and `CHANGELOG.md` are generated.**
> `scripts/prepare-dist.mjs` copies them from the repo root during `build:finalize`,
> and `build:clean` deletes them again. They are gitignored — edit the copies at the
> repo root instead. npm cannot include files from outside the package directory,
> which is why they are copied in.

## Layout

```
src/
  index.ts          public entry point — re-exports everything below
  core/             logger implementation, factory, config resolution, levels, transport base
  transports/       console, file, remote, browser sinks
  formatters/       text and json output formatters
  adapters/         framework integrations (react, nextjs)
  types/            public type declarations (config, logger, transport)
  utils/            env/runtime detection, color handling, performance timers
tests/              bun test suites, one file per area
scripts/            build helpers
```

Anything not re-exported from `src/index.ts` is internal and may change without a
major bump.

## Requirements

- [Bun](https://bun.sh) (test runner, package manager, dev runner)
- Node.js >= 16 for consumers (`engines.node`)
- No runtime dependencies. Keep it that way — the package advertises
  `"sideEffects": false` and zero deps.

```sh
bun install
```

## Common tasks

| Command | What it does |
| --- | --- |
| `bun test` | Run the full suite |
| `bun test --watch` | Watch mode (`bun run test:watch`) |
| `bun run test:coverage` | Coverage report |
| `bun run typecheck` | `tsc --noEmit` for `src` (build config) **and** `tsconfig.test.json` (`src` + `tests`) |
| `bun run lint` / `lint:fix` | ESLint flat config (`eslint.config.mjs`) |
| `bun run dev` | Execute `src/index.ts` directly |
| `bun run build` | Full dual-format build (see below) |

`tsconfig.json` excludes `tests/**` because it is the emit config for `dist/esm`.
`tsconfig.test.json` extends it with `noEmit` and the test files included, so test
code is type-checked too — `bun test` alone does not check types.

## Build

`bun run build` runs four steps in order:

1. `build:clean` — `rm -rf dist README.md LICENSE CHANGELOG.md`
2. `build:esm` — `tsc -p tsconfig.json` → `dist/esm` (with `.d.ts` + declaration maps)
3. `build:cjs` — `tsc -p tsconfig.cjs.json` → `dist/cjs` (no declarations)
4. `build:finalize` — `scripts/prepare-dist.mjs`: writes `dist/cjs/package.json`
   containing `{"type": "commonjs"}` so Node resolves those files as CJS despite the
   package's top-level `"type": "module"`, then copies the root docs in.

Both `import` and `require` must keep working; `exports` maps `import` →
`dist/esm/index.js` and `require` → `dist/cjs/index.js`.

Source uses explicit `.js` extensions in relative imports (`./core/index.js`) —
required for ESM output. `verbatimModuleSyntax` is on for the ESM config, so use
`import type` / `export type` for type-only imports.

## Publishing

`prepublishOnly` gates every publish on `typecheck && lint && test && build`, so a
broken build cannot ship.

```sh
bun run version:patch      # or minor / major / prerelease — no git tag
bun run release            # build + test + npm publish
bun run release:beta       # publish under the `beta` tag
bun run release:full       # release + push tags + gh release create
```

Update the root `CHANGELOG.md` before releasing — it is what ends up in the tarball.

## Docs site

VitePress docs live in `../../docs` but are driven from this package:
`bun run docs:dev`, `docs:build`, `docs:preview`.
