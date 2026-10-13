---
title: Pages and navigation
sidebar_position: 4
description: How a plugin ships browser pages for the web app, the admin console, the escrow console or the public, and adds entries to their navigation.
---

# Pages and navigation

Most plugins need a user interface: a settings screen for users, a page in the admin console, or a public page that
people without an account can open, like a booking page. A plugin ships these as React pages in TSX, and the server
builds them into its own browser bundles so they look and behave like the rest of RapidMX. This page explains the `ui`
block of the manifest, how the server builds and serves the pages, and which parts of the web client a page may use.

[Create a plugin](create-a-plugin.md) has a complete working example of a Settings page.

## The `ui` block

```json
"ui": {
    "apps": [
        { "id": "book", "host": "public", "mount": "/book", "dir": "apps/book" },
        { "id": "booking-types", "host": "www", "mount": "/settings/booking-types", "dir": "apps/settings-booking-types" }
    ],
    "settingsSections": [
        { "id": "booking-types", "label": "Booking Links", "href": "/settings/booking-types", "icon": "HiOutlineCalendarDays" }
    ]
}
```

That is `@rapidmx/booking-plugin`'s: a public app at `/book`, a Settings page at `/settings/booking-types`, and an entry
in the Settings sidebar pointing at it. `apps` declares what is served; the three navigation lists declare where the
shells link to it. A plugin can have one without the other, for example navigation pointing at a page another plugin
serves.

### Apps

Each entry in `apps` is one directory of pages:

| Field | Rule |
| --- | --- |
| `id` | A lowercase slug (`booking-types`), unique among the plugin's apps. |
| `host` | Which part of the site serves it: `public`, `www`, `admin` or `escrow` (below). |
| `mount` | The URL path its `index.tsx` is served at. It must fit the host's shape (below), use only lowercase letters, digits and dashes, and be exactly one segment below its base. |
| `dir` | The app's page directory inside the package, a relative path such as `apps/book`. |

The host decides who can open the pages and which props every page receives, because the plugin app's route extends
that host's base route:

| Host | Mount shape | What it is |
| --- | --- | --- |
| `public` | `/<name>` | Pages anyone can open without signing in, such as booking pages and CRM signup forms. No navigation props. |
| `www` | `/<name>` or `/settings/<name>` | The signed-in web app: a full app next to Mail and Calendar, or a page in Settings. |
| `admin` | `/admin/<name>` | The admin console. |
| `escrow` | `/escrow/<name>` | The key escrow console. No navigation props. |

A plugin may declare at most 16 apps. A mount is refused when it names a page the server or web client already has
(`/api`, `/settings/signatures`, `/admin/mailboxes` and so on), when it overlaps another of the plugin's own apps, or
when it overlaps an app of a plugin that loaded earlier. The first plugin to claim a path keeps it; the later one's app
isn't served and the admin console shows why.

### Navigation entries

| List | Where it appears | `href` must be |
| --- | --- | --- |
| `appRail` | The web app's app rail and mobile tab bar, after Mail, Calendar, Contacts and Tasks. | Outside `/admin` and `/escrow`. |
| `settingsSections` | The web app's Settings sidebar. | Under `/settings/`. |
| `adminNav` | The admin console's navigation. | Under `/admin/`. |

Each entry has an `id` (a lowercase slug unique within its list), a `label` of up to 64 characters, an `href` and an
optional `icon`. Each list holds at most 8 entries. The shells add plugin entries after their own, and skip one whose
`id` is already taken by a core entry or an earlier plugin's.

`icon` is the name of a `react-icons/hi2` icon. The manifest accepts any name of that shape, but the shells only know
the icons in the web client's `PLUGIN_ICONS` list (`@rapidmx/web-client/shared/plugins/pluginIcons.js`), such as
`HiOutlineCalendarDays`, `HiOutlineUserGroup`, `HiOutlineVideoCamera` and `HiOutlineSparkles`. Any other name shows a
generic puzzle piece. The Settings sidebar shows no icons.

An `appRail` entry can depend on the signed-in user with `resolveFrom`: an API path without the `/api` prefix. The web
app requests it for the user, and shows the entry only when the answer is `200` with `{ "href": "/some/path" }` on the
same site, linking there instead of `href`. Any other answer hides it. The meet plugin's **Meet** button uses
`"resolveFrom": "/mail/video-meetings/personal-room"`, so it shows only for users who have a personal meeting room.

## Writing the pages

Each app directory follows the `@rapidrest/react` convention: a required `_layout.tsx` that renders the HTML document,
then one page per file, with `index.tsx` at the mount and nested files and `[param].tsx` files below it (see
[App directory convention](https://rapidrest.dev/docs/ssr-react/app-convention)). Pages are rendered on the server and
hydrated in the browser.

Every app needs its own `_layout.tsx`. The published plugins copy the web client's layout, which reads the `branding`
prop so the page carries the deployment's title, icon and custom stylesheet from the first byte.

### Shells

`www` and `admin` pages wrap themselves in the web client's shell for their host, and pass the page props straight
through, so the shell gets the `pluginNav` prop the server supplies and shows every plugin's navigation:

| Page | Shell | `active` |
| --- | --- | --- |
| A full app (`www`, `/<name>`) | `shared/components/layout/AppShell.js` | The plugin's `appRail` entry id. |
| A Settings page (`www`, `/settings/<name>`) | `shared/components/settings/layout/SettingsShell.js` | The plugin's `settingsSections` entry id. `useSettingsShell()` gives the selected `mailboxUid` and the accessible `mailboxes`. |
| An admin page (`admin`) | `shared/components/admin/layout/AdminShell.js` | The plugin's `adminNav` entry id. The shell sends an administrator whose sign-in isn't elevated to confirm it first. |
| A public page | none | Use `BrandingHeader` and `BrandingFooter` from `shared/components/layout/BrandingChrome.js`. |

The CRM plugin's admin page is the whole pattern in a few lines:

```tsx
import React from "react";
import AdminShell, { AdminShellProps } from "@rapidmx/web-client/shared/components/admin/layout/AdminShell.js";
import CrmAdmin from "../shared/components/admin/CrmAdmin.js";

export default function CrmAdminPage(props: Omit<AdminShellProps, "active">) {
    return (
        <AdminShell {...props} active="crm">
            <CrmAdmin />
        </AdminShell>
    );
}
```

### What a page may import

The server builds plugin pages together with `@rapidmx/web-client`, so they share one React, one copy of the web
client's library state and one Tailwind stylesheet. The web client's README lists its **supported surface for plugin
pages**; anything else under its `apps/` is internal and can change in any release. In short:

- the shells above, `shared/plugins/pluginNav.js` (types) and `shared/plugins/pluginIcons.js`;
- page building blocks: `ResponsiveToolbar`, `usePagedList`, `notifyApiError()`, compose's `RecipientInput`,
  `Sparkline` and `MetricTile`;
- from `@rapidmx/web-client/lib`: `apiFetch()` and `ApiRequestError` (`util/api.js`) for calling your own routes,
  `useBranding()`, the mailbox and directory APIs, and generic components such as `Button`, `Alert`, `Modal`,
  `Drawer`, `FormField` and the date and time zone pickers.

Import modules by their full subpath with the `.js` extension, for example
`@rapidmx/web-client/lib/util/api.js`. The package has no root export.

`apiFetch()` calls a same-origin path, sends the CSRF header for writes and renews an expired sign-in once, so use it
rather than `fetch()` for your API.

## How the server builds and serves pages

Plugins ship their pages as sources, so the server builds them when it starts:

1. It drops any app whose mount clashes with another plugin's, a reserved path or a page the web client already has.
2. It builds the remaining plugin apps with Vite, together with the web client's own apps, into
   `<system:plugins:dir>/.ui-build/<hash>`. The hash covers the web client, the build tooling and each plugin's name,
   version and integrity (or the content of its apps when it was installed from a local tarball). The same plugin set
   reuses the same build.
3. It registers a route for each app at its mount, after checking the mount against every route already registered.
   Server-side rendering uses the compiled pages in the package's `dist/<dir>`, which is why a plugin compiles `apps/`
   with `tsconfig.apps.json` as well as shipping the sources.

The first start after a plugin with UI is added, upgraded, enabled or disabled takes longer: a few seconds on a typical
machine, about a minute on a small CPU limit, plus a few hundred MiB of memory while it runs.

A plugin whose UI fails to build is left out and the rest are rebuilt without it. Its pages answer 404, its navigation
entries are hidden and the admin console's Plugins page shows the build error. The server keeps serving either way. When
you are developing, the server log has the full Vite error.

Plugin pages are not part of the web app's in-page router: links to and from a plugin page load a new page.
