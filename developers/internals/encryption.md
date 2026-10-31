---
title: Encryption
sidebar_position: 4
description: How RapidMX does end-to-end encryption with S/MIME and OpenPGP in the browser, how zero-access encryption seals stored data, and how the key vault, key discovery, certificate authorities, signing certificates and key escrow work.
---

# Encryption

RapidMX protects content in two different ways, and most of this page depends on keeping them apart:

- **End-to-end encryption** happens in the sender's browser, with S/MIME or OpenPGP. The server never sees the content.
  It only works when the recipient has a key.
- **Zero-access encryption** covers everything else, such as the invoice from a sender who will never have a key. The
  server encrypts it on arrival to a key it can't open, and keeps no readable copy. The server does see the plaintext
  while it processes the message, so **zero-access is not end-to-end encryption and must never be described as such**.
  It protects stored data against storage and backup theft and administrators browsing it. It doesn't protect against
  a compromised server at the moment of delivery.

Both shape a lot of the code: the cryptography that opens anything lives in the web client, the server stores ciphertext,
issues certificates and helps find other people's keys, and features such as search and key escrow need their own
answers for data the server can't read.

The user-facing side is described in [Encryption](/docs/user-guide/encryption) and
[Encryption and certificates](/docs/administration/encryption-and-certificates); this page is about how it works. The
design specifications are `specs/end-to-end_encryption.md` and, for zero-access, `specs/search.md` §3 in the
`@rapidmx/restapi` repository.

## In the browser

The cryptography is in the web client's `lib/crypto/`, using the browser's WebCrypto plus `pkijs` and `asn1js` for CMS,
`@peculiar/x509` for certificate requests and `hash-wasm` for Argon2id (the last two loaded only when needed).

- **Keys.** When a user first enrols, the browser generates P-256 key pairs for signing and encryption, with a certificate
  request for each (`keys.ts`), plus a zero-access key (`zeroAccessKey.ts`). When the policy allows OpenPGP, it also makes
  an OpenPGP key on unlock (`openPgpKey.ts`). A mailbox that predates either gets the missing key on its next unlock.
- **Messages.** `smime.ts` builds CMS: SHA-256 signatures (detached or opaque) and EnvelopedData with AES-256-GCM
  content encryption, always including the sender's own certificate so they can read their sent mail.
  `smimeMessage.ts` builds the MIME around it, with header protection per RFC 9788: an encrypted message's real
  subject travels inside, and the outer subject is `[...]`. `pgpMessage.ts` does the same for PGP/MIME, on OpenPGP.js,
  which is loaded only when needed.
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

## OpenPGP

S/MIME is RapidMX's own format. OpenPGP exists so that users can exchange encrypted mail with Proton Mail, Thunderbird,
GnuPG and other OpenPGP software. The specification's *OpenPGP Interoperability* section has the full rules.

- **Keys.** The client generates a v4 key by default (an Ed25519 primary key with an X25519 encryption subkey), because
  every OpenPGP implementation reads v4. v6 keys are accepted everywhere too. There is no CA: the key is self-certified
  and enrolled through `POST /:id/keyvault/keys` with `type: "openpgp"`. The server checks it and issues nothing. The
  secret key is sealed under the master key and escrowed like the encryption key. One certificate both encrypts and
  signs, so it is one `PublicKey` (`type: "openpgp"`, `useType: "encrypt"`).
- **Pinning per slot.** Keys are pinned per use and format, so a contact's S/MIME and OpenPGP keys never replace each
  other. A pinned OpenPGP key is replaced automatically only when it expired or was revoked as superseded, and certified
  its successor before it was retired. Anything else is a key conflict for the user. A re-published copy with the same
  fingerprint is merged into the pin, keeping only what its primary key signed.
- **Publication.** The RapidMX discovery endpoint lists OpenPGP certificates next to the S/MIME ones. `BaseWkdRoute`
  serves the Web Key Directory at `/.well-known/openpgpkey` (direct and advanced methods), which is how Proton Mail finds
  a key. Outgoing mail carries an `Autocrypt` header next to `RapidMX-Key`, and the MTA must oversign both with DKIM.
- **Discovery.** An address outside RapidMX is looked up in its domain's Web Key Directory, under the discovery client's
  SSRF guards, and from DKIM-aligned `Autocrypt` headers on received mail. A key attached to a signed message is pinned
  only when the user confirms it. Public keyservers are not consulted, because that would reveal who users write to.
- **Choosing the format.** A recipient reachable in one format gets that format. For a recipient with both, key lookup
  returns `preferredFormat` from the first of these that says anything: the user's choice on the contact
  (`Contact.preferredFormat`), what the address advertises (`encryptPreference.preferFormat`), and what it was last seen
  using in authenticated mail (`Contact.observedFormat`). With none of them, the client uses S/MIME. A wrong preference
  can only pick another format the recipient has a key in, never plaintext.
- **Mixed recipients.** A message whose recipients need both formats goes out as one encrypted copy per format, and
  `Message.envelopeRecipients` limits each copy's relay to its own recipients. A plaintext copy is never made.
- **Reading.** PGP/MIME, inline and cleartext-signed mail are read; only PGP/MIME is sent. `Message.encrypted` means end
  to end encrypted in either format.

`EncryptionPolicy.allowOpenPgp` (`mail:encryption:openpgp_allowed`, on by default) turns all of this off. While it is
off, enrollment answers 403 and OpenPGP keys are left out of discovery and the Web Key Directory.

## Zero-access encryption

Asymmetric encryption is what makes this possible: the server can encrypt to a mailbox's public key without holding
anything that decrypts.

### The key

Each mailbox has a dedicated key pair (`useType: "zero-access"`), generated on the client and issued a certificate by the
internal CA so that CMS can address it. Its private key sits in the vault under the master key like the others. **It is
never published**: only this server encrypts to it, so it is left out of discovery and the `RapidMX-Key` header. Keeping
it separate means rotating it never touches end-to-end ciphertext, and a shared mailbox's members can hold it without
being able to read the owner's end-to-end mail. On rotation the old private key is retained, so nothing is re-encrypted.

### When it applies

Zero-access is active for a data type of a mailbox only when all of these hold (`ZeroAccessResolver`):

| Condition | Field | Default | Who changes it |
| --- | --- | --- | --- |
| The server allows it | `EncryptionPolicy.allowZeroAccess` (`mail:zero_access:allowed`) | On | Administrator |
| The mailbox enables it | `Mailbox.zeroAccessEnabled` | On | The owner only, never an administrator |
| The type is included | `Mailbox.zeroAccessTypes` | Depends on the owner's devices (below) | The owner only |
| A key exists | `Mailbox.zeroAccessKeys` | Provisioned on the next unlock in the web client | The client |

Otherwise data is stored readable, as before. Turning zero-access off never decrypts anything, because the server can't;
it only affects what is written afterwards. An undecided type is settled when zero-access is activated: a type that an
ActiveSync device or Outlook syncs (`Mailbox.syncClients`) defaults to off so the device keeps working, and mail stays on
once the owner has exported their keys (`zeroAccessKeysExportedAt`).

### Sealing

**The rule for every write: the server may see plaintext inside a request, but must not persist it for a zero-access
mailbox.** That covers inbound delivery, rule copies, quarantine, Sent Items, scheduled sends, drafts, imports, device
submissions and plugins.

- `ZeroAccessSealer` produces standard CMS `EnvelopedData` (ECDH P-256, AES-256-GCM). A message's full original MIME goes
  to a `za/<mailbox>/<uid>` blob, its subject and preview to `Message.zeroAccess.sealedSummary`, and its stored subject
  becomes `[...]`. The stored form is ordinary S/MIME, so a device with the exported keys can open it natively.
- `ZeroAccessWriter` files everything that isn't inbound delivery (`seal()`, `sealRaw()`, `sealDraft()`). Clients read
  `/raw` and decrypt; `GET /content` answers `409 zero_access`.
- Inbound mail for a zero-access recipient is processed inside the ingest request. See
  [Mail flow](mail-flow.md#zero-access-delivery).
- A send waits readable in the Outbox until it is relayed, the one standing exception. A scheduled message deleted from
  the Outbox stays readable for `mail:jobs:zero_access_backfill:deleted_scheduled_send_days` (30), then is sealed.
- `ZeroAccessBackfillJob` seals what a mailbox already holds once zero-access becomes active, newest first, every minute
  and up to 100 messages a run, and does the same for each other type when it is switched on.

### Calendar, contacts and tasks

`ZeroAccessRecordSealer` seals records field by field on every write, whoever writes them. Each protected field becomes
its own CMS value in the record's `sealedFields`, and the readable column holds a placeholder.

| Type | Sealed | Readable by the server, and why |
| --- | --- | --- |
| Mail | Body, subject, preview, attachments | Sender, recipients, dates, size, flags, folder: to deliver, thread, enforce quota and search by envelope |
| Calendar | Title, location, description | Times, recurrence, time zone, organizer and attendees, responses, busy status: for free/busy, invitations and reminders |
| Contacts | Names, company, job title, phones, postal addresses, notes, categories, email labels, photo | Email addresses: to deliver mail, find and pin keys, and for Focused Inbox and suggestions |
| Tasks | Title, notes | Due date, reminder, priority, completion, list |
| All types | | Folder, calendar and list names, and how many items there are, how large, and when they change |

Consequences you will meet in code:

- **Invitations are sent at save time.** The server can't read a protected event later, so the client sends the content in
  `invitationContent` (never stored), and `MeetingSchedulingJob` never invites for one. A save without it leaves the
  invitations pending.
- **Placeholders never overwrite.** A client or device that couldn't open a record echoes placeholders back, so an empty
  value only clears a sealed field when `clearedFields` names it. See
  [REST API](rest-api.md#zero-access-records).
- **Moves are refused.** A sealed record can't move to another mailbox (409). Copy it instead.
- **Keyed meetings.** A video meeting with external guests gets a temporary per-meeting key
  (`lib/crypto/meetingKeys`), sent in each guest's link after `#` and never stored. The design is
  `specs/meeting_privacy.md` in meet-plugin.

### Shared mailboxes and other clients

A shared mailbox's zero-access private key is wrapped to each member's own zero-access certificate
(`KeyVault.memberKeyWraps`, routes `/:id/keyvault/members`, `member-wraps` and `shared-zero-access-key`). Members'
clients provision, share and rotate it in the background (`sharedMailboxKeys.ts`). A member's unlocked mailbox opens it
without another password. A mailbox with no owner escrows its keys straight to its scope.

Outlook and phones read zero-access mail only after the user installs a passphrase-protected PKCS#12 file of their keys
(`keyExport.ts`; `POST /:id/keyvault/exports` audits key kinds and fingerprints only). They can't open protected
calendar, contact or task fields at all, and show the placeholders. ActiveSync serves a sealed message as
`IPM.Note.SMIME`. MAPI serves an explanation as the body.

### What the server can no longer do

Filter rules on the body after delivery, server-side content search, server assembly or quoting of a draft, admin
quarantine preview, retrospective virus scanning, and server-side mailbox import (409, since the upload would wait
readable in the blob store). Scanning at delivery is unaffected. Compliance search of protected content is only possible
through the escrow scope that covers the mailbox.

## Encryption policy

The policy says, for each kind of recipient, whether encryption is `automatic`, `optional` or `prohibited`:
`encryptSameOrg`, `encryptFederated` (other RapidMX domains) and `encryptExternal`. It is one deployment-wide record at
`/api/system/encryption-policy`, readable by any signed-in user, writable by administrators, and audited. Every tier
defaults to `optional`. The compose window applies it in `lib/crypto/composeSecurity.ts`. The same record holds the two
server-wide switches `allowZeroAccess` and `allowOpenPgp`, both on by default.

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
  (72 by default). The release also carries the wrapped zero-access and encryption private keys with their certificates,
  never the signing key, and for a mailbox without an owner its zero-access keys wrapped straight to the scope
  (`KeyVault.zeroAccessEscrowWraps`). Opening the wraps takes the scope's private key, which only the holders have.
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
| Zero-access sealing | `@rapidmx/restapi` `src/zeroaccess/`, `src/jobs/ZeroAccessBackfillJob.ts` |
| Web Key Directory | `@rapidmx/restapi` `src/routes/BaseWkdRoute.ts` |
| Vault, lookup and discovery routes | `@rapidmx/restapi` `src/routes/BaseKeyVaultRoute.ts`, `BaseKeyLookupRoute.ts`, `BaseKeyDiscoveryRoute.ts` |
| Discovery and pinning | `@rapidmx/restapi` `src/util/LocalKeyDiscoveryUtils.ts`, `KeyringUtils.ts`, `FederationUtils.ts`, `RapidMxKeyHeaderUtils.ts` |
| Certificate authorities and ACME | `@rapidmx/restapi` `src/pki/` |
| Escrow | `@rapidmx/restapi` `src/routes/BaseEscrow*Route.ts`, `src/util/EscrowAuditUtils.ts` |
