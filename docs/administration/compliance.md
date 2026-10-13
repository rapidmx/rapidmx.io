---
sidebar_position: 11
title: Compliance
description: Transport rules, retention policy, legal hold, eDiscovery and data requests (export, import and erasure) in RapidMX.
---

# Compliance

Most organizations have rules about mail that go beyond spam: some content must never leave or arrive, mail has to be kept for a minimum time (or deleted after a maximum one), mail relevant to a lawsuit must not be deleted, and people have the right to a copy of their data or to have it erased. RapidMX covers these with five tools:

| Tool | What it does | Who uses it |
| --- | --- | --- |
| [Transport rules](#transport-rules) | Act on mail as it arrives: reject, quarantine, tag or copy it | Administrators |
| [Retention policy](#retention-policy) | Delete mail and audit-log entries after a set age | Administrators |
| [Legal hold](#legal-hold) | Stop selected mailboxes' data from being deleted | Escrow holders |
| [eDiscovery](#ediscovery) | Search and export the mailboxes in a matter | Escrow holders |
| [Data requests](#data-requests) | Export, import and erase a mailbox's data | Administrators, and people for their own mailbox |

Each of these keeps its own audit trail. None of them lets an administrator read mail in the admin console.

## Transport rules

A transport rule is an organization-wide condition-and-action rule applied to mail as it arrives. Use one to reject mail with certain attachment names, quarantine messages containing a phrase, tag mail with a header for another system, or send a copy of certain mail to a compliance mailbox.

Rules run once per message, when the mail server hands it to RapidMX for delivery, before it's split up into each recipient's copy. They run before spam and virus scanning and before people's own inbox rules, which only ever affect one mailbox.

### Create a rule

1. Open **Transport Rules** and choose **+ New transport rule**.
2. Give it a **Name**, for example `Flag external senders`.
3. Under **Conditions**, add the conditions to match (below).
4. Under **Actions**, choose an action from the list and choose **Add action**. Add as many as you need.
5. Under **Settings**, set **Enabled**, **Stop processing more rules once this one matches**, and the **Sequence (evaluation order, ascending)**.
6. Choose **Create transport rule**.

### Conditions

| Condition | Matches when |
| --- | --- |
| **From contains** | The sender's address contains any of the values |
| **Subject contains** | The subject contains any of the values |
| **Body contains** | The plain-text body (its first million characters) contains any of the values |
| **Any recipient contains** | Any recipient's address contains any of the values |
| **Any recipient is external** | Any recipient is outside this server's domains |
| **Has an attachment** | The message has an attachment |
| **Attachment filename contains** | Any attachment's file name contains any of the values |

Text matching ignores case and matches part of a value (`example.com` matches `sales@example.com`). Within one condition, any value can match; when you use several conditions, all of them must match.

### Actions

| Action | What it does |
| --- | --- |
| **Reject the message** | No recipient receives it, and the sender is sent a rejection notice when their address can be verified |
| **Quarantine every recipient's copy** | Every copy goes to [quarantine](quarantine-and-audit-log.md#quarantine) instead of being delivered. It's still scanned, so the reviewer sees its scan result. |
| **Add a header** | Adds a header (**Header name** and **Header value**, for example `X-Compliance-Flag: reviewed`) to every copy. Existing headers can't be changed or removed. |
| **Deliver an additional copy to** | Also delivers the message to an address, such as `compliance@example.com`, like any other recipient |

A rule with no conditions that rejects or quarantines is refused, because it would catch every message. A rule with no conditions and other actions asks you to confirm with **Save anyway**.

Rules run in ascending **Sequence**. When a matching rule has **Stop processing more rules once this one matches** ticked, no later rule is evaluated for that message.

To change a rule, open it, edit it and choose **Save changes**. The console doesn't have a delete button yet; untick **Enabled** to switch a rule off. Creating, changing and deleting rules is recorded in the [audit log](quarantine-and-audit-log.md).

## Retention policy

The retention policy automatically and permanently deletes mail and audit-log entries older than an age you choose. By default nothing is deleted: RapidMX never deletes your mail on its own until you set this.

Open **Retention Policy**:

| Setting | What it does | Limits |
| --- | --- | --- |
| **Message retention (days)** | Deletes any message older than this, in any folder of any mailbox, including Deleted Items. Its attachments are deleted with it. Blank: no automatic deletion. | At least 30 days |
| **Audit log retention (days)** | Deletes [audit log](quarantine-and-audit-log.md) entries older than this. Blank: keep forever. | At least 2190 days (six years) |

Saving a value that starts deleting, or deletes sooner than before, asks you to confirm with **Save and delete older data**. Deleted data can't be recovered.

The deletion runs in the background once a day, and each run deletes a limited batch (500 by default, `mail:jobs:retention_enforcement:batch_size`). Turning retention on for a server with years of existing mail therefore works through the backlog over many days rather than all at once. See [Configuration](../operations/configuration.md).

Things to know:

- Mailboxes under an active [legal hold](#legal-hold) are skipped. Their messages are deleted on a later run, once the hold ends.
- The [escrow audit log](key-escrow.md#the-escrow-audit-log) is never deleted.
- Quarantined messages have their own fixed retention: they're deleted after 30 days, whether or not they were released.
- The sign-in server keeps its own audit log, with its own retention setting.

## Legal hold

A legal hold stops data from being permanently deleted from the mailboxes of the people involved in a case, so it's there when it's needed.

In RapidMX, a legal hold is an open **matter** in the escrow console. Every custodian mailbox named on an open matter is under hold until the matter is closed. Matters are created by [escrow holders](key-escrow.md#open-a-matter), not administrators, and every matter belongs to an escrow scope. So to use legal hold, set up an escrow scope and holders first, even if you never intend to recover encrypted mail with it.

While a mailbox is under hold:

- Permanently deleting a message within the matter's date range, or emptying a folder, is refused.
- The mailbox can't be deleted, and its data can't be erased.
- The retention policy skips it, and its quarantined messages are kept past the usual 30 days.

People can still move messages to Deleted Items; only permanent deletion is stopped. Each refused deletion is written to the audit log as `legal_hold.blocked_delete`, since an attempt to destroy held data is itself worth knowing about.

## eDiscovery

eDiscovery means finding and handing over the mail relevant to a case. In RapidMX it's done by escrow holders, on a matter's page in the escrow console:

- **Search this matter's custodians** runs a search across every custodian mailbox at once.
- **Export this matter** produces one file with the custodians' messages from the matter's date range, plus their contacts, calendar events, tasks and notes.

Both are covered in [Key escrow](key-escrow.md#search-and-export-a-matter). Every search, export and download is audited.

## Data requests

**Data Requests** lists every export, import and erasure request across every mailbox, newest first. People make the same requests for their own mailbox under **Settings → Privacy & Data** in the mail app (see [Import and export](../user-guide/import-export.md)); this page is where you handle them, or make them on someone's behalf.

Requests name a mailbox by its uid, which is the address the mailbox was created with (for example `jane@example.com`), as shown in its page address in the admin console.

### Export a mailbox

For a data-subject access request, or to keep a copy of a departing person's mailbox:

1. Under **Export requests**, enter the **Mailbox UID**.
2. Choose a **Format**:
   - **JSON**: everything the mailbox holds (mail, contacts, calendar, tasks, notes and more), one JSON record per line for each kind. This is the data-portability bundle.
   - **Mbox**: the mail only, in a standard format any mail program can import.
3. Choose **Create export**. It's prepared in the background; choose **Download** when it shows ready.

This is the one way an administrator can download another person's mail, so it needs a recently confirmed identity, and the request and every download by someone other than the mailbox's owner are recorded in the audit log.

### Import into a mailbox

Under **Import requests**, enter the **Mailbox UID**, choose a **Destination folder**, and choose **Upload Mbox or PST file**. Every message goes into that folder; a PST file's own folders aren't recreated. The request shows how many messages were imported and how many failed.

Importing puts mail into someone's mailbox, so you can only import into a mailbox you have access to: a shared mailbox you've been given access to, or a person's mailbox while [impersonating](mailboxes.md#impersonate-a-user) them.

### Erasure requests

When a person uses **Delete my account** in their settings, an erasure request appears here for review. Only the owner can ask for their own mailbox to be erased.

- **Approve**, then **Erase mailbox**, permanently erases the mailbox and everything in it: mail, contacts, calendars, tasks and notes. This can't be undone. The erasure runs in the background, and the request shows how many records were purged when it completes.
- **Deny** refuses it. Enter a **Reason**, for example an unresolved legal hold the person should be told about.

Erasure is refused while the mailbox is under legal hold.

Erasures of the data a deleted mailbox left behind, started from the **Mailboxes** page, also appear here, marked **Deleted mailbox data**. They're approved as soon as they're filed. See [Mailboxes](mailboxes.md#erase-what-a-deleted-mailbox-left).
