---
sidebar_position: 8
title: Encryption and certificates
description: Set the end-to-end encryption policy for each kind of mail, and understand where encryption and signing certificates come from and how to issue signing certificates by hand.
---

# Encryption and certificates

RapidMX can encrypt mail end to end with S/MIME. Encryption and decryption happen in each person's browser, with keys kept in a personal key vault that only they can unlock (with their encryption password, a recovery code or a passkey). An encrypted message can be read by its sender and recipients, and not by the server or its administrators.

As an administrator you decide **when** encryption is used, through the encryption policy, and you keep the certificates flowing that make encryption and signing work. How people use encryption day to day is in [Encryption](../user-guide/encryption.md).

:::caution
Because the server can't read encrypted mail, a person who loses their encryption password **and** their recovery codes loses their encrypted mail, unless their mailbox is covered by [key escrow](key-escrow.md). Decide on escrow before people start encrypting.
:::

## Encryption policy

Open **Encryption Policy**. The policy has one setting for each kind of mail:

| Setting | Applies to |
| --- | --- |
| **Mail within this server** | Messages between mailboxes hosted on this server |
| **Mail to other RapidMX servers** | Messages to people on another RapidMX server that publishes its encryption keys |
| **Mail to everyone else** | Messages to any other e-mail provider, using S/MIME |

Each one can be:

- **Always encrypt when possible**: messages are encrypted automatically whenever the recipient's key is known.
- **Let people choose**: encryption is available but not the default; each person decides per message.
- **Never encrypt**: nobody on this server can encrypt that kind of mail, whatever they've chosen for themselves.

Choose **Save**. Changing a setting to **Never encrypt** asks you to confirm with **Save and turn off encryption**.

**Never encrypt** and **Let people choose** are deliberately different. Use **Never encrypt** when your organization has to be able to review that mail (some supervisory or archiving obligations require it); use **Let people choose** when routine encryption isn't wanted but some conversations, such as privileged legal communication, must still be encryptable.

The policy applies to the whole server. Every signed-in user can read it, because the mail app uses it to decide which encryption controls to offer.

## Where certificates come from

S/MIME uses two kinds of certificates for each mailbox, and they come from different places.

### Encryption certificates

The certificates that let others encrypt mail **to** a mailbox are issued by a certificate authority the server runs itself. By default its key and certificate are kept on the server's `pki-data` volume; with OpenBao, the server uses an OpenBao PKI mount instead, and the CA key never leaves the vault. When a person sets up encryption, their browser creates the key and the server's certificate authority signs the certificate; the private key stays with the person. See [Secrets and OpenBao](../operations/secrets-and-openbao.md) and back up the volume with the rest of your data ([Backup and restore](../operations/backup-and-restore.md)).

### Digital signature certificates

A signing certificate lets a person **digitally sign** mail, so recipients can check who sent it and that it wasn't changed. A person requests one from **Settings → Encryption** in the mail app. How it's issued depends on the server's signing backend, set in the Helm chart (`mail.signingEnrollment.backend`):

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
