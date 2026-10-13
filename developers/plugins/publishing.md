---
title: Publishing
sidebar_position: 7
description: How to name, version, test and publish a RapidMX plugin to npm, and what a deployment has to allow before it can install one that isn't from the RapidMX project.
---

# Publishing

A plugin reaches a deployment as an npm package. The admin console finds it in a registry, the server installs the exact
version an administrator picked, and every server copy checks it against the integrity hash the registry published.
This page covers what to get right before you publish, how to test a build on a real server first, and what an operator
has to configure before their server will install a plugin that isn't part of the RapidMX project.

## Before you publish

### Name

Publish the plugin as a **scoped** package whose name **ends in `-plugin`**: `@acme/greeting-plugin`. The admin
console's search lists the packages in each configured namespace (an npm scope) whose names end in `-plugin`; a package
named any other way can still be added by its exact name, but nobody will find it by searching.

### Package contents

- `files` must include `dist` and, when the plugin has pages, `apps` (the TSX sources the server builds from).
- `@rapidrest/core`, `@rapidrest/service-core`, `@rapidmx/restapi` and, for pages, `@rapidmx/web-client`, `react` and
  `react-dom` are **peer dependencies**. The server installs plugins without their peer dependencies and refuses one
  that brings its own copy of the first three. A peer dependency that is also a runtime library you need, such as an
  editor component the web client already ships, is shared the same way: the CRM plugin declares `@tiptap/*`,
  `@dnd-kit/core` and `react-icons` as peers for that reason.
- Everything in `dependencies` is installed from the registry with `--ignore-scripts`, so a dependency that needs an
  install script to work won't work. The installed size of all plugins together is capped at 500 MB by default
  (`system:plugins:max_install_bytes`).
- Build in `prepublish`, as the published plugins do (`"prepublish": "yarn build"`), so the tarball always has a fresh
  `dist`.

### Manifest

Check the manifest against the server's own validator before every release. `parsePluginManifest()` from
`@rapidmx/restapi` is what the server runs, and a test that calls it on the package's `package.json` catches an invalid
setting, a bad mount or a duplicate id. See [Routes, models and jobs](routes-and-models.md#the-entry-point-rule).

Pay particular attention to setting keys. The server refuses a setting under any of its own configuration namespaces,
and that list grows as the server does. A key that was allowed when you published can become reserved in a later
server release, and the whole plugin is then refused, so keep every key under your plugin's own namespace
(`mail:yourplugin:*`) and recheck the manifest against each new `@rapidmx/restapi` release. The list and the reasons
for it are on the [Settings](settings.md#keys-a-plugin-may-not-use) page.

### Versions

- Use exact semver versions. The server stores and installs the exact version an administrator chose, never a range.
- The admin console offers the registry's `latest` release by default, or the highest release when `latest` doesn't
  name one. Prereleases (`1.0.0-beta.2`) are only offered when the administrator asks for them, so publish a prerelease
  with a dist-tag other than `latest`.
- `apiVersion` stays `1` until the server publishes a new plugin contract.
- Declare the `@rapidmx/restapi` and `@rapidmx/web-client` versions you built against as the lower bound of the peer
  range (`">=0.33.0 <1"`), so the range says which servers you have tested with.
- Keep model class names and setting keys stable across releases. Renaming a model orphans its data, and renaming a
  setting drops the value saved under the old key.

### Integrity

The server records the registry's `dist.integrity` hash when an administrator adds a plugin and refuses an installed
package that doesn't match it. npm publishes that hash for you. A private registry that publishes only legacy `shasum`
values works only if the operator turns off `system:plugins:require_integrity`, which also turns off the check.

## Test a build on a real server first

Two ways to run an unpublished build, both from the file `npm pack` writes.

**From the server's configuration**, for development. Point `system:plugins:sources` at the tarball, and list the
plugin in `system:plugins:defaults` so it gets a row:

```sh
export system__plugins__sources='{"@acme/greeting-plugin":"/home/me/src/greeting-plugin/acme-greeting-plugin-0.2.0.tgz"}'
export system__plugins__defaults='[{"name":"@acme/greeting-plugin","enabled":true}]'
```

A plugin listed in `sources` is installed from the tarball in place of the registry version, and isn't checked against
a registry integrity hash. [Create a plugin](create-a-plugin.md#6-run-it-on-a-local-server) walks through this on a local
server. Use a tarball, never the plugin's folder: a folder resolves its own development copies of the shared packages
and is refused.

**From the admin console**, on a deployment you don't control the configuration of. On the Plugins page, **Upload**
installs a plugin from the `.tgz` file `npm pack` produced. This needs an administrator with an elevated sign-in. The
server stores the pack in its blob store so every server copy installs the same bytes, records its own integrity hash,
and skips the allow-list (the administrator vouches for the code). Packs are limited to 50 MiB
(`system:plugins:uploads:max_bytes`) and the feature can be switched off (`system:plugins:uploads:enabled`). An uploaded
pack's dependencies must still come from the registry: a dependency on a path, a git URL or a tarball URL is refused. An
uploaded plugin isn't offered registry updates; choosing a registry version for it later switches it back to the
registry.

After deploying either way, check the admin console's Plugins page and the server log for each server copy. "Loaded
plugin" and "Serving plugin ... pages" lines mean it worked; a refused check, an import error or a page build error is
reported there with the reason. Exercise the plugin's real routes and pages too: a plugin that loads can still fail at
the first request.

## Publish

```sh
npm publish --access public
```

The RapidMX project's own plugins are released with the same tooling as the rest of the project, which builds the
changelog, tags and publishes. See [Releasing](../workflow/releasing.md).

## Getting a third-party plugin onto a deployment

Out of the box a server only installs packages in the `@rapidmx` scope. A plugin runs with the server's full privileges,
so only the operator, through the server's configuration, can allow more. There are three ways, and the plugin's
documentation should tell operators which one to use:

1. **Add the plugin's scope as a namespace.** `system:plugins:namespaces` lists the scopes the admin console searches,
   and packages in them may be added. Keep `@rapidmx` in the list. An entry can name its own registry and token for a
   private scope:

   ```sh
   export system__plugins__namespaces='["@rapidmx", {"name": "@acme", "registry": "https://npm.acme.example", "token": "..."}]'
   ```
2. **Allow individual packages** with `system:plugins:allowed_packages` (package names, or a scoped wildcard such as
   `@acme/*`). An unscoped wildcard is ignored, so nothing can allow the whole registry.
3. **Upload the pack** from the admin console, as above.

A namespace or allowed package doesn't install anything by itself. An administrator still adds the plugin on the
Plugins page, and only from then on does every server copy install it. If the allow-list is later narrowed, plugins
already installed from it are refused at the next start and reported on the Plugins page.

## Security expectations

Because a plugin has the server's full access, treat it like code in the server itself:

- follow the same rules as core code for mailbox data: check access with trusted roles stripped (see
  [Routes, models and jobs](routes-and-models.md#mailbox-data-and-administrators));
- rate-limit every route that answers anonymous callers;
- mark sensitive settings `"secret": true`;
- report vulnerabilities in RapidMX's own plugins the way [Security](../security.md) describes.
