---
title: Security
description: How to report a vulnerability in RapidMX, and the security principles every contribution has to keep.
sidebar_position: 8
---

# Security

People trust RapidMX with their mail, their calendars and their encryption keys, often precisely because they don't
want a third party able to read them. That trust rests on a few rules that run through the whole codebase. This page
explains how to report a vulnerability, and then sets out those rules, because a contribution that breaks one of them
won't be merged, however useful it is otherwise.

## Reporting a vulnerability

**Don't report a vulnerability in a public issue, pull request or discussion.**

Report it privately to the maintainer through GitHub's private vulnerability reporting, on the repository the problem
is in:

1. Open the repository on GitHub, for example `https://github.com/rapidmx/restapi`.
2. Open the **Security** tab and choose **Report a vulnerability**.
3. Fill in the advisory form.

If you aren't sure which repository is affected, use [`rapidmx/server`](https://github.com/rapidmx/server). If the
**Report a vulnerability** button isn't there, open a public issue that asks for a private contact, and leave every
detail of the vulnerability out of it.

A useful report includes:

- the affected repository, package and version (or commit);
- what an attacker can do, and what they need first (an account, a mailbox, network access to an internal port);
- steps or a proof of concept that reproduces it against a test deployment;
- any fix or mitigation you have in mind.

Test only against deployments you own. Never access mail, accounts or data that aren't yours while investigating.

## Design principles every change must keep

### Administrators don't read users' mail

An administrator manages the *platform*: domains, policies, plugins, branding and mailbox settings. No role, an
administrator's included, gives access to the contents of another user's mailbox.

- Everything scoped to a mailbox (messages, folders, attachments, calendar, contacts, tasks, notes, key vault, search,
  push channels) is reachable only by its owner or by someone holding an explicit grant on it.
- RapidREST's ACL check treats a trusted role as a superuser, so mailbox-scoped code in `restapi` never calls it
  directly. It calls `hasMailAccess()`, which removes the caller's trusted roles first. A mailbox the caller can't
  see answers `404`, exactly like one that doesn't exist.
- The admin console works with administrative metadata only (addresses, owner, quota, resource settings), through
  `?scope=admin`, which needs a trusted role and an elevated token and is written to the audit log.
- The few workflows that cross mailboxes, such as a data-subject export, have their own authorization and are audited.

Every mailbox-scoped route must be listed in `restapi`'s access route table and covered by its access matrix tests,
and a guard test fails on any direct `hasPermission()` call in the routes. When you add a route, add it there. Don't
add an administrator shortcut "for support", a debug endpoint that returns message content, or a log line that
records message bodies.

### Scanning and verification fail closed

When RapidMX can't check something, it treats it as unsafe, not as clean.

- If ClamAV or rspamd can't be reached or gives an answer that isn't clearly clean, an inbound message is quarantined
  and an outbound send fails. It is never delivered unscanned. A mailbox import does the same.
- If `mail:security:trusted_authserv_id` isn't set, no sender's DKIM signature is treated as verified, so every
  feature that depends on a verified sender stays off.
- The `/internal/mta` ingest routes refuse every call when no ingest secret is configured.
- In production the server refuses to start while any required secret still has its placeholder value.

The only exceptions are the development conveniences of `yarn dev` (automatic sign-in, scanner bypass, local
delivery), and each of them checks for a development `NODE_ENV` first. Keep new conveniences behind the same checks,
and never make a production code path fall back to "allow" on an error.

### Escrow is separated from administration, with dual control

Key escrow lets an organization recover encrypted mail when it is legally required to. It is built so that no single
administrator can use it alone.

- Escrow authority belongs to the holders of an escrow scope. It is checked against the scope's own holder list, never
  through the trusted-role system, so being an administrator grants nothing.
- A scope can require M-of-N approvals before an access request is granted.
- The server never holds a scope's private key and never decrypts escrowed keys. A mailbox's master key is wrapped to
  the scope's public key in the browser, and unwrapping happens in the holder's own tooling.
- Escrow actions go into a hash-chained audit log keyed with `ESCROW_AUDIT_HMAC_KEY`, so tampering is evident.

Don't add a path that lets a trusted role act as an escrow holder or that skips the approval count.

### Encryption keys stay with their owners

End-to-end signing and encryption, with S/MIME or OpenPGP, happen in the browser. Each user's private keys sit in a key vault that is unlocked by
their encryption password, a recovery code or a passkey, and the wrapping happens on the client. The server stores
wrapped keys and public certificates; it signs certificate requests but doesn't see private keys. With OpenBao's PKI,
the certificate authority's own key never leaves the vault either. A change must not send an unwrapped private key or
a password-derived key to the server.

### Zero-access storage never keeps plaintext

For a mailbox using [zero-access encryption](./internals/encryption.md#zero-access-encryption), the server may see
plaintext inside a request but must not persist it. Any new path that files a mailbox's content, or anything derived from
it, goes through `ZeroAccessWriter` or `ZeroAccessRecordSealer`. Don't spool it to the blob store to process later, write
it to a log or an audit entry, put it in a push payload or event, or leave it in the search index.

Only the mailbox's owner can change their own zero-access settings. An administrator's one lever is the server-wide
switch, which is visible to every user. Describe the guarantee accurately too: zero-access protects data at rest and is
not end-to-end encryption, because the server sees the plaintext while delivering it.

### Configuration secrets are encrypted, and only one small component writes to Kubernetes

Secrets saved in the admin console are stored as envelopes bound to their record and field, so a database dump alone reveals
none of them. The key is the configuration keyring, mounted read-only by the server pods. A secret the server can't decrypt
is answered as `{ "secret": true, "unreadable": true }`, never decrypted for a request, and audit entries record which keys
changed, never a value.

The server creates no DNS objects in Kubernetes. dns-controller does, with a namespaced `Role`. It has no database, Redis or
keyring access, and nothing calls it. Don't give the server those rights to save a step, and don't add an inbound listener
to the controller.

### Untrusted content stays contained

Message HTML is sanitized once, when it is stored, by an allow-list sanitizer that rebuilds the document rather than
copying markup through. The reading pane then adds three more layers: DOMPurify, a strict Content Security Policy and
a sandboxed frame without scripts. None of the layers relies on another. Don't loosen one because another would catch
the problem.

### Least privilege everywhere

- The Helm chart grants the server a namespace-scoped `Role`, never a `ClusterRole`, on a ServiceAccount the chart
  owns. Installing RapidMX must not require cluster-wide rights.
- Development Compose files publish ports on `127.0.0.1` only.
- Workflows grant the least GitHub permissions they need. The server's CI workflow is read-only by default, and only
  its publish jobs add `packages: write`. Write new workflows the same way.
- Internal endpoints are not exposed publicly. The chart's Gateway answers `404` for `/internal`.
- HTTP Basic credentials (app passwords) are accepted only on the ActiveSync and MAPI paths, and they are checked by
  the auth-server, not the mail server.

### Prefer libsodium to OpenSSL

When native code needs a cryptography library, use libsodium, and avoid build paths that depend on OpenSSL. The native
app is the worked example: it encrypts its local search index with libsodium's XChaCha20-Poly1305 instead of using
SQLCipher, which would need OpenSSL, and it uses `rustls` for TLS.

## Related pages

- [Architecture](./architecture.md) shows where each of these boundaries sits.
- [Authentication](./internals/authentication.md) and [Encryption](./internals/encryption.md) cover the sign-in and
  key handling in depth.
