---
title: Create a plugin
sidebar_position: 2
description: Build a small working RapidMX plugin with an API route, an admin setting, a Settings page and a navigation entry, then run it on a local server.
---

# Create a plugin

This walkthrough builds a complete, if tiny, plugin: **Greeting**. It adds an API route that returns a message, a setting
that lets an administrator change that message in the admin console, and a page in the web app's Settings that shows it,
with an entry in the Settings sidebar. That covers every part of the plugin contract except models and jobs, which
[Routes and models](routes-and-models.md) adds on top.

Everything here follows the layout of the published plugins. When in doubt, compare with `@rapidmx/autodiscover-plugin`
(the smallest server-side plugin) and `@rapidmx/booking-plugin` (the closest one with pages).

You need Node 24 or later, Yarn 4, and a RapidMX server you can run from source (see
[Development environment](../dev-environment.md)).

## 1. Create the package

The finished plugin looks like this:

```text
greeting-plugin/
├── package.json
├── tsconfig.json          ← compiles src/ to dist/lib
├── tsconfig.apps.json     ← compiles apps/ to dist/apps
├── src/
│   ├── index.ts           ← the package root: shared, abstract code
│   ├── GreetingRoute.ts
│   ├── mongo.ts           ← ./mongo entry point
│   └── sql.ts             ← ./sql entry point
└── apps/
    └── settings-greeting/
        ├── _layout.tsx
        └── index.tsx
```

Start with `package.json`. The parts that matter to the server are `type`, `exports`, `files`, the peer dependencies and
the `rapidmx.plugin` block:

```json
{
    "name": "@acme/greeting-plugin",
    "version": "0.1.0",
    "description": "Adds a greeting to RapidMX.",
    "license": "MPL-2.0",
    "type": "module",
    "main": "dist/lib/index.js",
    "exports": {
        ".": {
            "import": "./dist/lib/index.js",
            "types": "./dist/types/index.d.ts"
        },
        "./mongo": {
            "import": "./dist/lib/mongo.js",
            "types": "./dist/types/mongo.d.ts"
        },
        "./sql": {
            "import": "./dist/lib/sql.js",
            "types": "./dist/types/sql.d.ts"
        }
    },
    "typings": "dist/types/index.d.ts",
    "files": ["apps", "dist"],
    "scripts": {
        "build": "rimraf dist && tsc && tsc -p tsconfig.apps.json"
    },
    "peerDependencies": {
        "@rapidmx/restapi": ">=0.33.0 <1",
        "@rapidmx/web-client": ">=0.35.0 <1",
        "@rapidrest/core": "6.x",
        "@rapidrest/service-core": "2.x",
        "react": "19.x",
        "react-dom": "19.x"
    },
    "devDependencies": {
        "@rapidmx/restapi": "^0.33.0",
        "@rapidmx/web-client": "^0.35.0",
        "@rapidrest/core": "^6.0.0",
        "@rapidrest/service-core": "^2.4.0",
        "@types/react": "^19.2.18",
        "react": "^19.2.8",
        "react-dom": "^19.2.8",
        "rimraf": "^6.1.3",
        "typescript": "^6.0.3"
    },
    "rapidmx": {
        "plugin": {
            "apiVersion": 1,
            "displayName": "Greeting",
            "description": "Shows a greeting chosen by the administrator in Settings.",
            "settings": [
                {
                    "key": "mail:greeting:message",
                    "label": "Greeting",
                    "type": "string",
                    "default": "Hello from RapidMX",
                    "help": "The text every user sees on the Greeting settings page."
                }
            ],
            "ui": {
                "apps": [
                    {
                        "id": "greeting",
                        "host": "www",
                        "mount": "/settings/greeting",
                        "dir": "apps/settings-greeting"
                    }
                ],
                "settingsSections": [
                    {
                        "id": "greeting",
                        "label": "Greeting",
                        "href": "/settings/greeting",
                        "icon": "HiOutlineSparkles"
                    }
                ]
            }
        }
    }
}
```

A few rules are easy to get wrong:

- **The packages the server shares must be peer dependencies.** `@rapidrest/core`, `@rapidrest/service-core` and
  `@rapidmx/restapi` have to resolve to the server's own copies. A plugin that installs its own copy of any of them is
  refused, because a second copy breaks decorator metadata and `instanceof` checks and its classes would silently never
  load. Put them in `peerDependencies` (and `devDependencies` for building), never in `dependencies`. The same goes for
  `react`, `react-dom` and `@rapidmx/web-client` when the plugin has pages.
- **`files` must include `apps`.** The server builds plugin pages from their TSX sources, so the sources ship in the
  package next to the compiled `dist`.
- **`apiVersion` must be `1`.** That is the only plugin contract version the server accepts.

The manifest fields themselves are covered in the pages that use them: settings in [Settings](settings.md), `ui` in
[Pages and navigation](pages-and-navigation.md), and `requires` and `mailboxScopedData` in
[Routes and models](routes-and-models.md).

## 2. Write the route

`src/GreetingRoute.ts` is a normal RapidREST route class. `@ApiRoute("mail/greeting")` serves it under
`/api/mail/greeting`, and `@Config` reads the setting the manifest declares:

```ts
import { ApiError, ObjectDecorators, type JWTUser } from "@rapidrest/core";
import { ApiErrorMessages, ApiErrors, RouteDecorators } from "@rapidrest/service-core";
const { Config } = ObjectDecorators;
const { ApiRoute, Get, User: AuthUser } = RouteDecorators;

/** `GET /api/mail/greeting`: the greeting the administrator chose, for any signed-in user. */
@ApiRoute("mail/greeting")
export class GreetingRoute {
    @Config("mail:greeting:message", "Hello from RapidMX")
    protected message: string = "Hello from RapidMX";

    @Get()
    public async get(@AuthUser user?: JWTUser): Promise<{ message: string }> {
        if (!user) {
            throw new ApiError(ApiErrors.AUTH_PERMISSION_FAILURE, 403, ApiErrorMessages.AUTH_PERMISSION_FAILURE);
        }
        return { message: this.message };
    }
}
```

The route reads the setting through `@Config` like any other configuration value. The server merges an administrator's
saved value into the configuration before it creates any plugin class, so the plugin needs no settings code of its own.

## 3. Add the entry points

The server imports exactly one file from the plugin: `./mongo` on a MongoDB deployment, `./sql` on a SQL one. It then
registers **every export** of that file. A model is connected, a route is mounted and a job is started. So an entry point
must export only ready-to-use classes, never abstract base classes, helpers or constants.

This route doesn't touch the database, so both entry points export the same class:

```ts
// src/mongo.ts
export { GreetingRoute } from "./GreetingRoute.js";
```

```ts
// src/sql.ts
export { GreetingRoute } from "./GreetingRoute.js";
```

Anything you want to share with other packages (types, abstract classes, helpers) goes in `src/index.ts`, the package
root, which the server never loads. Once a plugin has models, its entry points diverge: `./mongo` exports the Mongo
classes and `./sql` the SQL ones, as `@rapidmx/booking-plugin`'s do.

The TypeScript settings match the published plugins. `tsconfig.json` compiles `src/` with decorators on:

```json
{
    "compilerOptions": {
        "moduleResolution": "NodeNext",
        "target": "ES2020",
        "module": "NodeNext",
        "strict": true,
        "sourceMap": true,
        "declaration": true,
        "allowSyntheticDefaultImports": true,
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        "noImplicitAny": false,
        "rootDir": "src",
        "declarationDir": "dist/types",
        "outDir": "dist/lib"
    },
    "include": ["src"]
}
```

## 4. Add the page

A UI app is a directory of pages in the `@rapidrest/react` convention: a required `_layout.tsx` that renders the HTML
document, and one file per page (see [App directory convention](https://rapidrest.dev/docs/ssr-react/app-convention)).
The app's `index.tsx` is served at its `mount`, `/settings/greeting`.

Every app directory needs its own `_layout.tsx`. The published plugins copy the web client's layout so the page gets the
deployment's branding; this is a shortened version of `@rapidmx/booking-plugin`'s:

```tsx
// apps/settings-greeting/_layout.tsx
import React, { PropsWithChildren } from "react";
import { Branding } from "@rapidmx/web-client/lib/branding/brandingApi.js";
import { CUSTOM_STYLESHEET_LINK_ID } from "@rapidmx/web-client/lib/branding/useBranding.js";

export default function Layout({ children, branding }: PropsWithChildren<{ branding?: Branding }>) {
    const title = branding?.title || branding?.companyName ? `${branding?.title || branding?.companyName}: Mail` : "RapidMX: Mail";
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>{title}</title>
                {branding?.stylesheetUrl && <link rel="stylesheet" href={branding.stylesheetUrl} id={CUSTOM_STYLESHEET_LINK_ID} />}
            </head>
            <body>{children}</body>
        </html>
    );
}
```

The page wraps itself in the web client's `SettingsShell`, passing its props straight through so the shell gets the
navigation entries of every plugin, and marks its own sidebar entry `active`:

```tsx
// apps/settings-greeting/index.tsx
import React, { useEffect, useState } from "react";
import SettingsShell, { SettingsShellProps } from "@rapidmx/web-client/shared/components/settings/layout/SettingsShell.js";
import { apiFetch } from "@rapidmx/web-client/lib/util/api.js";

export default function GreetingSettingsPage(props: Omit<SettingsShellProps, "active">) {
    return (
        <SettingsShell {...props} active="greeting">
            <Greeting />
        </SettingsShell>
    );
}

function Greeting() {
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        apiFetch<{ message: string }>("/api/mail/greeting")
            .then((answer) => setMessage(answer.message))
            .catch(() => setMessage("The greeting could not be loaded."));
    }, []);

    return (
        <div className="flex-1 min-w-0 overflow-y-auto p-6">
            <h1 className="text-lg font-bold tracking-tight">Greeting</h1>
            <p className="text-sm text-text-muted">{message ?? "Loading…"}</p>
        </div>
    );
}
```

`active="greeting"` matches the `id` of the `settingsSections` entry in the manifest, which is how the shell highlights
it. The class names are the web client's Tailwind tokens, which plugin pages share because the server builds them into
the same stylesheet.

The server renders a page server-side from its compiled copy under `dist/<dir>`, so the apps are compiled too. This is
`tsconfig.apps.json`, as in the published plugins:

```json
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "ESNext",
        "moduleResolution": "Bundler",
        "jsx": "react-jsx",
        "rootDir": "apps",
        "outDir": "dist/apps",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "sourceMap": false,
        "declaration": true,
        "allowSyntheticDefaultImports": true,
        "noImplicitAny": false,
        "types": ["vite/client"]
    },
    "include": ["apps"]
}
```

## 5. Build and pack

```sh
yarn install
yarn build
npm pack
```

`npm pack` writes `acme-greeting-plugin-0.1.0.tgz` with exactly what a registry install would deliver. Use the tarball
rather than pointing the server at the plugin's folder: a folder would bring its own development copies of the shared
packages, and the server would refuse it.

## 6. Run it on a local server

The server installs a local tarball in place of a registry package when it is listed in `system:plugins:sources`. A
plugin also needs a row in the plugin table, and the simplest way to get one locally is to list it as a default plugin
too. Both are JSON-valued configuration keys, so set them as environment variables before starting the server from its
own checkout:

```sh
export system__plugins__sources='{"@acme/greeting-plugin":"/home/me/src/greeting-plugin/acme-greeting-plugin-0.1.0.tgz"}'
export system__plugins__defaults='[{"name":"@acme/greeting-plugin","enabled":true}]'
yarn dev
```

Use an absolute path for the tarball. Setting `system__plugins__defaults` replaces the whole default list for that run,
which is fine on a development database: defaults are only added for plugins that have never had a row, and existing rows
stay as they are.

A plugin named in `system:plugins:sources` or `system:plugins:defaults` is trusted because the operator configured it,
so it doesn't need to be in `system:plugins:allowed_packages`.

When the server starts, look for these lines in its log:

```text
Added default plugin @acme/greeting-plugin@0.1.0.
Loaded plugin @acme/greeting-plugin@0.1.0.
Serving plugin @acme/greeting-plugin's www pages at /settings/greeting.
```

Then:

1. Open the web app and go to **Settings**. A **Greeting** entry appears at the end of the section list.
2. Open it. The page shows "Hello from RapidMX".
3. In the admin console, open **Plugins**, choose **Settings** on the Greeting row, change the text and save. The server
   restarts its worker to apply it, and the page shows the new text.

If the plugin doesn't show up, the admin console's Plugins page and the server log say why: a failed check (for example
"The plugin brings its own copy of @rapidrest/core"), an import error, or a UI build error.

## 7. Iterate

After every change, rebuild and pack again, then restart the server. With the same version number the server can't tell
a new tarball from the old one by its version, so bump `version` (or delete the server's `plugins` folder) when a change
doesn't seem to take effect. Running the plugin's own tests is faster than a server restart for most changes, see
[Testing](../workflow/testing.md).

## Next steps

- [Routes and models](routes-and-models.md): store data, scope it to mailboxes, run background jobs.
- [Pages and navigation](pages-and-navigation.md): public pages, admin pages, the app rail.
- [Settings](settings.md): setting types, secrets and how saved values interact with the environment.
- [Publishing](publishing.md): get the plugin onto a real deployment.
