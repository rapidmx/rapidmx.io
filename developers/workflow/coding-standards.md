---
title: Coding standards
description: The language, formatting, lint and design conventions every RapidMX repository follows.
sidebar_position: 1
---

# Coding standards

RapidMX's repositories share one set of conventions, so code moves easily between them and a reviewer can focus on
what a change does instead of how it is laid out. Most of the rules are enforced by tools that CI runs. The rest are
design rules that reviewers will ask about.

## Language and modules

- **TypeScript in strict mode**, compiled to ES modules (`"type": "module"`, `"module": "NodeNext"`). Relative
  imports carry the `.js` extension of the compiled file: `import { foo } from "./util/foo.js"`.
- **TypeScript 6.x.** Don't move a repository to a new TypeScript major on your own. The lint toolchain
  (`@typescript-eslint`) has to support it first.
- **Decorators** are RapidREST's legacy decorators with emitted metadata. Classes are wired with `@Inject` and
  `@Config`, routes with `@Route`, `@Get`, `@Post` and so on. See the RapidREST docs on
  [dependency injection](https://rapidrest.dev/docs/core-concepts/dependency-injection) and
  [routing](https://rapidrest.dev/docs/routing).

## Formatting

Every repository uses the same Prettier settings (in `.prettier.json` or the `prettier` key of `package.json`) and an
`.editorconfig` that matches them:

| Setting | Value |
| --- | --- |
| Indentation | 4 spaces |
| Line length | 120 characters |
| Quotes | Double |
| Semicolons | Always |
| Trailing commas | ES5 (objects and arrays, not function parameters) |
| Line endings | LF, with a final newline |

CI does not check formatting, so format with your editor's Prettier integration before you commit. Keep formatting
changes out of unrelated pull requests.

## Lint

Each repository has an `eslint.config.mjs` (flat config) with `@typescript-eslint`, `eslint-plugin-import` and
`eslint-plugin-jsdoc`. Among the rules that most often catch contributors:

- `no-floating-promises` and `await-thenable`: every promise is awaited, returned or explicitly handled.
- `no-unnecessary-type-assertion`: drop casts the compiler doesn't need.
- `no-duplicate-imports`: one import statement per module.
- `eqeqeq` (`smart`), `curly` (`multi-line`), `no-var`, `one-var` (`never`), `radix`.
- `naming-convention`: variables are `camelCase`, `UPPER_CASE` or `PascalCase`.

**Run `yarn build` before every commit, not just `tsc`.** In most repositories `yarn build` runs `yarn lint` first,
then the compiler, then any packaging checks. That is exactly what CI runs, and a bare `tsc` pass misses lint errors.
`rapidrest build` (used by `server` and `acme-server`) lints too. In `postfix-bridge`, `ses-bridge` and `tauri-client`
the build doesn't lint, so run `yarn lint` as well.

## File headers and comments

Source files start with a copyright and SPDX license header:

```ts
///////////////////////////////////////////////////////////////////////////////
// Copyright (C) 2026 Jean-Philippe Steinmetz
// SPDX-License-Identifier: MPL-2.0
///////////////////////////////////////////////////////////////////////////////
```

Keep the `SPDX-License-Identifier` line in every new file. Public classes and functions get a JSDoc comment that
says what they do and, where it isn't obvious, why. A comment that explains a non-obvious decision (a security
reason, a protocol quirk, a bug it works around) is worth more than one that restates the code.

## Design rules

These come up in review more than anything the linter checks.

- **Both database backends.** Every model and route exists in a MongoDB and a SQL variant (`*Mongo`/`*SQL` classes,
  `src/mongo/` and `src/sql/` folders). A change that works on one and not the other is not done. Test both.
- **No migration scripts.** The schema is created and updated from the models at startup. Design model changes so
  that existing rows keep working, for example by healing old data when it is read, as the well-known folders do.
- **Fix bugs where they live.** If a problem is in `restapi`, fix it in `restapi`, not with a workaround in `server`.
  If it is in RapidREST, fix it in the framework repository. These are not third-party dependencies.
- **Configuration through `@Config`.** New settings get a key (for example `mail:scan:sanitize:max_css_bytes`) and a
  safe default. Never mutate an object returned by `config.get()` in place: nconf returns the live, shared object, so
  clone it first.
- **Mailbox access goes through `hasMailAccess()`.** Never call `aclUtils.hasPermission()` directly in a mailbox-scoped
  route: it treats a trusted role as a superuser. A test fails if you do. See [Security](../security.md).
- **Change versions by structure, never by text.** A tool or script that bumps a version must find the value by its
  location (a YAML key, a specific table row, a `VERSION=` assignment), not by searching for the old version string.
  Sibling projects can share a version number, and a text search would rewrite their references too.
- **Kubernetes access is namespace-scoped.** Anything the Helm chart grants the server is a `Role` and `RoleBinding`
  on a chart-owned ServiceAccount, never a `ClusterRole`. Installing RapidMX must not need cluster-wide rights.
- **Crypto libraries: libsodium over OpenSSL.** Where native code needs a crypto library, use libsodium (as
  `tauri-client` does) and avoid build paths that depend on OpenSSL.

## Dependencies

Add a dependency only when it earns its place, and prefer one the repository already uses. Most repositories have a
`validate.sh` that CI runs as a non-blocking job: it audits dependencies for high-severity advisories and runs a
license check that fails on GPL, LGPL, EPL and CPL licenses. Because the job doesn't block a merge, check a new
dependency's license yourself before you add it.
