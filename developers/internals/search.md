---
title: Search
sidebar_position: 6
description: How RapidMX searches mail it can read on the server and mail only the user can read on the device, how sealed index segments feed a zero-access mailbox's local index, how attachment text is extracted, and how the results are merged.
---

# Search

Encryption makes search harder. The server can index ordinary mail, including the text of attachments, but it can't find
an encrypted message by its content. RapidMX therefore searches in tiers: the server searches what it can read, the
device keeps an encrypted index of what only the user can read, and the web client merges the two into one list of
results. Zero-access mail adds a twist: the server does hold the plaintext during delivery, so it builds a sealed index
entry at that moment and the device imports it, instead of having to decrypt every message. This page explains each tier
and where its code lives. The design is `specs/search.md` in `@rapidmx/restapi`.

The user's view is in [Search](/docs/user-guide/search).

## Tier 1: server search

### The provider

Search goes through a `SearchProvider` (`src/search/SearchProvider.ts` in `@rapidmx/restapi`): `index()`,
`bulkIndex()`, `remove()`, `search()` and `candidates()`. The document it indexes has the entity's subject, body,
attachment text, participants and addresses, its folder, flags, labels and date, and a `metadataOnly` flag.

The server registers the provider that matches its database:

| Backend | Provider | How |
| --- | --- | --- |
| MongoDB | `MongoTextSearchProvider` | A `mail_search_index` collection with a `$text` index over subject, body, attachment text and participants. |
| SQL | `PostgresFullTextSearchProvider` | A `mail_search_index` table with a weighted `tsvector` (subject, then body, attachment text, participants), queried with `websearch_to_tsquery` and ranked with `ts_rank`. |

`@rapidmx/restapi` also has an `OpenSearchProvider` (with `@opensearch-project/opensearch` as an optional peer
dependency, configured under `mail:search:opensearch:*`), but the server doesn't register it; using it means registering
it yourself. Ranking differs between providers: the MongoDB text index has no field weights.

### Indexing

`SearchIndexJob` (`mail:jobs:search_index:*`, every 15 seconds) indexes messages that aren't indexed yet, in batches,
with retries and backoff recorded on the message. Today only messages are indexed, although the provider interface
also has entity types for contacts, events, notes and tasks. Deleting or erasing a message removes it from the index.

An encrypted message is indexed **metadata only**: participants, date, folder and flags, but no body and no attachment
text, and with header protection the subject is the placeholder `[...]`. Its result carries `metadataOnly: true`.

A zero-access mailbox's mail is indexed the same way, including any message still readable in that mailbox, such as a
draft waiting in the Outbox. That metadata document replaces any readable one left from before the mailbox turned
zero-access, and is retried until it does.

### The route

`GET /api/mail/search` (`BaseSearchRoute`) takes `q` (free text) and filters (`from`, `to`, `cc`, `subject`,
`hasAttachment`, `before`, `after`, `in` for a folder, `is` for read/unread/flagged/answered/forwarded, `label`, `types`),
plus `mailboxUid`, `limit` (25 by default, at most 100) and an opaque `cursor`. A request needs `q` or at least one
filter. Searching another mailbox requires READ access to it; otherwise the mailbox is treated as not found.

The web client parses the search box (`lib/search/queryGrammar.ts`) into those parameters. It understands `from:`,
`to:`, `cc:`, `subject:`, `has:attachment`, `before:`, `after:`, `in:`, `is:`, `label:` and `type:`; quotes, `OR` and
`-term` in the free text are passed to the provider.

`GET /api/mail/search/candidates` answers ids only, ranked on metadata, for Tier 3 below.

## Attachment text

`AttachmentExtractionJob` (`mail:jobs:attachment_extraction:*`) extracts the text of attachments into the blob store,
and the next indexing pass includes it in the message's document. Extractors live in `src/search/extraction/`:

| Formats | Extractor |
| --- | --- |
| Plain text, CSV, Markdown | `PlainTextExtractor` |
| HTML | `HtmlTextExtractor` (`html-to-text`) |
| PDF | `PdfTextExtractor` (`pdf-parse`, an optional peer dependency) |
| Word (`.docx`) | `DocxTextExtractor` (`mammoth`, an optional peer dependency) |

Spreadsheets and presentations are out of scope. Attachments of encrypted messages are skipped. For zero-access mail,
attachment text goes into the sealed index entry during delivery, within `mail:zero_access:extraction_budget_ms` and
`extraction_max_bytes`. A sealed draft's attachments are put off (`mail:jobs:attachment_extraction:zero_access_defer_seconds`),
and sealing drops their extracted text.

Attachments are untrusted input, so extraction is fenced in: it runs in a worker thread with its own memory limits
(`mail:search:extraction:isolation`, `worker`), and `mail:search:extraction:*` caps the input size (25 MB), the time
(30 seconds), the output (2 million characters) and, for `.docx`, the decompressed size, to stop zip bombs. When you add
an extractor, keep it behind the same limits.

## Tier 2: the browser's encrypted index

The browser can read the encrypted mail the user has unlocked, so it builds a search index of its own for that mail,
in `apps/shared/search/` in the web client.

- **What it indexes.** Encrypted messages only (the ones whose subject is the `[...]` placeholder), newest first,
  starting with the Inbox and Sent Items, within the last 12 months and a size budget the user can set (500 MB by
  default on the web). In a zero-access mailbox it also imports the server's sealed index (next section).
- **Storage.** SQLite compiled to WebAssembly (`wa-sqlite`, its asynchronous build) in a Web Worker, on the Origin Private
  File System (OPFS), one database per mailbox. Full-text search uses FTS5 with BM25 ranking, weighted like the server's
  (subject highest).
- **Encryption.** A virtual file system layer (`localIndexVFS.ts`) encrypts every 4 KB database page with AES-256-GCM
  under a key derived (HKDF) from the mailbox's master key, the same key that opens the [key vault](encryption.md#the-key-vault).
  The key exists only in memory after the user unlocks. A page that fails authentication discards the index, which is
  rebuilt.
- **Lifecycle.** The build starts when the mailbox is unlocked and is incremental, skipping messages already indexed
  unchanged. Locking, the idle timeout and signing out destroy the index; sign-out deletes every index in every open tab.
  Indexes for mailboxes the user lost access to are removed. Only one tab holds a mailbox's index at a time.

## Sealed index segments

A zero-access mailbox can't be searched by content on the server, and decrypting a whole mailbox on every device would be
far too slow. So the server writes one sealed **index entry** per message during delivery, holding the subject, body text,
attachment text and envelope fields, encrypted to the mailbox's zero-access key. Those entries are opaque to the server
afterwards. The trust this adds must be stated rather than assumed: the server is trusted to index honestly, and a client
can't verify a segment short of decrypting everything. A deployment that can't accept that turns zero-access off.

`BaseZeroAccessIndexRoute`, at `/api/mail/mailboxes/:id/search-index`, serves a manifest, the pending entries (the "live
tail") and per-week segments. It also takes compacted segments back from clients, with a generation check. A segment is a
sealed, gzipped JSON bundle.

- **Sync.** The client imports segments and the live tail a page at a time, and resumes where an interrupted pass stopped
  (`zeroAccessIndexSync.ts`).
- **Compaction.** Clients fold closed weeks into segments, staggered by platform using the manifest's `compactableAt` and
  `pendingBytes`: a desktop at once, a browser after 6 hours, a phone after a day, and a phone declines large weeks and
  cellular connections. A week this device can't fold is skipped so it doesn't take every compaction slot.
- **End-to-end mail.** Only a client can read it, so the client that decrypts it uploads the text as client segments
  (`origin: "client"`) sealed to the zero-access key. It is decrypted once per mailbox, not once per device.

Outlook and ActiveSync clients hold no segment cache, so **encrypted content isn't searchable from them**. Envelope search
still works.

## Tier 3: decrypt to check

For encrypted mail older than what the local index covers, the web client asks the server for candidate ids
(`/api/mail/search/candidates`, up to 200), downloads them, decrypts them in the browser and checks them against the
query (`lib/search/searchTier3.ts`). It is slow, which is why it only covers the period the local index doesn't.

## Merging

The web client runs Tier 1 and Tier 2 in parallel (Tier 2 with a 5-second time limit, and it never fails the search),
then Tier 3 where needed, normalizes each tier's scores and merges them (`crossMailboxSearch.ts`). When the same message
appears in several tiers, the local result wins over a decrypted candidate, which wins over the server's metadata-only
hit. Metadata-only server hits that nothing has confirmed yet show as placeholder rows.

## The native app

:::note Preview
The native app (`tauri-client`) is unreleased and its local search index is incomplete.
:::

The native app replaces the browser's Tier 2 storage with a native index through the same transport interface the web
client uses (`setLocalIndexTransport`). It uses SQLite in Rust (`rusqlite`), one database per account, kept in memory and
written to disk after every change as a single file encrypted with libsodium's XChaCha20-Poly1305 under a key derived
from the account. Several transport operations the web client's index builder relies on aren't implemented yet, so
building the index doesn't work end to end. The code is in `src-tauri/src/search/`.

## Where to look

| Topic | Code |
| --- | --- |
| Providers, indexing, route | `@rapidmx/restapi` `src/search/`, `src/jobs/SearchIndexJob.ts`, `src/routes/BaseSearchRoute.ts` |
| Attachment extraction | `@rapidmx/restapi` `src/search/extraction/`, `src/jobs/AttachmentExtractionJob.ts` |
| Query parsing, Tier 3, merging | web-client `lib/search/`, `apps/shared/search/crossMailboxSearch.ts` |
| Browser index | web-client `apps/shared/search/` (`localIndexWorker.ts`, `localIndexVFS.ts`, `localIndexBuilder.ts`) |
| Sealed index | `@rapidmx/restapi` `src/zeroaccess/ZeroAccessIndexing.ts`, `ZeroAccessIndexStore.ts`; web-client `apps/shared/search/zeroAccessIndexSync.ts` |
| Native index | tauri-client `src-tauri/src/search/` |
