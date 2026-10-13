---
sidebar_position: 12
title: Quarantine and audit log
description: Review a mailbox's quarantined and in-flight mail, and use the audit log to see who did what, and when.
---

# Quarantine and audit log

This page covers the three places you look when something about mail flow or administration needs explaining: a mailbox's **quarantine** (mail held back from delivery), its **ingest queue** (mail still on its way in), and the **audit log** (who did what in the admin console and the mail system, and when).

A typical case: someone says a message they were expecting never arrived. Check the mailbox's ingest queue to see whether it reached the server and whether delivery failed, then its quarantine to see whether it was held back, and the audit log if a rule or another person might be involved.

Looking at a mailbox's quarantine or ingest queue is itself recorded in the audit log (`mail_queue.admin_access`), like every other administrative look at a mailbox.

## Quarantine

A message is quarantined instead of delivered when:

| Reason | Why |
| --- | --- |
| `infected` | ClamAV found a virus, or couldn't scan it (see [Spam and virus protection](spam-and-virus.md)) |
| `transport_rule` | A [transport rule](compliance.md#transport-rules) with the **Quarantine every recipient's copy** action matched |
| `quota_exceeded` | Delivering it would have taken the mailbox over its quota |
| `spam_policy`, `other` | Held by a spam policy or for another reason |

A quarantined message never appears in any folder or on any device. Spam doesn't normally end up here: it goes to the person's Junk Email folder.

### Review a mailbox's quarantine

1. Open the mailbox under **Mailboxes** and choose **View quarantine**.
2. The list shows each held message's **Reason**, when it was **Quarantined**, and its **Status**: **Held** or **Released**.

You see the reason and the time, not the message itself; reviewing the content would mean reading someone's mail.

### Mark a message released

**Mark released** records that the entry has been dealt with, with you as the person who released it. **It doesn't deliver the message.** If it's infected or unwanted, leave it held.

Quarantined messages are deleted automatically after 30 days, released or not (`mail:jobs:quarantine_retention:retention_days`). A mailbox under [legal hold](compliance.md#legal-hold) keeps its quarantined messages until the hold ends.

## Ingest queue

When the mail server (Postfix or SES) accepts a message, it hands it to RapidMX, which stages it in the ingest queue, scans it and delivers it. The ingest queue shows that stage for one mailbox.

Open the mailbox and choose **View ingest queue**. Each entry shows **From**, **To**, when it was **Received**, its **Status** and any **Error**:

| Status | Meaning |
| --- | --- |
| `pending` | Waiting to be scanned |
| `scanning` | Being scanned now |
| `delivered` | Scanned and processed |
| `failed` | Processing failed. It's retried automatically, up to 5 attempts in all (`mail:jobs:scan_queue:max_attempts`). |

Entries that stay `pending` or `failed` usually point at a scanner or storage problem; see [Troubleshooting](../operations/troubleshooting.md). Delivered entries are cleared after 30 days, and entries that ran out of retries after 90.

## Audit log

The **Audit Log** records administrative and policy actions, and sensitive access to mailboxes, across the whole server. It's written by the server itself and can't be edited or deleted through the API, so it can be relied on to hold administrators to account too.

Each entry shows **When**, the **Actor** (the user who did it, or **System** for a background job), the **Action**, the **Target** (what kind of thing, and which), the **Mailbox** it concerns, and **Details**.

### Filter the log

Type into the boxes at the top to filter by **Mailbox uid**, **Actor user uid**, **Action** (for example `domain.create`) or **Target type** (for example `Domain`). The filters are kept in the page address, so you can bookmark or share a filtered view.

### What's recorded

| Area | Actions |
| --- | --- |
| Mailboxes | `mailbox.create`, `mailbox.admin-list`, `mailbox.admin-read`, `mailbox.admin-update`, `mailbox.admin-delete`, `mailbox.accessed` |
| Sharing | `mailbox_access.grant`, `mailbox_access.revoke`, `mailbox_access.admin-list` |
| Mail content | `message.content_accessed` (someone other than the owner, such as a delegate, read a message), `message.delete`, `message.truncate` (a folder was emptied), `message.recall`, `message.reported` |
| Quarantine and ingest queue | `mail_queue.admin_access` |
| Domains | `domain.create`, `domain.update`, `domain.delete`, `domain.verified` |
| Distribution lists and rules | `distribution_list.create`/`.update`/`.delete`, `transport_rule.create`/`.update`/`.delete`, `mail_filter_rule.create`/`.update` |
| Policies and setup | `encryption_policy.update`, `retention_policy.update`, `retention_policy.purge_executed`, `mailbox_policy.update`, `branding.update`, `setup.complete`, `setup.reopen` |
| Plugins | `plugin.install`, `plugin.update`, `plugin.remove`, `plugin.upload`, `plugin.purge_requested`, `plugin.purge_completed`, `plugin.purge_failed` |
| Encryption keys | `key_vault.enroll`, `key_vault.read`, `key_vault.rekey`, `key_vault.wrap_add`, `key_vault.wrap_remove`, `contact.key_trusted`, `contact.key_replaced`, `contact.key_conflict_rejected` |
| Signing certificates | `signing_enrollment.admin_list`, `signing_enrollment.admin_csr`, `signing_enrollment.admin_upload`, `signing_enrollment.admin_reject`, `signing_enrollment.ca_unreachable`, `key_vault.signing_cert_expiring` |
| Escrow and legal hold | `escrow_scope.create`/`.update`/`.delete`, `matter.create`/`.update`/`.close`/`.delete`, `matter.search`, `matter_export.downloaded`, `matter_export.failed`, `escrow_access_request.denied`, `legal_hold.blocked_delete` |
| Data requests | `data_export.requested`/`.ready`/`.failed`/`.downloaded`, `mailbox_import.requested`/`.completed`/`.failed`, `erasure_request.created`/`.approved`/`.denied`/`.completed` |

A person reading their own mail is deliberately not recorded: the log covers administration and access by someone other than the owner, not everyday use.

### What's recorded elsewhere

- **Escrow access** (requests, approvals, key-material reads and matter exports) goes to the separate, tamper-evident [escrow audit log](key-escrow.md#the-escrow-audit-log).
- **Sign-ins, identity confirmations and impersonation** are recorded by the sign-in server, in the **Audit Log** of its own admin console at `https://auth.example.com/admin`. See [Users and sign-in](users-and-sign-in.md).

### How long entries are kept

Forever, unless you set **Audit log retention (days)** in the [retention policy](compliance.md#retention-policy), which can't be less than six years.
