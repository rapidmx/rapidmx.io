---
sidebar_position: 9
title: Key escrow
description: Let a trusted group recover encrypted mail with M-of-N approval, under named matters, with a tamper-evident audit trail.
---

# Key escrow

End-to-end encrypted mail can only be read with its owner's keys. That protects it from everyone, including the server and its administrators, but it also means that if the owner loses their encryption password and recovery codes, or leaves and the organization is legally required to produce their mail, nobody can read it.

Key escrow is the answer for organizations that must be able to recover encrypted mail. It's optional. When you use it, a separate group of **holders** (typically legal or compliance staff, not IT) can recover a mailbox's encrypted mail, but only:

- under a named **matter** (an investigation or legal hold) listing which mailboxes and which dates are in scope;
- after enough holders approve (**M-of-N** dual control, for example 2 of 3);
- with every step written to a **tamper-evident audit log**.

If your organization doesn't need this, choose **Don't use escrow** in the setup wizard and skip this page. Mail encrypted without escrow can be recovered only by its owner.

## How it works

An **escrow scope** is a named key pair plus the list of people who hold it.

1. The scope's **public key** is stored on the server. Its **private key** is kept offline by the holders. The server never has it.
2. When a mailbox is assigned to the scope, the owner's mail app adds a copy of the mailbox's key, encrypted to the scope's public key. Only the owner's browser can do this, since only it can unlock their key vault.
3. To recover mail, holders open a matter, request access to a mailbox under it, and approve the request until the threshold is met.
4. The server then hands out that encrypted copy. It's still encrypted: the holders decrypt it with the scope's private key in their own offline tooling. The server can't decrypt anything at any point.

## Separation of duties

Escrow deliberately splits power between administrators and holders, so that no single person can recover mail alone:

- **Administrators configure scopes** (who the holders are, how many must approve, and the public key) and assign mailboxes to them. Configuring a scope doesn't make you a holder, and the escrow console gives administrators no way around holder approval.
- **You can't make yourself a holder** of a scope you're configuring. Another administrator has to add you.
- **A holder can't change their own scope's** holders, approval threshold or key.
- **While an approved request is still usable** under a scope, its holders and key can't be changed and its threshold can't be lowered.
- **Every change to a scope is audited**, with its security-relevant settings before and after.

Managing scopes needs a recently confirmed identity, like other sensitive actions.

## Create an escrow scope

### With keys generated in the browser (setup wizard)

The **Escrow** step of the setup wizard can generate the key pair for you. To reach it after setup, choose **Run setup again** on the **Mailboxes** page; your settings are kept.

1. Choose **Generate new escrow keys in this browser**.
2. Enter the **Escrow scope name**, choose how long the keys are valid under **Keys valid for** (1, 2, 5 or 10 years), and choose **Generate keys**.
3. Choose **Download private key**, read the warning, and choose **Download unencrypted key**. Also choose **Download certificate**.
4. Tick **I've saved the private key somewhere safe**.
5. Add the holders and the number of required approvals (see below), and choose **Create escrow scope**.

:::danger Handle the private key with care
The private key file is **not encrypted**. Anyone who has a copy can decrypt every mailbox in the scope on their own: the approval threshold doesn't apply to a copy of the key. Move it straight to offline storage, or a password manager your holders control, and delete it from the computer you downloaded it on.

It isn't stored anywhere else. If it's lost, no escrowed mail can ever be recovered.

Because you downloaded it, don't also make yourself one of its holders. Hand it over and delete your copy.
:::

### With a certificate you already have

If your holders already have a key pair (for example on a hardware security module), open **Escrow Scopes** and choose **+ New escrow scope**, or choose **Use a certificate I already have** in the wizard. Then fill in:

| Field | What to enter |
| --- | --- |
| **Name** | A name holders will recognize, for example `Legal` |
| **Description (optional)** | What the scope is for |
| **Public key (base64)** | The base64-encoded certificate |
| **Key type** | `x509` |
| **Fingerprint (hex SHA-256)** | The certificate's SHA-256 fingerprint. The page checks it against the certificate and offers **Use it** if they differ. Holders compare it out of band. |
| **Not before** / **Not after** | The certificate's validity dates |
| **Holder user uids** | Each holder, entered as an e-mail address, username or user id and confirmed with **Add**. At least one. |
| **Required holders (M-of-N dual control)** | How many holders must approve a request, between 1 and the number of holders. `1` means any single holder can act alone. |
| **Notify subject on access** | Records whether the mailbox owner should be told when their mail is accessed. RapidMX stores this setting but doesn't send such notifications yet. |

Choose **Create escrow scope**. Tell the holders the scope's uid (shown in its page address): they need it to open matters.

### Change or delete a scope

Open the scope under **Escrow Scopes**, change it, and choose **Save changes**. Changes to holders, approvals or the key are listed for you to confirm with **Confirm and save**.

**Delete scope** is refused while any matter refers to the scope or any mailbox is still assigned to it. Unassign each mailbox first.

## Assign mailboxes to a scope

On each mailbox's page in the admin console, under **Escrow scope**, choose the scope and **Save escrow scope**, then **Confirm and save**. Choose **No escrow** to take a mailbox out. Only administrators can assign a mailbox; its owner can't choose or remove their own scope.

## Recovering mail: the escrow console

Holders work in the escrow console at `https://mail.example.com/escrow`. It has two sections, **Matters** and **Audit Log**, and only shows matters under scopes the signed-in person holds. A person who holds no scope simply sees an empty list.

### Open a matter

1. Choose **+ New matter**.
2. Enter a **Name** (for example `Smith v. Acme`), an optional **Description**, the **Escrow scope uid**, the **Date range start** and **Date range end**, and each mailbox in scope under **Custodian mailbox uids** (a mailbox's uid is the address it was created with, such as `jane@example.com`).
3. Choose **Create matter**.

You must be a holder of the scope you name. An open matter also places its custodian mailboxes under **legal hold**: see [Legal hold](compliance.md#legal-hold).

### Request and approve access

1. On the matter's page, choose **+ New access request**, enter the **Mailbox uid** (one of the matter's custodians, assigned to the matter's scope), and choose **Create request**. Your request counts as the first approval.
2. Other holders open the matter and choose **Approve**, then **Approve request**. The request shows how many approvals it has, for example **1 of 2 approvals**.
3. Once enough holders have approved, any holder can choose **Get material**. It shows the still-encrypted key copies as JSON, to copy into your offline tooling.

Rules that keep this safe:

- **Deny** refuses a request for good. To ask again, make a new request.
- The number of approvals needed is fixed when the request is made, so changing the scope's threshold later doesn't loosen or tighten requests already in progress.
- Only approvals from people who are still holders count.
- An approved request can be used for **72 hours** from the moment the threshold was met (`mail:escrow:approval_ttl_hours`). After that, make a new request.

### Search and export a matter

A matter's page can also:

- **Search this matter's custodians**, with free text or the same filters as mail search (for example `from:alice@example.com`). See [Search](../user-guide/search.md).
- **Export this matter**: choose **+ New export** to collect the custodians' messages (limited to the matter's date range) plus their contacts, calendar events, tasks and notes into one NDJSON file, and **Download** it once it's ready.

Searching and exporting read mail that is already stored and don't release any keys, so they don't need dual control: any single holder of the scope can do them. Encrypted messages stay encrypted in an export. Every search, export and download is audited.

### Close the matter

When the matter is over, choose **Close matter**. After that, no new requests, exports, searches or key-material reads are allowed under it, and its legal hold ends. A matter can't be reopened.

## The escrow audit log

Every access request, approval, key-material read and matter export is written to the escrow audit log, which holders see under **Audit Log** in the escrow console (an administrator sees every entry; a holder sees entries for the scopes they hold). Denied requests and changes to scopes and matters go to the ordinary [audit log](quarantine-and-audit-log.md) instead.

The escrow audit log is **hash-chained**: each entry includes a keyed hash (HMAC) of the one before it, and the chain's latest position is stored separately. Editing, deleting, inserting or reordering any entry directly in the database breaks the chain. An administrator can choose **Verify chain integrity** to check it. A healthy chain shows **Chain verified — no tampering detected**; otherwise the page says where and how it broke.

Two things to know:

- The chain is keyed by the `ESCROW_AUDIT_HMAC_KEY` secret (`mail.escrow.auditHmacKey` in the Helm chart). **Never change it after the first start**, or the existing chain can no longer be verified. See [Secrets and OpenBao](../operations/secrets-and-openbao.md).
- The retention policy never purges this log. It's meant to be permanent.
