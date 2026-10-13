---
title: RapidMX app (in development)
description: The native RapidMX desktop and mobile app is in development, with no installers yet; here is what it will do and how to build it.
sidebar_position: 3
---

# RapidMX app (in development)

:::warning In development
The native RapidMX app is **not released**. There are no installers to download for Windows, macOS, Linux, Android or iOS, and no app-store listings. Until it ships, use the [web app](web.md) on a computer and [Exchange ActiveSync](phones-and-tablets.md) on phones and tablets.
:::

The RapidMX app is a native desktop and mobile app built with [Tauri](https://v2.tauri.app/). It is meant for people who would rather have mail, calendar, contacts and tasks in a window of their own than in a browser tab, and for people who use more than one RapidMX server, such as a consultant with an account at each client.

## What it is designed to do

- **Any RapidMX server, several accounts at once.** You add an account by typing your email address. The app finds the account's server from a `_rapidmx.<domain>` DNS TXT record and the server's `/.well-known/rapidmx/server-info` address, then keeps every account signed in so you can switch between them without signing in again.
- **Sign in through your browser.** Signing in opens your normal web browser at your organization's sign-in page, so passkeys, authenticator apps and every other sign-in method work as they do on the web.
- **Credentials in the operating system's keychain.** Each account's sign-in token is kept in the system keychain (Keychain on macOS and iOS, Credential Manager on Windows, Secret Service on Linux, Keystore on Android), never in a plain file.
- **The same screens as the web app.** The app reuses the web app's Mail, Calendar, Contacts and Tasks pages.
- **A local, encrypted search index** per account, like the [web app's](../user-guide/search.md).

## Where it stands

The sign-in flow, server discovery, account storage, keychain storage and the native search index are written and pass their automated tests. Still missing before it can be used day to day:

- the account switcher and the real Mail, Calendar, Contacts and Tasks screens (the current app is a placeholder that can only add and remove accounts);
- showing message bodies, contact cards, pictures in quoted mail and attachment downloads, which the web app still loads in a way that only works in a browser;
- refreshing a session before it expires, and signing an account out on the server when you remove it;
- mobile builds, installers, code signing and automatic updates.

## Build it yourself

Only try this if you are helping develop the app. You need Node.js with Corepack, and a Rust toolchain with the Tauri CLI.

```bash
git clone https://github.com/rapidmx/tauri-client
cd tauri-client
corepack enable
yarn install
yarn dev
```

`yarn dev` starts the app with `tauri dev`. `yarn build` only builds the web part of the app and does not produce an installer.

## What a server needs before the app can sign in

When the app is released, every server it signs in to needs these, which an administrator sets up:

1. **An OAuth client for the app** on the auth-server: a public client with the uid `7f3c2b9e-5a1d-4c8e-9b6f-0d2a1e4c7b53`, PKCE required, the redirect address `rapidmx://auth/callback`, the `authorization_code` and `refresh_token` grants, and the scope `openid profile email offline_access`. Marking it first-party skips the consent screen.
2. **CORS for the app's window.** Add `tauri://localhost` and `https://tauri.localhost` to the server's `cors.origins` setting, or the server refuses the app's requests and its live updates.
3. **The discovery address.** `/.well-known/rapidmx/server-info` tells the app where the auth-server is. Servers from 1.0.0-beta.42 on serve it.

For developers, the repository's README and `.claude/NOTES.md` list exactly what is built and what is still stubbed.
