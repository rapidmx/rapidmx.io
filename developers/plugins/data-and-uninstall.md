---
title: Data and uninstalling
sidebar_position: 6
description: What happens to a plugin's data when it is uninstalled, how the server deletes it on request, and how a plugin cleans up what the server can't find with an onPurge hook.
---

# Data and uninstalling

Uninstalling a plugin on the admin console's Plugins page stops every server running it but **keeps what it stored**,
so adding it again brings everything back. An administrator can also ask for the data to go: the uninstall dialog has
an **Also delete all data this plugin stored** box, and confirming it (by typing the plugin's name and choosing
**Uninstall and delete data**) schedules a permanent deletion.

The server deletes most of a plugin's data by itself, because it knows which collections and tables the plugin's models
use. This page explains how that works, so you can design a plugin whose data can be removed completely, and how to
clean up what the server can't see with an `onPurge` hook.

## What the server deletes

The deletion runs as separate steps. Each is recorded with its result, is safe to repeat, and a failure in one doesn't
stop the others; a retry runs only the failed ones.

1. **The plugin's `onPurge` hook**, if it has one. It runs first, so it can still read the plugin's data.
2. **Every collection or table the plugin's model classes use**, on MongoDB and SQL. Each is emptied and dropped.
3. **Blobs.** The server's `BlobStore` can't list keys and has no per-plugin prefix, so the server deletes none. A plugin
   that stores blobs must delete them in its hook.
4. **The plugin's saved settings**, once everything before succeeded. The plugin's row itself stays, marked removed, so
   the default plugin list never adds it back.
5. **This server's leftovers**: the installed package and the cached page builds that contain the plugin's pages, also
   only once everything before succeeded.

Ownership is decided from what the plugin's entry point exported. When a server copy loads a plugin, it records the
model classes the plugin registered and the collection or table each one uses, and that record is what step 2 works
from. The record only grows, so collections an older version of the plugin used are still deleted. Two consequences:

- **The server never deletes what isn't the plugin's.** Any collection or table a core model uses, one another plugin
  owns, and anything in the `acl` datastore are refused, and that step fails instead. A plugin model that reuses a core
  model's name, or extends a core model, is caught by this rule. Give your models names of their own.
- **A plugin must have loaded at least once** on a server running a version with this feature before its data can be
  deleted, because until then nothing recorded what it owns. The request says so and changes nothing.

Data a plugin writes into core records is not its own and stays. The calendar events the booking plugin creates belong
to the calendar owners, and the mail ActiveSync sends lives in the users' mailboxes.

## When it runs

Never while any server copy still runs the plugin. The deletion is recorded as pending when the plugin is uninstalled
and runs once every server copy reports a plugin set without it, nothing lists it as loaded, no copy is mid-restart and
none is still starting up. A copy whose status can't be read counts as still running it. Then whichever copy notices
first claims the deletion in the database, so it runs exactly once even with many copies, and resumes after a restart if
the copy doing it dies.

Adding the plugin again before the deletion has started cancels it. Once it has started, adding it is refused until it
finishes.

The admin console lists an uninstalled plugin with where its data stands: "Uninstalled - data will be deleted after
servers restart", "Data deleted" with a date, or "Data deletion failed" with the reason and a **Retry** button.

## The `onPurge` hook

A plugin that keeps data the automatic steps can't find exports a hook from a `./purge` entry point. That means files or
blobs, data in an external service, or rows that aren't in its own models. Add it to `exports` next to the other entry
points:

```json
"./purge": {
    "import": "./dist/lib/purge.js",
    "types": "./dist/types/purge.d.ts"
}
```

and export an async `onPurge` function. The server calls it with this context:

```ts
export async function onPurge(ctx: {
    plugin: { name: string; version: string };
    // The collections and tables deleted after the hook
    models: { className: string; datastore: string; kind: "mongo" | "sql"; name: string }[];
    // The server's MongoConnection (use `.db`) or TypeORM DataSource for a datastore
    connection(datastore: string): unknown;
    // The server's BlobStore
    blobStore?: unknown;
    config: { get(key: string): unknown };
    logger: { info(m: string): void; warn(m: string): void; error(m: string): void };
    // Aborted when the hook runs out of time
    signal: AbortSignal;
}): Promise<void>;
```

The plugin is no longer running anywhere when the hook runs. So the server installs the version it recorded into a
scratch folder, checks it against the recorded integrity hash, imports `./purge` from there and deletes the folder
afterwards. Keep the purge module self-contained: it should depend on nothing but the context it is handed, and it
shouldn't import anything from the server. A plugin without `./purge` costs no install at all.

### Failing safely

If the hook throws, the failure is recorded and the automatic steps still run. That is the wrong outcome when the hook
couldn't delete something whose only record is in the rows about to be dropped. For that case, throw an error named
`AbortPurgeError`: then nothing else is deleted, the deletion is marked failed, and a retry runs the hook again with the
rows still in place. The server recognises the error by its `name` (or an `abortPurge: true` property), so the plugin
needs no import:

```ts
class AbortPurgeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AbortPurgeError";
    }
}
```

A hook may run more than once, after a timeout, a crash or a retry, so make it idempotent.

### Example: the booking plugin

`@rapidmx/booking-plugin` stores profile images in the `BlobStore` and records their keys in its profile rows. Those
keys exist nowhere else, so its hook reads them from the profile collection or table, deletes each blob, and throws
`AbortPurgeError` if any delete fails, before the server drops the rows:

```ts
export async function onPurge(ctx: PurgeContext): Promise<void> {
    const keys: string[] = [];
    for (const model of ctx.models.filter((candidate) => /^BookingProfile(Mongo|SQL)$/.test(candidate.className))) {
        keys.push(...(await readKeys(ctx.connection(model.datastore), model)));
    }
    if (keys.length > 0 && !ctx.blobStore) {
        throw new AbortPurgeError(`${keys.length} booking profile images are stored, but the server has no BlobStore to delete them from.`);
    }
    const failed: string[] = [];
    for (const key of keys) {
        try {
            await ctx.blobStore!.delete(key);
        } catch (err: any) {
            failed.push(`${key}: ${err.message}`);
        }
    }
    if (failed.length > 0) {
        throw new AbortPurgeError(`Could not delete ${failed.length} of ${keys.length} booking profile images.`);
    }
}
```

`readKeys()` uses `connection.db.collection(model.name)` on MongoDB and a plain `SELECT` through the TypeORM
`DataSource` on SQL, using `model.name` from the context rather than a hard-coded name.

## What the bundled plugins own

| Plugin | Owns | Hook |
| --- | --- | --- |
| `@rapidmx/booking-plugin` | `booking_type_*`, `booking_*`, `booking_profile_*`, and profile images under `booking-profiles/` in the `BlobStore` | Yes, deletes the images |
| `@rapidmx/activesync-plugin` | `device_sync_state_*`, `eas_collection_state_*`, `eas_collection_chunk_*` | No |
| `@rapidmx/crm-plugin` | Its CRM collections and tables, and uploaded import files under `crm-imports/` in the `BlobStore` | Yes, deletes the import files |
| `@rapidmx/mapi-plugin`, `@rapidmx/autodiscover-plugin` | Nothing (MAPI's connection state is short-lived cache that expires on its own) | No |

`*` is `mongo` or `sql`, depending on the backend.

## Data-subject erasure

Deleting a single user's data is a different path from uninstalling. When a model holds per-mailbox data, mark it
`@MailboxScopedData()` and set `mailboxScopedData` in the manifest, so an erasure request removes the plugin's rows for
that mailbox too. See [Routes, models and jobs](routes-and-models.md#data-that-belongs-to-a-mailbox).

## Configuration

These keys tune the deletion; all are optional, under `system:plugins:purge:`.

| Key | Default | Meaning |
| --- | --- | --- |
| `check_ms` | `30000` | How often unfinished deletions are looked at. |
| `initial_delay_ms` | `10000` | How long after startup the first look happens. |
| `grace_ms` | `180000` | How long after an enabled plugin is uninstalled to wait for server copies that were mid-start. |
| `lease_ms` | `120000` | How long a copy's claim on a deletion lasts before another copy may take over. |
| `hook_timeout_ms` | `60000` | How long the `onPurge` hook may run before its `signal` is aborted. |
