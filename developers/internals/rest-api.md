---
title: REST API
sidebar_position: 1
description: How the RapidMX server's HTTP API is put together - where the routes come from, how callers authenticate, how permissions work, and how clients get live updates.
---

# REST API

Every RapidMX client goes through the same HTTP API: the web app, the admin and escrow consoles, the native app, and
the protocol plugins that translate ActiveSync and MAPI into calls on the same data. Most of that API is defined in
the `@rapidmx/restapi` library; the server repository mounts it, adds a handful of routes of its own and serves the
plugins' routes alongside. If you are fixing a bug in a route, adding an endpoint or building a client, this page tells
you where the code lives and which rules every route follows.

The API is built on RapidREST, so the request pipeline, decorators, CRUD routes and query syntax are the framework's.
See [Routing](https://rapidrest.dev/docs/routing) and
[Querying](https://rapidrest.dev/docs/routing/auto-crud-routes/querying) on rapidrest.dev for those.

## Where the routes come from

`@rapidmx/restapi` defines each resource three times:

- an abstract `Base*Route` in `src/routes/` with the logic, independent of the database;
- a `*RouteMongo` and a `*RouteSQL` subclass in `src/routes/mongo/` and `src/routes/sql/` that bind the backend's model
  classes (`@Model(MailboxMongo)`);
- the models themselves, `src/models/mongo/*Mongo.ts` and `src/models/sql/*SQL.ts`, behind shared interfaces in
  `src/models/types.ts`.

The library's concrete routes carry no paths. The server gives them one, in `src/mongo/routes/` and `src/sql/routes/`:

```ts
@ApiRoute("mail/mailboxes")
export class MailboxRoute extends MailboxRouteMongo {}
```

So when you add a route to `@rapidmx/restapi`, you also add the two one-line subclasses to the server. The server picks
the Mongo or SQL set at startup from its entry point (`server.mongo.ts` or `server.sql.ts`); both sets must stay in step.

`@ApiRoute(path)` serves a route under `/api/<path>`. `@Route(path)` serves it at exactly `path`. No route passes an API
version, so there is no `/api/v1`.

## Resource groups

| Prefix | What is there |
| --- | --- |
| `/api/mail/` | The mail data: `mailboxes` (also key vault, key lookup, escrow info and `search-index`, under `/:id/`), `folders`, `messages`, `attachments`, `labels`, `mail-filter-rules`, `mail-signatures`, `search`, `compose`, `focused-inbox-overrides`, `preferences/appearance`, `directory` |
| `/api/mail/` (PIM) | `calendar-events`, `calendar-share-links`, `contacts`, `contact-lists`, `notes`, `tasks`, `task-lists` |
| `/api/mail/` (administration) | `domains`, `distribution-lists`, `transport-rules`, `quarantine`, `ingest-queue`, `audit-log`, `data-export-requests`, `erasure-requests`, `mailbox-import-requests` |
| `/api/system/` | Deployment-wide settings: `branding`, `encryption-policy`, `mailbox-policy`, `retention-policy`, `plugins`, `setup`, `signing-enrollment`, `dns-providers`, `integrations`, `config-keys` |
| `/api/escrow/` | Key escrow and eDiscovery: `scopes`, `access-requests`, `audit-log`, `matters`, `matter-search`, `matter-export-requests` |
| `/api/admin/` | `diagnostics`, `signing-enrollments`, and the framework's admin routes |
| `/api/` | Framework routes: `acls`, `openapi`, `status` (readiness), `metrics` (needs a trusted role) |
| No `/api` prefix | `/push` (WebSocket), `/.well-known/rapidmx/keys`, `/.well-known/rapidmx/server-info` and `/.well-known/openpgpkey` (public), `/internal/mta` (the mail transport's ingest, see [Mail flow](mail-flow.md)), `/internal/dns` (for dns-controller only), the pages (`/`, `/settings`, `/admin`, `/escrow`), static assets |

Plugins add their own routes, by convention under `/api/mail/<plugin>`; the protocol plugins add
`/Microsoft-Server-ActiveSync`, `/mapi/emsmdb`, `/mapi/nspi` and `/autodiscover` (see [Protocols](protocols.md)).

### The OpenAPI document

The server describes its whole API, plugins included, as OpenAPI at `/api/openapi` (an HTML viewer), `/api/openapi/json`
and `/api/openapi/yaml`. It requires a signed-in caller, because the document lists the admin, escrow and plugin routes.
The descriptions come from the `@Description` decorators on models and routes, so keep those accurate when you change
one.

## Authentication

The server never signs anyone in. Users sign in on the separate [auth-server](authentication.md), which issues a JWT;
the server only verifies it. A request carries the token in one of two ways:

- **the `jwt` cookie**, set by the auth-server for the deployment's domain, which is what the browser apps use;
- **an `Authorization: Bearer` header**, which is what the native app and scripts use.

Tokens in the query string are turned off (`auth:allowQueryParam: false`). The token must be signed with the secret the
auth-server uses (`auth:secret`) and carry the configured audience and issuer (`auth:options:audience`,
`auth:options:issuer`). When the server and the auth-server disagree on any of these, every signed-in request fails,
which is the first thing to check when a fresh deployment answers 403 to everything.

**HTTP Basic is accepted on two paths only**, `/mapi` and `/Microsoft-Server-ActiveSync` and everything beneath them,
because Outlook and ActiveSync clients can't do anything else. There the server exchanges the username and app password
for a token at the auth-server. Nothing else accepts Basic. See [Authentication](authentication.md#app-passwords).

For cookie-authenticated writes, the framework enforces a double-submit CSRF check: the browser echoes the `csrf`
cookie in an `x-csrf-token` header. The web client's `apiFetch()` does this for you.

When you run the server with `yarn dev`, every request is signed in as a development administrator with an elevated
session, so you can work without an auth-server. Permission bugs therefore don't show up under `yarn dev`; the route
tests are where they are caught.

## Permissions

RapidREST protects data with access control lists stored in the `acl` datastore: each model class declares a default
with `@Protect`, and each record gets its own ACL, which can inherit from a parent (a folder's from its mailbox's). See
[Access control lists](https://rapidrest.dev/docs/auth/rbac/access-control-lists).

RapidMX adds one rule the framework doesn't have: **administrators have no access to other people's mail**. In
RapidREST a trusted role (`admin`) passes every ACL check. In RapidMX:

- Mailbox-scoped data is checked with `hasMailAccess()` / `assertMailAccess()` from `@rapidmx/restapi`
  (`src/util/MailAccessUtils.ts`), which strip trusted roles before asking the ACL. Only the owner and the people the
  owner shared with get in, and a resource the caller can't see answers 404, not 403.
- An administrator who needs to see an account **impersonates** the user, an audited action, rather than reading
  their data directly.
- The admin console reads mailboxes with `?scope=admin`, which returns administrative details only (addresses,
  owners, quota, never mail or keys), requires a trusted role and an elevated session, and is written to the audit log.
- `/api/acls` doesn't let a trusted role read or change mailbox and folder ACLs either.

Trusted roles only appear in **elevated** tokens. Sensitive administration (plugins, signing certificates, data exports,
erasure, retention, transport rules, escrow scopes, `?scope=admin`) also requires the elevation to be recent: by default
no more than 900 seconds old (`mail:security:elevation_max_age_seconds`). A request that fails this answers 403 with code
`api-104`, which the admin console turns into a trip to the auth-server to confirm the sign-in. See
[Authentication](authentication.md#roles-and-elevated-sessions).

These rules are tested as a matrix. `@rapidmx/restapi`'s test suite has a table classifying every route class
(`test/routes/mailAccessRouteTable.ts`), and the build fails when a route class is missing from it or when code in
`src/routes` calls `aclUtils.hasPermission()` directly. The server has the same check for its own routes. When you add a
route, add it to the table.

The README of `@rapidmx/restapi` ("Who can see whose mail") has the full rules.

### Rate limits

Routes that answer anonymous callers, and expensive ones, carry `@RateLimit()`. The server's limiter is tiered:
anonymous callers get the top-level `rateLimit` settings, signed-in callers the far larger `rateLimit.authenticated`
ones, and IPv6 addresses are counted per /64. Client addresses come from `X-Forwarded-For` only through the proxies in
`trusted_proxies`.

## Requests and responses

The conventions are RapidREST's:

- CRUD routes answer `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `PUT /` (bulk), `PUT /:id/:property`, `DELETE /:id` and
  `DELETE /`. `HEAD /` returns a count in `Content-Length`.
- Lists take `limit` (default 100, at most 1000), a zero-based `page`, `sort` (`field`, `-field` or JSON), and other
  query parameters as field filters.
- Updates and deletes take the record's `version` for optimistic concurrency, and answer 409 when it is stale.
- Errors are JSON, `{ "code": "api-1xx", "status": 403, "message": "..." }`. Anything that isn't an `ApiError` becomes
  a generic 500 without internals or stack traces. The codes you will meet most are `api-100` (sign-in required),
  `api-102` (permission), `api-103` (trusted role required) and `api-104` (elevation required).

Mailbox-scoped routes add their own rules on top (server-minted uids, scoped list queries, quiet 404s for denied reads);
the doc comment on `BaseScopedChildRoute` in `@rapidmx/restapi` lists them.

### Zero-access records

A mailbox's contacts, calendar events and tasks may be protected by
[zero-access encryption](encryption.md#zero-access-encryption). Readable columns then hold placeholders, and a REST client
has to handle that:

- **Name the sealed fields you clear.** An empty value for a sealed field counts as a clear only when the body lists the
  field in `clearedFields: string[]`, which is never stored. Anything but a list of at most 100 strings is a 400. Otherwise
  the empty value, or a placeholder sent back unchanged, is ignored. `PUT /:id/:property` can't carry the list, so use a full
  `PUT` to clear a sealed field.
- **Reading a sealed message.** `GET /content` answers `409 zero_access`. Read `/raw` and decrypt on the client.
- **Filtering.** Filtering or sorting tasks by title or notes answers 400.

Besides a stale `version`, these answer 409:

- moving a protected contact, event or task to another mailbox (copy it instead);
- a content change to an event filed from a zero-access invitation sent without its opened title, or detaching an
  occurrence once the series' key is gone;
- changing the subject, sender, recipients, Message-ID or envelope recipients of a message already sent;
- giving an owner to an ownerless zero-access mailbox whose keys exist only as member and escrow wraps;
- `POST /mailbox-import-requests` for a mailbox whose mail is zero-access.

## Realtime updates

Clients keep one WebSocket to `/push` (the framework's push route, extended by `@rapidmx/restapi`'s `MailPushRoute`).
The flow:

1. Connect to `wss://mail.example.com/push`. The connection authenticates with the `jwt` cookie or an `Authorization`
   header, or by sending `{ "type": "LOGIN", "data": "<token>" }` as the first frame. An `Origin` that isn't in
   `cors:origins` is refused.
2. Subscribe with `{ "id": 1, "type": "SUBSCRIBE", "data": ["<mailbox uid>", "<folder uid>"] }`. The server answers
   `SUBSCRIBED` with the channels it granted. Channels are plain entity uids, and each is checked for READ access with
   trusted roles stripped. The user's own uid is always subscribed.
3. Receive `{ "type": "MESSAGE", "channel": "<uid>", "data": { "type": "...", "action": "create|update|delete", "data": { ... } } }`.

For example, a folder's counts change:

```json
{ "type": "FolderMongo", "action": "update", "data": { "uid": "<folder>", "mailboxUid": "<mailbox>", "unreadCount": 3, "totalCount": 27 } }
```

A mailbox subscription doesn't include its folders' events; subscribe to each folder you show. The server rechecks
access periodically (`mail:push:recheck_ms`, 60 seconds) and closes the socket when access is lost or the token expires.
Events published while a client is disconnected are not replayed, so a client must reload what it shows when it
reconnects. Between server copies, events travel over the `events` Redis datastore.

Routes publish with `NotificationUtils.sendMessage(uid, type, action, data)` from `@rapidrest/service-core`. The
`@rapidmx/restapi` README documents each event a route publishes; keep it up to date when you add one.

Server-side code that needs to react to mail (a plugin, say) uses a different mechanism, the mail event stream
(`message.delivered`, `message.sent`, `send.failed`). See
[Routes, models and jobs](../plugins/routes-and-models.md#reacting-to-mail).

## Schema

There are no migrations. The server creates and updates its collections, tables and columns from the models at startup
(`datastores.*.synchronize`, on by default). An added field is just a release; a changed column type may be dropped and
recreated on PostgreSQL, losing its data, so avoid changing a released column's type. The `@rapidmx/restapi` README's
"Upgrading" section records the schema changes that needed care.
