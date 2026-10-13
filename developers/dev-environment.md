---
title: Development environment
description: Set up the tools, clone the repositories side by side, run the server with yarn dev, and test changes that span repositories.
sidebar_position: 4
---

# Development environment

You can run RapidMX from source on a laptop with nothing but Node.js. `yarn dev` starts in-memory databases, signs you
in automatically and delivers mail locally, so you don't need the auth-server, Postfix or the virus scanner to work on
most features. You add those pieces only when your change touches them.

The part that needs care is working across repositories. The server consumes `restapi`, `web-client` and the plugins
as published npm packages, so a change in one of them does not reach the server until you put it there. The
[last section](#working-across-repositories) explains the safe way to do that.

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 24 or later | Every repository declares `"engines": { "node": ">=24.0.0" }`. CI runs on a Node 24 image (`server`) or the current Node LTS image (most libraries). |
| Yarn | Pinned per repository | Each `package.json` has a `packageManager` field (`yarn@4.5.3` in most repositories, `yarn@4.2.2` in `server`, `postfix-bridge` and `acme-server`). Run `corepack enable` once and Corepack uses the right version in each checkout. |
| Git | Any recent version | |
| A C/C++ toolchain and Python 3 | | Some dependencies build native modules (for example `better-sqlite3`, used by the SQL tests). CI installs `build-essential` and `python3`. |
| Docker with Compose v2.20 or later | Optional | Only for running the real scanners, the auth-server or the full stack. |
| Rust and the Tauri CLI | Optional | Only for `tauri-client`'s native code. |

[Visual Studio Code](https://code.visualstudio.com/) is the recommended editor. Most repositories include launch
configurations.

## Clone the repositories side by side

Clone the repositories you need into one parent folder, next to each other. The [Repositories](./repositories.md)
page lists them all. For most work on the server and its UI, three are enough:

```bash
mkdir rapidmx && cd rapidmx
git clone https://github.com/rapidmx/server
git clone https://github.com/rapidmx/restapi
git clone https://github.com/rapidmx/web-client
```

Add a plugin repository (for example `booking-plugin`) when you work on that plugin, and the RapidREST repositories
(`core`, `service-core`, `react`, `cli`) when a bug leads into the framework.

In each checkout:

```bash
corepack enable
yarn install
```

## Run the server with yarn dev

```bash
cd server
yarn dev
```

`yarn dev` runs `rapidrest dev`, which:

1. Starts an in-memory server for each database `src/config.ts` configures (MongoDB and Redis by default), so you
   don't install either.
2. Runs the server from the TypeScript sources with `tsx --watch`, restarting on changes under `src/`.
3. Runs `vite build --watch` for the browser bundles.
4. Listens on port 3000, or the next free port.

Open `http://localhost:3000`. Under `yarn dev` the server also changes three things so you can work without the rest
of the stack:

- **You are signed in automatically.** Every request without a valid `jwt` cookie is signed in as a synthetic dev
  user with administrator rights, with no auth-server running. A real, valid cookie is still honoured. Self-service
  mailbox provisioning offers the dev user the address `dev-user@example.com`.
- **Unreachable scanners are bypassed.** While rspamd or ClamAV cannot be connected to at all (connection refused, a
  host name that doesn't resolve, a timeout), scans are treated as clean and the server logs a `[dev] ... is
  unreachable` warning. Once the scanners answer, their verdicts are used again.
- **Mail is delivered locally.** Without a `sendmail` binary at `mail:transport:sendmail:path` (default
  `/usr/sbin/sendmail`), a sent message is delivered straight into this server's own mailboxes through the same ingest
  path Postfix uses. Mail to other domains is rejected, and a message with no local recipient fails to send.

All three only happen with `NODE_ENV` set to `dev`, `development` or `test`, and the automatic sign-in only when the
server runs from `.ts` sources outside a test runner. With any other `NODE_ENV` the real providers are used, and a
scanner outage makes every send fail closed. Don't weaken these guards. See [Security](./security.md).

:::tip PostgreSQL instead of MongoDB
`src/config.ts` re-exports `config.mongo.js`. Switch its export to `config.sql.js` to run against PostgreSQL. Every
feature has to work on both backends, so try both before you open a pull request that touches models or queries.
:::

### Run the real scanners

To test spam or virus handling, start rspamd and ClamAV with Docker. ClamAV needs about 1 GiB of memory and a few
minutes to load its signatures.

```bash
docker compose -f docker-compose.mail.yml up -d
```

The server uses them as soon as they answer.

### Run the full stack

To test sign-in, the admin console's elevated sessions or anything else that involves the real auth-server, run the
Docker Compose stack instead. It builds the server image and starts the auth-server, MongoDB, Redis, rspamd and
ClamAV:

```bash
docker compose -p rapidmx -f docker-compose.mongo.yml up -d --build
```

The [Docker Compose guide](/docs/getting-started/docker-compose) explains how to read the admin password and finish
setup. Real inbound and outbound mail additionally needs the `postfix-bridge` stack in the same Compose project.

## Debugging

- **From VS Code, with `yarn dev`.** Run `yarn debug` (`rapidrest dev --inspect`) and attach to the Node inspector on
  port 9229.
- **In Docker.** `docker-compose.debug.yml` builds a development image that runs `yarn debug` and publishes ports
  3000 and 9229 on the loopback address only. Add it to the Compose command above with a second `-f`, then use the
  **Docker: Attach to Node** launch configuration in the server's `.vscode/launch.json`.
- **Library repositories.** `restapi` and the plugins ship an **Attach** configuration and a **vitest**
  configuration that runs the test suite under the debugger.

## Working across repositories

A typical change touches two repositories: say, a new field in `restapi` and the UI for it in `web-client`, both of
which the server consumes as npm packages. You need to see the unreleased versions running inside the server before
anything is published.

:::danger Don't link sibling checkouts with portal: or link:
It is tempting to point the server's `package.json` at `portal:../restapi` or `link:../restapi`. Don't. The
repositories are not a Yarn workspace, so the link exposes the sibling's whole folder, including its own
`node_modules`. Those contain the sibling's private copies of `@rapidrest/core` and `@rapidrest/service-core`
(installed to build and test it on its own). Node then loads two copies of the framework, and RapidREST's decorators
and `instanceof` checks stop recognizing classes from the other copy.

The failure is silent. The route classes register, but none of their HTTP methods are mounted, so requests answer
`404`. In tests it shows up as a real network call inside what should be a fully mocked test, not as an error.
:::

Instead, replace the *built files* of the package already installed in the server. The installed copy keeps
resolving the framework from the server's own `node_modules`, exactly as the published package will.

### Option 1: yarn patch

This works for any dependency, including the RapidREST packages:

1. Build the sibling: `yarn build` in `restapi`.
2. In `server`, run `yarn patch @rapidmx/restapi`. Yarn extracts the installed package to a temporary folder and
   prints its path.
3. Replace that folder's `dist/` with the sibling's freshly built `dist/`.
4. Run `yarn patch-commit -s <the temporary folder>`, then `yarn install`.

`yarn install` should not print a `--preserve-symlinks` warning afterwards. If it does, something is still linked
and will hit the problem above. Repeat the steps after each change to the sibling.

### Option 2: copy the build into node_modules

For quick iterations on the UI, copy the build straight over the installed package:

1. Run `yarn build` in `web-client`.
2. Copy its `apps`, `lib` and `dist` folders over `server/node_modules/@rapidmx/web-client/`.
3. Delete `server/plugins/.ui-build`, so plugin pages are rebuilt against the new client.
4. Run `yarn build` in `server`, or restart `yarn dev`.
5. Hard-refresh the browser, because bundles are cached.

The next `yarn install` puts the published version back.

### Before you open pull requests

Neither a Yarn patch nor a copied build belongs in a pull request. Open the upstream pull request first (for example
in `restapi`). Once it is released, the downstream pull request raises the dependency range to the new version
(`"@rapidmx/restapi": "^0.34.0"`) and contains no patch. If you need to show the two working together before then,
say so in both pull requests and link them to each other.

To try a plugin you are developing inside a local server, install its `npm pack` tarball through the plugin sources
setting. [Create a plugin](./plugins/create-a-plugin.md) walks through it.
