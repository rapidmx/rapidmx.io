---
title: Encryption
sidebar_position: 4
description: How RapidMX does end-to-end S/MIME encryption in the browser - the key vault, public-key discovery, the certificate authorities, signing certificates over ACME, and key escrow.
---

# Encryption

RapidMX encrypts and signs mail end to end with S/MIME, and does it in the user's browser. The server stores the
private keys, but only in a form it can't open, and it never sees the content of an encrypted message. That design
shapes a lot of the code: the cryptography lives in the web client, the server's job is to store ciphertext, issue
certificates and help find other people's keys, and features such as search and key escrow need their own answers for
mail the server can't read.

The user-facing side is described in [Encryption](/docs/user-guide/encryption) and
[Encryption and certificates](/docs/administration/encryption-and-certificates); this page is about how it works. The
design specification is `specs/end-to-end_encryption.md` in the `@rapidmx/restapi` repository.

## In the browser

The cryptography is in the web client's `lib/crypto/`, using the browser's WebCrypto plus `pkijs` and `asn1js` for CMS,
`@peculiar/x509` for certificate requests and `hash-wasm` for Argon2id (the last two loaded only when needed).

- **Keys.** When a user first enrols, the browser generates two P-256 key pairs, one for signing and one for encryption,
  and a certificate request for each (`keys.ts`).
- **Messages.** `smime.ts` builds CMS: SHA-256 signatures (detached or opaque) and EnvelopedData with AES-256-GCM
  content encryption, always including the sender's own certificate so they can read their sent mail.
  `smimeMessage.ts` builds the MIME around it, with header protection per RFC 9788: an encrypted message's real
  subject travels inside, and the outer subject is `[...]`.
- **Unlocking.** The unlocked keys live only in memory for the session (`keySession.ts`), and are destroyed on sign-out,
  on lock and after the idle timeout.

## The key vault

The server keeps each mailbox's private keys in a **key vault**, sealed so only the user can open them
(`masterKey.ts`, `masterKeyWraps.ts`):

1. The browser generates a random 32-byte **master key** and encrypts the private keys with it (AES-256-GCM).
2. It then **wraps** the master key once for each way the user can unlock, binding each wrap to the mailbox and method:
   - **password**: a key derived with Argon2id from the user's encryption password;
   - **recovery codes**: eight codes, each a 160-bit random value, so any one of them unlocks;
   - **passkey**: a key derived from the WebAuthn PRF extension;
   - **escrow**: the master key encrypted to the mailbox's escrow scope certificate, when the organization uses key
     escrow (below).
3. The server stores the sealed keys, the wraps, salts and KDF parameters, never the master key or a private key in the
   clear.

The vault API is under `/api/mail/mailboxes/:id/keyvault` (`BaseKeyVaultRoute` in `@rapidmx/restapi`): read the vault,
enrol keys (the encryption certificate is issued in the same request), add and remove wraps, and **rekey**. Changes carry
the vault's `expectedMasterKeyGeneration` and fail with 409 when another device changed it first. Removing a wrap
doesn't revoke what it could unlock; only a rekey does.

The passkey method depends on browser and authenticator support for the PRF extension, which has not yet been verified
across real devices.

## Public-key discovery

To encrypt to someone, the sender's browser needs their certificate. It asks its own server:
`GET /api/mail/mailboxes/:id/keys/lookup?addr=` (`BaseKeyLookupRoute`). The lookup runs on the server because browsers
can't query DNS TXT records and would run into CORS.

- **A local recipient** is answered from the server's own records.
- **A recipient on another RapidMX server** is found through that domain's `_rapidmx.<domain>` TXT record, which names
  its host, and then the other server's public endpoint
  `GET /.well-known/rapidmx/keys/<hash>?domain=` (`BaseKeyDiscoveryRoute`). The hash is a z-base-32 SHA-256 of the
  lowercased local part, in the style of OpenPGP's Web Key Directory. The endpoint is unauthenticated, rate-limited, and
  takes the same time whether or not the address exists. DNS lookups can be DNSSEC-validated (`mail:dns:resolver:
  doh-dnssec`). Domains with this record count as **federated**.
- **Keys sent with mail.** A RapidMX server can announce a mailbox's encryption key in a `RapidMX-Key` header on
  outgoing mail, and the receiving server picks it up while scanning, but only when the sender's DKIM signature verified and covers that header.
- **By hand.** A user can trust the signer of a signed message ("Trust this signer"), which pins that certificate.

Discovered keys are pinned to the contact, trust on first use, with conflict detection and protection against being
downgraded to no encryption; a conflict waits for the user to accept or reject the new key. There is no LDAP and no
SMIMEA lookup.

## Encryption policy

The policy says, for each kind of recipient, whether encryption is `automatic`, `optional` or `prohibited`:
`encryptSameOrg`, `encryptFederated` (other RapidMX domains) and `encryptExternal`. It is one deployment-wide record at
`/api/system/encryption-policy`, readable by any signed-in user, writable by administrators, and audited. Every tier
defaults to `optional`. The compose window applies it in `lib/crypto/composeSecurity.ts`.

## Encryption certificates

Encryption certificates come from a certificate authority the server runs. The browser sends a certificate request; the
server signs it and returns the certificate. Two backends, chosen by `mail:pki:backend`
(`EncryptionCertificateAuthority` in `src/pki/`):

- **`local`** (the default): a self-signed P-256 CA whose key and certificate are files in `mail:pki:local_ca:dir`
  (`/var/lib/rapidmx/pki`, a persistent volume in the chart). Certificates are for email protection and key agreement.
  It publishes no CRL or OCSP; a revoked key is marked revoked in the server's own records, which is what discovery
  consults.
- **`openbao`**: an OpenBao PKI mount signs (`<mount>/sign/<role>`) and revokes (`<mount>/revoke`), so the CA key
  never leaves the vault and OpenBao provides revocation lists. Configured under `mail:pki:openbao:*`.

These certificates are for encryption between RapidMX users; they are not meant to be trusted by mail clients elsewhere.

## Signing certificates

A signature is only useful if the recipient's mail client trusts the certificate, so signing certificates should come
from a publicly trusted certificate authority. RapidMX gets them with **RFC 8823**, the ACME extension for S/MIME
certificates, where the CA proves control of an address by email.

`mail:pki:signing_enrollment:backend` selects how:

- **`rfc8823`**: the server runs the ACME exchange (`Rfc8823AcmeSigningCertificateEnrollment`) against
  `mail:pki:rfc8823:directory_url`. The CA mails a challenge to the mailbox; the server recognises it during inbound
  scanning, consumes it, and sends the DKIM-signed reply automatically. `AcmeEnrollmentDriverJob` advances each request
  on a schedule and installs the issued certificate into the mailbox's vault, unless the vault was rekeyed in the
  meantime. A request typically takes 10 to 30 minutes. It needs working inbound mail, DKIM signing and a correct
  trusted authserv-id (see [Mail flow](mail-flow.md#trusting-authentication-results)).
- **`manual`** (the application default): an administrator downloads the request's CSR from the admin console's
  Signing Certificates page, has any CA sign it, and uploads the result.

The Helm chart adds `auto`, which picks `rfc8823` for a real domain and `manual` for local test domains.
`GET /api/system/signing-enrollment` tells the client which backend is active and how it is doing, and
`/api/admin/signing-enrollments` lets administrators see and complete requests by hand. The server flags signing
certificates that are about to expire but doesn't renew them by itself.

The default directory is still CASTLE's public CA. The RapidMX project also runs an RFC 8823 CA of its own at
`acme.rapidmx.io`, which can issue signing and encryption certificates. **Its root is not in any operating system,
browser or mail client trust store**, so its certificates verify only where its root has been added by hand; it is not
a publicly trusted CA. Nothing points at it by default yet.

## Key escrow

Some organizations must be able to recover mail, for legal holds or investigations. Key escrow makes that possible
without giving any single administrator the power to read mail.

- **Escrow scopes** (`/api/escrow/scopes`) each have a certificate, a list of holders and a number `M` of holders who
  must approve an access. The server never has the scope's private key; the admin console can generate a key pair in
  the browser for the holders to keep. A mailbox assigned to a scope adds an escrow wrap of its master key, encrypted to the
  scope's certificate. An editor can't make themselves a holder, and holders can't change a scope's holders, `M` or key.
- **Matters** (`/api/escrow/matters`) name an investigation, its custodians and date range.
- **Access requests** (`/api/escrow/access-requests`) need `M` holder approvals, the requester's own included. Only then
  does `GET /:id/material` release the escrow wraps for the matter's mailboxes, and each read checks again that the
  matter is open, the approvers are still holders and the approval is younger than `mail:escrow:approval_ttl_hours`
  (72 by default). Opening the wraps takes the scope's private key, which only the holders have.
- **The escrow audit log** (`/api/escrow/audit-log`) is hash-chained: each entry includes the hash of the previous one,
  keyed with HMAC-SHA256 under `mail:escrow:audit_hmac_key`. `GET /verify` checks the chain. The key must be the same on
  every server copy and must never change, or older entries stop verifying; without it the chain is plain SHA-256 and the
  server warns at startup.

The escrow console at `/escrow` is separate from the admin console on purpose: holders don't have to be
administrators. See [Key escrow](/docs/administration/key-escrow) for the operator's view.

## Where to look

| Topic | Code |
| --- | --- |
| Browser cryptography | web-client `lib/crypto/` |
| Vault, lookup and discovery routes | `@rapidmx/restapi` `src/routes/BaseKeyVaultRoute.ts`, `BaseKeyLookupRoute.ts`, `BaseKeyDiscoveryRoute.ts` |
| Discovery and pinning | `@rapidmx/restapi` `src/util/LocalKeyDiscoveryUtils.ts`, `KeyringUtils.ts`, `FederationUtils.ts`, `RapidMxKeyHeaderUtils.ts` |
| Certificate authorities and ACME | `@rapidmx/restapi` `src/pki/` |
| Escrow | `@rapidmx/restapi` `src/routes/BaseEscrow*Route.ts`, `src/util/EscrowAuditUtils.ts` |
