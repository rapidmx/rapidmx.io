---
title: Routes, models and jobs
sidebar_position: 3
description: How a plugin adds API routes, stores its own data on both MongoDB and SQL, keeps mailbox data private, and runs background work.
---

# Routes, models and jobs

The server-side half of a plugin is plain RapidREST code. Anything you can write in a RapidREST service you can export
from a plugin entry point, and the server treats it like its own: the class loader registers it, dependency injection
fills it in, and the server mounts routes, connects models and starts jobs. This page covers what is specific to
RapidMX on top of that: running on two database backends, respecting who may see whose mail, and the hooks the server
gives plugins.

For the framework itself, see [Defining routes](https://rapidrest.dev/docs/routing/controllers/defining-routes),
[CRUD routes](https://rapidrest.dev/docs/routing/auto-crud-routes/crud-route),
[Entities and columns](https://rapidrest.dev/docs/models-persistence/entities-columns) and
[Background jobs](https://rapidrest.dev/docs/background-jobs) on rapidrest.dev.

## The entry point rule

The server imports `./mongo` or `./sql` and registers every export. That has two consequences:

- **Export only concrete, ready classes.** An abstract `BackgroundService` exported from an entry point would be
  started; an abstract route would be mounted. Keep base classes, helpers and types in the package root (`src/index.ts`)
  or in modules the entry point imports but doesn't re-export.
- **Export each class once, from the entry point for its backend.** `@rapidmx/booking-plugin`'s `./mongo` exports
  `BookingTypeMongo`, `BookingMongo`, `BookingProfileMongo` and the three Mongo routes; its `./sql` exports the SQL
  twins.

A cheap test catches mistakes early. The published plugins have a `test/plugin.test.ts` that imports both entry points,
checks that every export is what it should be, and runs `parsePluginManifest()` from `@rapidmx/restapi` over the
package's own `package.json`:

```ts
import "reflect-metadata";
import fs from "fs";
import { parsePluginManifest } from "@rapidmx/restapi";
import * as MongoEntry from "../src/mongo.js";

it("./mongo exports only the mounted route", () => {
    const paths = Object.fromEntries(
        Object.entries(MongoEntry).map(([name, clazz]) => [name, Reflect.getMetadata("rrst:routePaths", (clazz as any).prototype)]),
    );
    expect(paths).toEqual({ AutodiscoverRouteMongo: ["/autodiscover"] });
});

it("declares a valid plugin manifest", () => {
    const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    expect(parsePluginManifest(pkg)).toEqual(expect.objectContaining({ displayName: "Autodiscover" }));
});
```

`parsePluginManifest()` is the same check the server runs, so a manifest that passes it is one the server accepts.

## Routes

### Paths

`@ApiRoute("mail/booking-types")` serves a route under `/api/mail/booking-types`. `@Route("/autodiscover")` serves it at
exactly that path, with no `/api` prefix; protocol plugins use it for paths that clients expect
(`/Microsoft-Server-ActiveSync`, `/mapi/emsmdb`, `/autodiscover`).

The server checks a plugin's page mounts against every registered route, but it does not check API routes against each
other. Choose a prefix of your own that no core route and no other plugin uses. The published plugins put theirs under
`/api/mail/`, named after the plugin (`/api/mail/booking-types`, `/api/mail/crm`, `/api/mail/video-meetings`).

### Authentication

Every request reaches a route with the caller's JWT already verified. Take the user with `@User` (usually imported as
`AuthUser`) and treat `undefined` as anonymous:

```ts
@Get()
public async get(@AuthUser user?: JWTUser): Promise<Settings> {
    if (!user) {
        throw new ApiError(ApiErrors.AUTH_PERMISSION_FAILURE, 403, ApiErrorMessages.AUTH_PERMISSION_FAILURE);
    }
    // ...
}
```

A route meant for anonymous callers (a public booking page's slots, a CRM signup form) simply doesn't require a user, and
should carry `@RateLimit()`. A route for administrators uses `@RequiresTrustedRole()`, and for anything sensitive also
`assertAdminScope(user, trustedRoles, maxAgeSeconds)` from `@rapidmx/restapi`, which additionally requires a recently
elevated sign-in. The plugin management routes themselves work that way. See [Authentication](../internals/authentication.md)
for what "elevated" means.

### Mailbox data and administrators

RapidMX has a rule that the framework doesn't: **an administrator has no access to other people's mail**. In RapidREST,
a trusted role (`admin`) passes every ACL check. In RapidMX, anything scoped to a mailbox must be checked as if the
caller had no trusted role at all, so an administrator sees only their own mailboxes and the ones shared with them.

So never call `aclUtils.hasPermission()` directly for mailbox-scoped data. Use one of these from `@rapidmx/restapi`:

- `hasMailAccess(aclUtils, trustedRoles, user, uid, action)` and `assertMailAccess(...)`, which check the caller's
  permission on a mailbox or folder uid with trusted roles stripped;
- `BaseScopedChildRoute<T>`, a CRUD route for records that belong to a mailbox. Set `scopeProperty` (usually
  `"mailboxUid"`) and it checks every read and write against that mailbox, refuses to let a list query widen the scope,
  mints uids on the server and answers reads that are denied as if nothing matched. The booking plugin's
  `BaseBookingTypeRoute` is built on it.

`resolveCallerMailboxUid(mailboxRepo, user)` finds the signed-in user's own mailbox, which is what the protocol plugins
use.

### Sending mail

A plugin that sends mail should go through the same path as the server, so the message is scanned, gets its headers and
is relayed by the configured transport. ActiveSync and MAPI use `scanAndRelay()` from `@rapidmx/restapi` for this. See
[Mail flow](../internals/mail-flow.md) for what happens after that.

### Writing to a zero-access mailbox

The server can't read a mailbox's data once [zero-access encryption](../internals/encryption.md#zero-access-encryption)
protects it, and it must not store plaintext for it. If your plugin writes a mailbox's contacts, calendar events, tasks or
messages, seal what you write, as the booking plugin does in `BaseBookingRoute`:

- **Records.** `newZeroAccessRecordSealer()` from `@rapidmx/restapi` gives you a sealer. Call
  `sealWrite("calendar", mailbox, fields)` before saving. It seals when that type is protected for the mailbox and leaves
  the fields readable otherwise.
- **Mail.** `newZeroAccessWriter()` gives you a writer whose `sealRaw()` files a message. It also seals drafts, with `sealDraft()`.
- **Invitations.** `MeetingSchedulingJob` never invites for a protected event, because all it could send is the placeholder.
  Compose them yourself with `MeetingInviteSender` and its `sendProtectedInvitations()`.
- **Reading.** Never treat a value you read from such a mailbox as real content. It may be a placeholder such as
  `Protected event`, and sending it back must not overwrite the sealed value.

### Live updates

`NotificationUtils.sendMessage(channelUid, type, action, data)` from `@rapidrest/service-core` publishes a message to
the clients subscribed to a channel over the `/push` WebSocket. Channels are entity uids (a mailbox, a folder, a user). See
[REST API](../internals/rest-api.md#realtime-updates) for how clients subscribe.

## Models

### Twin classes

Every stored type is a pair of classes, one per backend, implementing a shared interface. From the booking plugin:

```ts
// src/models/mongo/BookingTypeMongo.ts
@DataStore("mongo")
@Entity()
@MailboxScopedData()
@Index("bookingtype_mailbox_slug", ["mailboxUid", "slug"], { unique: true })
@Protect({ uid: "BookingType", records: [{ userOrRoleId: "anonymous", actions: [] }, { userOrRoleId: ".*", actions: [] }] }, false)
export class BookingTypeMongo extends BaseMongoEntity implements BookingType {
    @Column()
    public mailboxUid: string = "";
    // ...
}
```

```ts
// src/models/sql/BookingTypeSQL.ts
@DataStore("sql")
@Entity()
@MailboxScopedData()
@Index("bookingtype_mailbox_slug", ["mailboxUid", "slug"], { unique: true })
@Protect({ uid: "BookingType", records: [{ userOrRoleId: "anonymous", actions: [] }, { userOrRoleId: ".*", actions: [] }] }, false)
export class BookingTypeSQL extends BaseEntity implements BookingType {
    @Column()
    public mailboxUid: string = "";
    // ...
}
```

The `@DataStore` name is the server's datastore: `mongo` for the Mongo class, `sql` for the SQL one. The table or
collection is named after the class in snake case (`booking_type_mongo`, `booking_type_sql`), so **renaming a model
class orphans the data stored under the old name**. Pick names with your plugin's prefix, and don't reuse a name a core
model or another plugin uses: the server refuses to delete anything it doesn't own when a plugin's data is purged, and a
shared name makes that step fail.

The routes come in twins too. An abstract `BaseBookingTypeRoute<T>` in the package root holds the logic, and each
backend's concrete class only binds the model:

```ts
@ApiRoute("mail/booking-types")
@Model(BookingTypeMongo)
export class BookingTypeRouteMongo extends BaseBookingTypeRoute<BookingTypeMongo> {
    protected readonly repoUtilsClass: any = RepoUtils;
    protected folderClass: any = FolderMongo;
    protected bookingClass: any = BookingMongo;
}
```

Core models a plugin needs (`MailboxMongo`, `FolderMongo` and their SQL twins) come from `@rapidmx/restapi/mongo` and
`@rapidmx/restapi/sql`.

### Schema changes

RapidMX has no migrations. On startup the server creates and updates collections, tables and columns from the models
(`datastores.*.synchronize`). Adding a field or a model is therefore just a release, but on PostgreSQL a column whose
type changes may be dropped and recreated, losing its data. Treat a column's type as fixed once released, and add a new
column instead.

### Data that belongs to a mailbox

When a model holds a mailbox's data in a `mailboxUid` field, mark the class `@MailboxScopedData()` (from
`@rapidmx/restapi`) and set `"mailboxScopedData": true` in the manifest. The decorator lets a data-subject erasure delete
the plugin's rows along with the rest of the mailbox. The manifest flag tells the server the plugin holds such data, so
an erasure waits while the plugin is installed but not loaded, rather than leaving its rows behind.

## Background jobs

A job is a concrete `BackgroundService` subclass exported from the entry point. It returns a cron expression (with
seconds) from `schedule` and does its work in `run()`. The CRM plugin's task reminder job, trimmed:

```ts
export abstract class TaskReminderJob extends CrmJobBase {
    @Config("mail:crm:jobs:reminders:schedule", "15 * * * * *")
    protected scheduleExpr: string = "15 * * * * *";

    public get schedule(): string | undefined {
        return this.scheduleExpr;
    }

    public async run(): Promise<void> {
        // find due tasks and notify their assignees
    }
}

// src/jobs/mongo/TaskReminderJobMongo.ts, exported from ./mongo
export class TaskReminderJobMongo extends TaskReminderJob {
    protected classes: CrmModelClasses = MONGO_MODELS;
}
```

The abstract class stays out of the entry points; only `TaskReminderJobMongo` and `TaskReminderJobSQL` are exported. Put a
job's configuration keys under the plugin's own namespace (`mail:crm:jobs:*`), never under the server's
`mail:jobs:*` keys, which plugins may not set.

A deployment can run several server copies, and each one starts every job. Write jobs so that two copies running the same
pass at once is harmless: claim work with an optimistic update (the CRM job above updates each task with its `version`
and skips it when another copy got there first).

### Reacting to mail

To act on mail as it is delivered or sent, subclass `MailEventConsumer` from `@rapidmx/restapi`. It reads a Redis stream
the server appends to (`message.delivered`, `message.sent` and `send.failed` events) as one consumer group, so each event
is handled by one server copy. Set `consumerGroup`, optionally narrow `eventTypes`, and implement
`handle(event, id)`. Events are delivered at least once, so the handler must be idempotent. A group starts at the end of
the stream the first time it runs: events from before the plugin was installed are not replayed.

For a zero-access mailbox's mail, events carry envelope fields only. A `message.delivered` event is marked
`zeroAccess: true`, with no subject and no parsed delivery report, so a plugin can't process a bounce that lands in such a
mailbox.

## Working with other plugins

Two mechanisms, depending on how strongly you depend on the other plugin:

- **`requires`** in the manifest maps package names to npm version ranges (`{ "@rapidmx/meet-plugin": ">=0.5.0" }`). The
  server installs and enables the required plugins along with yours, loads them first, and won't let an administrator
  disable or uninstall them while yours is enabled.
- **`PluginRegistry.isActive(name)`** from `@rapidmx/restapi` tells you at run time whether another plugin is loaded in
  this process. Autodiscover uses it to advertise ActiveSync and MAPI only when those plugins are installed, without
  requiring either.
