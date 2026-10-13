---
title: Authentication
sidebar_position: 3
description: How users sign in to RapidMX through the auth-server, what the server checks on each request, and how elevated sessions, app passwords, native-app sign-in and server discovery work.
---

# Authentication

RapidMX doesn't handle passwords. Signing in, second factors, passkeys, social sign-in and account management all live in
a separate service, the **auth-server** from the RapidREST project, and the mail server only verifies the tokens it
issues. Keeping the two apart means the mail server never sees a password (apart from app passwords it passes straight
through), and the same sign-in can serve other RapidREST services. If you work on anything that touches who the caller
is, this page explains the pieces and where they live.

The auth-server and the `@rapidrest/auth` library it is built on are documented on rapidrest.dev: see
[auth-server](https://rapidrest.dev/docs/auth/auth-server) and [Authentication](https://rapidrest.dev/docs/auth/rbac/authentication).

## The pieces

| Piece | Where | Role |
| --- | --- | --- |
| auth-server | `rapidrest/auth-server` | Sign-in pages (`/auth/signin`, `/auth/elevate`, `/account`), the auth API (`/api/auth/*`), and an OAuth 2 / OpenID Connect authorization server (`/oauth/*`). Served at `auth.<domain>` by the Helm chart. |
| `@rapidrest/auth` | `rapidrest/auth` | The strategies and routes the auth-server is made of. |
| RapidMX server | `rapidmx/server` | Verifies JWTs on every request; exchanges app passwords for tokens on the two Basic-auth paths. |
| web client | `rapidmx/web-client` | Redirects to the auth-server to sign in, refreshes the session, signs out. |

## Session tokens

When a user signs in, the auth-server sets two cookies:

- `jwt`, the **access token**, valid for one hour;
- `refresh`, the **refresh token**, valid for 14 days, exchanged for a new access token at `POST /api/auth/refresh`.

Both are HttpOnly and SameSite=Lax. The Helm chart sets their domain to `.<domain>`, so the cookie the auth-server sets
on `auth.example.com` also reaches the mail server on `mail.example.com`. The web client renews the access token
45 minutes into its life.

The access token is an HS256 JWT signed with a secret shared by both services (`auth:secret`; the chart stores it in a
Kubernetes Secret or OpenBao). The user, with their uid and roles, is in the token's `profile` claim. The server checks
the signature, the audience (`auth:options:audience`, the mail domain) and the issuer (`auth:options:issuer`, the
auth-server's host). If either service has a different secret, audience or issuer, every signed-in request fails.

Clients other than a browser send the same token as `Authorization: Bearer`. See [REST API](rest-api.md#authentication)
for how the server reads it.

### Signing out

The web client clears what it holds locally first (the unlocked encryption keys and the local search index, see
[Search](search.md)), then calls the auth-server's `POST /api/auth/logout`, which clears the cookies and invalidates the
refresh token. An access token already issued stays valid until it expires, at most an hour.

## Roles and elevated sessions

Roles come from the user's record on the auth-server. One of them, `admin`, is a **trusted role** (`trusted_roles`),
which RapidREST treats as a superuser.

Trusted roles only appear in **elevated** tokens. A normal sign-in produces a token with the trusted roles stripped
out; to act as an administrator, the user confirms their identity again on the auth-server's `/auth/elevate` page
(their second factor, or their password if they have none). That produces a token whose `elevated` field holds the
time of confirmation.

Elevation also goes stale. RapidMX's sensitive administrative routes (plugins, signing certificates, data export and
erasure, retention, transport rules, escrow, `?scope=admin` reads) require it to be no older than
`mail:security:elevation_max_age_seconds`, 900 seconds by default. A request with no or stale elevation answers 403 with
code `api-104`. The admin console catches that and sends the administrator to `/auth/elevate?return_to=...`, then back.

Even an elevated administrator can't read other users' mail. That rule is enforced in the data layer, see
[REST API](rest-api.md#permissions).

## App passwords

Outlook (MAPI over HTTP) and Exchange ActiveSync clients can only send a username and password with HTTP Basic, and
can't do a second factor. So a user creates an **app password** on the auth-server's account page, and enters it in
the client instead of their real password.

On the server, `src/lib/BasicAuthJWTStrategy.ts` wraps the normal JWT strategy on the paths in `mail:basic_auth:paths`
(by default `/mapi` and `/Microsoft-Server-ActiveSync`, and everything below them):

1. A request with a valid JWT is accepted as usual.
2. Otherwise a Basic header is sent to the auth-server's `GET /api/auth/password`, which checks the app password and
   answers with an ordinary, non-elevated access token. A username that is a mailbox address is resolved to that
   mailbox's owner first.
3. The token is verified like any other and cached (`mail:basic_auth:cache_ttl_ms`, five minutes, never beyond the
   token's expiry), keyed by a hash of the header.
4. Failed attempts are throttled per address and username pair, per address and per username, and answer 429 when a
   limit is reached. A 401 names the realm (`mail:basic_auth:realm`).

The server never checks a password itself, and no other path accepts Basic. The protocol plugins only see an
authenticated user; they don't know whether it came from Basic or a JWT.

## Native apps: OAuth with PKCE

:::note Preview
The native app (`tauri-client`) is unreleased. Its sign-in code hasn't been run against a real auth-server yet.
:::

A native app can't share the browser's cookies, so it uses the auth-server's OAuth 2 authorization server with PKCE:

1. The app opens the system browser at the auth-server's `/auth/authorize` sign-in page with a `client_id`, an S256
   `code_challenge`, a random `state` and the redirect URI `rapidmx://auth/callback`, a custom scheme the app handles.
2. After sign-in, the app exchanges the code at `POST /oauth/token` for an OAuth access token and a refresh token (it
   asks for `offline_access`). The refresh token goes in the operating system's keychain.
3. It exchanges the OAuth access token at `POST /oauth/session-token` for a normal session JWT.

The last step exists because OAuth access tokens are a different kind of token: RS256, with their own issuer and no
roles. The mail server's API only accepts session JWTs, so `/oauth/session-token` (an auth-server route) turns a valid
OAuth access token into one, with the user's roles but not elevated and without cookies.

The app is registered on the auth-server as a public, first-party OAuth client that requires PKCE. An administrator
creates that client by hand for now.

## Finding the server from an address

A native app that only knows an email address finds everything else in two steps:

1. **`_rapidmx.<domain>` DNS TXT record**, in the form `v=RMXv1; id=<id>; host=<host>;`. It names the RapidMX host that
   serves the domain. The same record is how RapidMX servers recognise each other's domains for encrypted mail (see
   [Encryption](encryption.md#public-key-discovery)).
2. **`GET https://<host>/.well-known/rapidmx/server-info`**, a public, rate-limited route on the mail server that answers
   `{ "authServerUrl": "https://auth.example.com" }` from `mail:auth_server_url`. The app then signs in there.

Nothing in the server or the installers creates the TXT record yet; the operator adds it to DNS.

## Development

Under `yarn dev` the server signs every request in as a development administrator with an elevated token, using its
own `auth` configuration, so no auth-server is needed (`mail:dev_auto_login:roles` sets the roles). Basic auth is off in
that mode. It only applies when the server runs from TypeScript sources with `NODE_ENV` of `dev`, `development` or
`test`, never in a build. To test sign-in itself, run the auth-server next to the mail server, see
[Development environment](../dev-environment.md).
