---
title: Exchange protocols
sidebar_position: 5
description: How the ActiveSync, MAPI over HTTP and Autodiscover plugins are built, which protocol versions and operations they support, where they keep state, and how they are tested.
---

# Exchange protocols

Phones, tablets and Outlook don't speak RapidMX's REST API. They speak Microsoft's Exchange protocols: **Exchange
ActiveSync** (EAS) on phones and tablets, **MAPI over HTTP** in Outlook for Windows, and **Autodiscover** to find the
server from an email address. RapidMX implements all three as plugins, each a translation layer from the protocol onto
the same mailboxes, folders and messages the web app uses. There is no IMAP or POP3.

This page is for contributors to those plugins: how each is structured, what it supports, where it keeps state and how
to test it. The plugin mechanics they share with every other plugin are in [Writing plugins](../plugins/overview.md).

| Plugin | Package | Paths |
| --- | --- | --- |
| ActiveSync | `@rapidmx/activesync-plugin` | `/Microsoft-Server-ActiveSync`, plus `/api/mail/devices` for administrators |
| MAPI over HTTP | `@rapidmx/mapi-plugin` | `/mapi/emsmdb`, `/mapi/nspi` |
| Autodiscover | `@rapidmx/autodiscover-plugin` | `/autodiscover` |

All three are default plugins, installed on a new deployment.

## What they share

- **Routes at the client's paths.** They use `@Route`, not `@ApiRoute`, because clients expect Exchange's paths.
- **Authentication by the server.** ActiveSync and MAPI routes only accept an authenticated user. The server's Basic
  wrapper on `/mapi` and `/Microsoft-Server-ActiveSync` turns a username and app password into a token before the
  plugin sees the request (see [Authentication](authentication.md#app-passwords)). Autodiscover is unauthenticated by
  design and rate-limited.
- **The core's helpers.** They resolve the caller's mailbox with `resolveCallerMailboxUid()`, check access to folders
  with `hasMailAccess()` (trusted roles never open another user's mail), and send through `scanAndRelay()`, so mail sent
  from a phone or Outlook is scanned and relayed exactly like mail from the web app (see [Mail flow](mail-flow.md#sending)).
- **Mongo and SQL twins.** Each has a backend-independent base route and per-backend concrete classes, like
  `@rapidmx/restapi`.

## ActiveSync

**Protocol versions** 14.0, 14.1, 16.0 and 16.1 (`MS_AS_PROTOCOL_VERSIONS`). Versions 12.x are not offered. The
version comes from the `MS-ASProtocolVersion` header; the base64-encoded query string form isn't supported.

**Structure.** `BaseEasRoute` has one `POST` handler that dispatches on the `Cmd` query parameter to a command handler
in `src/commands/`, and an unauthenticated `OPTIONS` handler that advertises the versions and the commands registered.
Requests and responses are WBXML, encoded and decoded by `src/codec/` with the MS-ASWBXML code pages.

**Commands:** Provision, FolderSync, Sync, Ping, GetItemEstimate, ItemOperations, MoveItems, SendMail, SmartReply,
SmartForward, MeetingResponse, Search, ResolveRecipients and Settings (including out-of-office). Folder creation,
deletion and renaming from the device are not implemented, and neither are Notes, DocumentLibrary, IRM or Find.

**Data classes.** `src/adapters/` maps mail, contacts, calendar and tasks to the RapidMX models, on a shared
`EasCollectionSyncAdapter`. Time zones and dates use the protocol's own encodings (`TimeZoneInfo.ts`,
`CompactDateTime.ts`).

**Device policy and remote wipe.** `Provision` enforces the policy in the plugin's `mail:eas:provision:*` settings. An
administrator wipes or unblocks a device through `/api/mail/devices/:uid/remote-wipe` and `/unblock` (a trusted role is
required); the wipe takes effect the next time the device connects, through the Provision exchange.

**State.** ActiveSync is stateful, and the plugin keeps that state in three models of its own:

| Model | Holds |
| --- | --- |
| `DeviceSyncState` | One row per mailbox and device: device type, policy key, folder sync keys, provisioning and wipe state. |
| `EasCollectionState` | One row per device and folder: the sync key, the cursor through the folder, what the device holds, and the previous round so a repeated sync key can be answered again. |
| `EasCollectionChunk` | Slices of the list of items a device holds, for large folders, to stay under MongoDB's document size limit. |

A cleanup job removes the state of devices that haven't synced for `mail:jobs:eas_device_cleanup:device_ttl_days` (90)
days. Concurrent syncs of the same collection are serialised by a lease, in process and in the cache Redis.

**Push.** `Ping` is a long poll. It subscribes to the folders' channels on the events Redis, the same messages the web
app's `/push` socket receives, and answers as soon as one of them changes, or at the end of the heartbeat. A newer Ping
from the same device replaces the older one. Without Redis it waits out the heartbeat.

**Real clients.** Apple Mail on iPad and the Gmail app on Android sync and receive push. Outlook Mobile does not yet add
an account.

## MAPI over HTTP

**Structure.** Two endpoints:

- `/mapi/emsmdb` (`BaseMapiEmsmdbRoute`) dispatches on the `X-RequestType` header: `Connect`, `Execute` and `Disconnect`
  are implemented; `NotificationWait` answers 501 (there is no push). `Execute` carries remote operations (ROPs), which
  `RopDispatcher` hands to the handlers in `src/rop/`.
- `/mapi/nspi` (`BaseMapiNspiRoute`, `src/nspi/`) is the address book: `Bind`, `Unbind` and `GetMatches` against the
  global address list. Other requests answer 501.

**Operations.** The ROP handlers cover logging on, opening folders and messages, hierarchy and contents tables
(`SetColumns`, `QueryRows`), properties, named properties, creating, saving, submitting and deleting messages, deleting
folders, streams, and fast transfer for downloading content. Recipients can't be modified with `RopModifyRecipients`,
and rules, permissions, search folders, public folders and delegates are not implemented. Contacts and tasks are
read-only. The binary encodings (property values, GUIDs, time zones, recurrence, global object ids) are in `src/codec/`.

**State.** MAPI sessions are short-lived and kept in the cache Redis, or in memory without it (`MapiSessionManager`):
15 minutes idle, 24 hours at most, 20 per user, 4 MB each. Writes are compare-and-set, and `Execute` calls on one
session are serialised with a lock. The plugin has no database models. Session cookies (`MapiContext`, `MapiSequence`,
`NspiContext`) follow Exchange's shape, and the framework's CSRF cookie is removed from these responses because Outlook
doesn't expect it.

**Status.** MAPI over HTTP is the least mature of the three. A full Outlook for Windows session has not yet been
confirmed against a live server: in testing, Outlook connected and bound but didn't proceed to `Execute`. The work so far
compared traffic captures against Exchange Online and the Gromox implementation. If you have Outlook and want to help,
this is where help is most useful.

## Autodiscover

Autodiscover answers two requests at `/autodiscover`:

- **`POST /autodiscover/autodiscover.xml`** (the classic "POX" protocol). By default it answers with the MobileSync
  (ActiveSync) schema; when the request's `AcceptableResponseSchema` asks for Outlook's, it answers with the
  `mapiHttp` endpoints. Bodies over 16 KB are refused.
- **`GET /autodiscover/autodiscover.json/v1.0/:email?Protocol=`** (Autodiscover v2), for `ActiveSync` and
  `AutodiscoverV1`.

The URLs it hands out are built from the plugin's `mail:autodiscover:public_url` setting, which must be an `https://`
URL; until it is set, nothing is advertised. Each protocol is advertised only while its plugin is loaded
(`PluginRegistry.isActive()`), so a deployment can run either protocol plugin alone.

Both requests are unauthenticated, so the route is careful not to become an oracle: it is rate-limited, accepts only a
plain address, and returns the caller's own address as the display name rather than the mailbox's. Redirects to other
servers are not implemented.

Clients find `/autodiscover` through DNS: an `autodiscover.<domain>` CNAME or an `_autodiscover._tcp.<domain>` SRV
record. The admin console's DNS checklist covers both, see [Automatic setup](/docs/clients/automatic-setup).

## Testing

Each repository tests at the HTTP level against both backends:

- **Vitest** with SWC for decorators. `@rapidmx/restapi` must be in `ssr.noExternal`, or the tests load a second copy of
  the framework and nothing registers.
- **MongoDB** through `mongodb-memory-server`, **SQL** through SQLite (`better-sqlite3`). The `rrst-test*` files the
  SQL suites create are throwaway databases.
- **A real server per backend.** `test/server-mongo/` and `test/server-sql/` are small server directories that mount
  the plugin's routes under test paths (`/mongo/eas`, `/sql/autodiscover` and so on) next to the core routes they need.
  `test/testDoubles.ts` registers stand-ins for the blob store, the mail transport and the scanners.
- **Protocol fixtures.** ActiveSync tests build WBXML requests with the plugin's own encoder. MAPI tests use a raw-socket
  HTTP client (`test/mapiTestClient.ts`), because ordinary HTTP test clients decode binary bodies as text, and a fake
  Redis for sessions.
- Coverage is held at 100% of statements and lines.

Unit tests can't tell you what a real client will accept. Before a protocol change is called done, try it with a real
device or Outlook against a test deployment, and capture the traffic (Fiddler, or the device's logs) when it misbehaves.
Microsoft's Remote Connectivity Analyzer needs a Microsoft 365 account and hasn't been used. See
[Testing](../workflow/testing.md) for running the suites.
