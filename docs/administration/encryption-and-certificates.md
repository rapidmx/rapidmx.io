---
sidebar_position: 8
title: Encryption and certificates
description: Set the encryption policy, including zero-access encryption and OpenPGP, and understand where encryption and signing certificates come from and how to issue signing certificates by hand.
---

# Encryption and certificates

RapidMX protects mail in two ways, both with keys kept in a personal key vault that only each person can unlock (with their encryption password, a recovery code or a passkey):

- **Zero-access encryption** seals stored mail, calendars, contacts and tasks to a key only the mailbox's users hold. It covers everything, with no key exchange, but the server does see each item while it processes it. See [Zero-access encryption](#zero-access-encryption).
- **End-to-end encryption**, with S/MIME or OpenPGP, happens in each person's browser. Its messages can be read by their sender and recipients, and never by the server.

As an administrator you decide **when** encryption is used, through the encryption policy, and you keep the certificates flowing that make encryption and signing work. How people use encryption day to day is in [Encryption](../user-guide/encryption.md).

:::caution
Because the server can't read encrypted mail, a person who loses their encryption password **and** their recovery codes loses their encrypted mail, unless their mailbox is covered by [key escrow](key-escrow.md). With zero-access encryption on by default, that means **their whole mailbox**, not just the messages they chose to encrypt. Decide on escrow before people start using the server.
:::

## Encryption policy

Open **Encryption Policy**. Under **End-to-end encryption** the policy has one setting for each kind of mail:

| Setting | Applies to |
| --- | --- |
| **Mail within this server** | Messages between mailboxes hosted on this server |
| **Mail to other RapidMX servers** | Messages to people on another RapidMX server that publishes its encryption keys |
| **Mail to everyone else** | Messages to any other e-mail provider |

Each one can be:

- **Always encrypt when possible**: messages are encrypted automatically whenever the recipient's key is known.
- **Let people choose**: encryption is available but not the default; each person decides per message.
- **Never encrypt**: nobody on this server can encrypt that kind of mail, whatever they've chosen for themselves.

Choose **Save**. Changing a setting to **Never encrypt** asks you to confirm with **Save and turn off encryption**.

**Never encrypt** and **Let people choose** are deliberately different. Use **Never encrypt** when your organization has to be able to review that mail (some supervisory or archiving obligations require it); use **Let people choose** when routine encryption isn't wanted but some conversations, such as privileged legal communication, must still be encryptable.

Below those are two switches, both on by default:

- **Allow zero-access encryption**. See [Zero-access encryption](#zero-access-encryption).
- **Allow OpenPGP** gives every mailbox an OpenPGP key and publishes it. See [OpenPGP](#openpgp).

The policy applies to the whole server. Every signed-in user can read it, because the mail app uses it to decide which encryption controls to offer.

## Zero-access encryption

Zero-access encryption closes the gap end-to-end encryption leaves: the invoice, the newsletter and all the other mail from people who will never have a key. As a message arrives, after spam and virus scanning, the server encrypts it to the mailbox's public key and discards the readable copy. Because it uses only the public key, the server holds nothing that can decrypt the result.

**It defeats** theft of the mail store, exposed backups, an administrator browsing storage and impersonation. **It doesn't defeat** a compromised or malicious server at the moment of delivery, because the server does see the plaintext then. Don't describe it as end-to-end encryption.

A mailbox is protected once all of these are true:

1. **Allow zero-access encryption** is on. It is on by default, and is the only control administrators have.
2. The mailbox's owner hasn't turned off **Enable zero-access encryption** for it.
3. The mailbox has a zero-access key. It gets one when its user next signs in to the web app and unlocks, so **a mailbox nobody has opened is stored as before**.

A background job then seals what the mailbox already held. Each owner also chooses which of mail, calendar, contacts and tasks to protect. See [what is and isn't encrypted](../user-guide/encryption.md#what-is-and-isnt-encrypted).

Turning **Allow zero-access encryption** off affects only what arrives afterwards. Sealed mail stays sealed, since the server can't decrypt it, and every user sees in their settings that an administrator turned it off.

### What you give up

Once a mailbox is protected, the server can no longer do anything that means reading its stored content:

| Feature | With zero-access |
| --- | --- |
| Spam and virus scanning at delivery | Unchanged: it runs before sealing |
| Transport rules | Unchanged: they run before sealing |
| Mail filters on message text | Can't be applied to stored mail |
| Search of message contents | Runs on the user's device, not the server |
| Rescanning stored mail for viruses | Not possible |
| Quarantine preview | Not available for that mailbox |
| [eDiscovery](compliance.md#ediscovery) | Works on sender, recipient and date. Contents need the keys released through [key escrow](key-escrow.md). |
| Server-side mailbox import | Refused. An import already queued is sealed message by message. |
| Plugins | Mail events carry envelope details only, so a plugin can't process a bounce that lands in a protected mailbox |
| Outlook and phones | See [phones and Outlook](../user-guide/encryption.md#on-phones-and-in-outlook) |

A message waiting to be sent stays readable in the Outbox until it is relayed, for hours if it's scheduled, and then its Sent Items copy is sealed. A scheduled message someone deleted stays readable for 30 days, so that restoring it can still send it (`mail:jobs:zero_access_backfill:deleted_scheduled_send_days`).

Turn it off in the policy if your organization must keep mail readable on the server, such as for supervisory review or a compliance archive.

## OpenPGP

OpenPGP is how you exchange encrypted mail with people on Proton Mail, Thunderbird, GnuPG and other OpenPGP apps. S/MIME stays RapidMX's own format and is used whenever a recipient can receive it. With **Allow OpenPGP** on:

- Each mailbox gets an OpenPGP key on its user's next unlock. There's no certificate authority involved: the key is self-certified, and the server checks it. Its secret key is escrowed exactly like the encryption key.
- RapidMX publishes keys through a Web Key Directory at `/.well-known/openpgpkey`, which is how Proton Mail finds them, and in an `Autocrypt` header on outgoing mail. Public keyservers are never consulted, since they would reveal who your users write to.
- Off, no OpenPGP keys are created or published, and S/MIME is unaffected.

OpenPGP apps look first at `openpgpkey.example.com`. Add the **OpenPGP keys (CNAME)** record from each domain's [DNS checklist](domains.md#the-dns-setup-checklist), and have your TLS certificate cover it. See `mail.wkd.openpgpkeyHost.enabled` in [Helm chart](../operations/helm-chart.md).

## Where certificates come from

S/MIME uses two kinds of certificates for each mailbox, and they come from different places. OpenPGP keys need neither.

### Encryption certificates

The certificates that let others encrypt mail **to** a mailbox are issued by a certificate authority the server runs itself. By default its key and certificate are kept on the server's `pki-data` volume; with OpenBao, the server uses an OpenBao PKI mount instead, and the CA key never leaves the vault. When a person sets up encryption, their browser creates the key and the server's certificate authority signs the certificate; the private key stays with the person. See [Secrets and OpenBao](../operations/secrets-and-openbao.md) and back up the volume with the rest of your data ([Backup and restore](../operations/backup-and-restore.md)).

### Digital signature certificates

A signing certificate lets a person **digitally sign** mail, so recipients can check who sent it and that it wasn't changed. A person requests one from **Settings → Encryption** in the mail app. How it's issued depends on the server's signing backend, set in the Helm chart (`mail.signingEnrollment.backend`) or under **Integrations** > **S/MIME signing CA**, which takes effect without a restart:

| Backend | How a certificate is issued | When it's chosen by `auto` (the default) |
| --- | --- | --- |
| `rfc8823` (automatic) | Through a certificate authority that supports RFC 8823 e-mail validation. The CA sends a verification e-mail to the mailbox, the server answers it automatically, and the certificate is issued and installed, typically within 10 to 30 minutes. | For a real domain |
| `manual` | An administrator gets the certificate from a certificate authority of their choice and uploads it on the **Signing Certificates** page | For `localhost` and domains ending in `.local`, `.localhost`, `.test` or `.invalid` |

The automatic backend's certificate authority is set by `mail.signingEnrollment.directoryUrl`, which defaults to `https://acme.castle.cloud/acme/directory`. Whether recipients' mail apps trust the resulting signatures depends on whether that certificate authority's root is in their trust store.

The automatic backend needs inbound mail and DKIM signing working for the mailbox, because the certificate authority checks the mailbox's DKIM-signed reply. If either is broken, requests stall. Normal mail isn't affected. See [Signing certificates](#signing-certificates) below for how to spot a stalled request, and [Mail transport](../operations/mail-transport.md) for DKIM.

## Signing certificates

**Signing Certificates** lists every mailbox's pending signing-certificate request, with **Mailbox**, **Requested**, **Provider** (**Automatic (RFC 8823)** or **Manual**), **Status** and **Actions**. At the top it says how certificates are issued on this server, for example **Automatic issuance** through the certificate authority's host and how long it typically takes, and warns if the certificate authority couldn't be reached.

The page shows request details only, never a key or certificate content, and every action on it is recorded in the [audit log](quarantine-and-audit-log.md).

### Automatic requests

Automatic requests are listed for visibility only. A request that has been pending for much longer than the typical time shows its last error under its status. The most common cause is that the certificate authority's verification e-mail isn't reaching the mailbox, or the server's reply isn't DKIM-signed. If the certificate authority can't be reached several times in a row, a `signing_enrollment.ca_unreachable` entry is also written to the audit log.

### Issue a certificate by hand

With the manual backend, this page is how certificates get issued:

1. Choose **Download CSR** beside the request.
2. Submit the CSR to a certificate authority that issues S/MIME certificates, through its own website, and get the certificate it issues.
3. Back on this page, choose **Upload certificate**, paste the certificate (or a chain, leaf first) or choose the file, and choose **Upload**.

The server checks that the certificate matches the request's key, is for e-mail protection, names the mailbox's address and is currently valid, and says exactly what's wrong if not. A background job then installs the certificate into the person's key vault on its next run.

To refuse a request, choose **Reject** and give a **Reason**. The mailbox's owner sees the reason.

### Switching from manual to automatic

After changing the backend (`helm upgrade --set mail.signingEnrollment.backend=rfc8823`), a request made under the manual backend shows as failed in its owner's **Settings → Encryption**. Ask them to cancel it and request again. See [Upgrading](../operations/upgrading.md).

## Related

- [Encryption](../user-guide/encryption.md): what your users do
- [Key escrow](key-escrow.md): recovering encrypted mail with dual control
- [Helm chart](../operations/helm-chart.md): the `mail.signingEnrollment` values
