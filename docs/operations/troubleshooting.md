---
sidebar_position: 10
title: Troubleshooting
description: Symptoms, causes and fixes for the problems most often met when installing and running a RapidMX server.
---

# Troubleshooting

This page collects the problems people most often run into, grouped by when they appear: during the install, when mail
starts flowing, and in day-to-day running. Each entry starts from what you see. If yours isn't here, the admin
console's [Diagnostics](monitoring.md#the-diagnostics-page) page and the server's log are the places to start; attach a
**diagnostics report** and a log capture when you ask for help.

## Installing

### The Helm render fails with a message

The chart checks its values before it installs anything, and its messages say what to set. The common ones:

| Message starts with | Fix |
| --- | --- |
| `global.jwt.secret is required` | Pass `global.jwt.secret`. On an existing release the message shows how to read the current value. |
| `global.mailIngestSecret (or mail.ingestSecret) is required` | Pass `global.mailIngestSecret`. |
| `host ... is public but postfixBridge.hostname is ...` | Set `postfixBridge.hostname` to Postfix's public host name. |
| `postfixBridge.domains is still example.com` | Set `postfixBridge.domains`. |
| `host is ... but global.serverHost resolves to ...` | Set `global.serverHost` to the same value as `host`. |
| `service.replicas is ..., but ... use ReadWriteOnce storage` | See [Scaling](scaling.md#run-more-than-one-copy-of-the-server). |
| `mongodb.create and postgresql.create are both true` | Turn one of them off. |
| `mail.transport.provider is "ses" but postfixBridge.create is true` | Set `postfixBridge.create=false`. |
| `Rendering without cluster access ... generated secrets would change` | Set the named secrets explicitly. See [Secrets and OpenBao](secrets-and-openbao.md#rendering-without-cluster-access). |
| `externalSecrets.enabled is true but this cluster has no External Secrets Operator` | Install External Secrets with the command in the message, or turn OpenBao off. |
| `The escrow audit HMAC key you set ... differs from the one stored` | Don't change it. Remove your value, or set it to the stored one, which the message shows how to read. |
| `coturn.tls.enabled is true ... coturn.hostname is ..., which is not this chart's host` | Set `coturn.tls.existingSecret`, or `coturn.tls.enabled=false`. See [Video calls](video-relay.md#turn-over-tls). |

### Certificates stay `READY False`

`kubectl -n rapidmx get certificate` shows no certificate ready.

1. Check that `mail.example.com` and `auth.example.com` resolve to the server (or the load balancer) from outside.
2. Check that port 80 is reachable from the internet: Let's Encrypt validates over HTTP.
3. Look at why: `kubectl -n rapidmx describe certificate mail.example.com` and
   `kubectl -n rapidmx get challenges`.
4. If you installed many times against the same names, you may have hit Let's Encrypt's weekly limit for duplicate
   certificates. Wait, or test with a `.local` domain.

Certificates are issued as soon as the names resolve, so adding the DNS records after the install is fine.

### The single-server installer stops

| It says | Fix |
| --- | --- |
| `Docker appears to be running and will cause issues with k3s` | Stop and disable Docker on this server, or use another one. |
| `Envoy answers http://localhost with 400` | The Gateway doesn't accept nginx's PROXY protocol header yet. Check `kubectl get clienttrafficpolicy -A` and re-run. |
| `There was a problem restarting nginx reverse proxy` | Something else listens on port 80 or 443. The script lists it; stop or move it and re-run. |
| `... already has a stream {} block this script didn't write` | Make that block forward ports 80 and 443 to the address the script names, with `proxy_protocol on`, then re-run. |

The script is safe to re-run once you've fixed the cause.

### Pods stay pending or restarting

- **ClamAV not ready for several minutes** is normal on a first start: it loads its signature database first, and the
  startup probe allows about ten minutes.
- **coturn pending** on a first install waits for the certificate. It starts once `kubectl -n rapidmx get certificate`
  shows it ready.
- **The server pod waiting in its init containers** is waiting for MongoDB or Redis. Check those pods. On a cluster
  that enforces NetworkPolicy, only pods labelled as their clients may connect, which the chart arranges.
- **An `ExternalSecret` with `SecretSyncedError`** (with OpenBao): a field is missing from the vault path. A path made by
  hand needs `escrow_audit_hmac_key` too. See [Secrets and OpenBao](secrets-and-openbao.md).
- **`Refusing to start ... with empty or default development secret(s)`** in the server's log: set the named secrets,
  or use `NODE_ENV=dev` for a local trial only.

### The `admin` password command prints nothing

The command reads the auth-server's Secret in the release namespace. Check the namespace and release names: with the
single-server installer both are `rapidmx` (Secret `rapidmx-authserver-service-secrets`); on AWS both are
`rapidmx-server` (Secret `rapidmx-server-authserver-service-secrets`). On Docker Compose the password file is deleted
when the auth-server restarts.

## Mail

### Mail doesn't arrive

1. **Ownership.** In the admin console's **Domains**, the domain must be verified. Until the ownership record is found,
   the domain can't send or receive.
2. **MX.** The domain's MX record must point at the host Postfix answers on (`mail.example.com` by default), and that
   name must reach the `postfix` Service on port 25: `kubectl -n rapidmx get svc postfix`.
3. **Port 25 inbound** must be open in every firewall in front of the server.
4. **TLS.** Postfix requires TLS from other servers. A sender that can't do TLS is refused.
5. **Postfix's log** shows each connection: `kubectl -n rapidmx logs deploy/postfix` (or the `postfix` service on
   Compose).
6. **On AWS**, check that the SES receipt rule set is active and that ses-bridge's Lambda runs in a subnet with
   outbound access. See [AWS](../getting-started/aws.md).

### Mail doesn't leave, or bounces

- **Outbound port 25 blocked.** Many hosting providers block it by default. Ask yours to lift the block.
- **Recipient's server doesn't offer TLS.** Postfix only delivers over TLS, so delivery fails.
- **On AWS**, the account may still be in the SES sandbox (only verified recipients get mail), or the From address isn't
  on a verified SES identity.
- **Docker Compose:** the server relays to `SENDMAIL_RELAY_HOST`. It must be `postfix` with both stacks in the same
  project, and the sending domain must be in Postfix's `MAIL_DOMAINS`.

### Mail lands in spam at other providers

Check each domain's **DNS setup checklist** in the admin console. SPF, DKIM and DMARC should all be **Live**. Also
check the server's reverse DNS (PTR) record points at `mail.example.com`, see [Before you
deploy](../getting-started/before-you-deploy.md#reverse-dns-ptr). Under Docker Compose, outgoing DKIM signatures don't
use the published key, see [Mail transport](mail-transport.md#with-docker-compose).

### Members-only lists drop mail, or forwarded invitations are refused

`mail.trustedAuthservId` is empty, so no sender is DKIM-verified. The server logs a warning about it at startup. With
the bundled Postfix it's set for you; with ses-bridge or your own MTA, set it. See [Mail
transport](mail-transport.md#sender-verification-mailtrustedauthservid).

### Spam or virus scanner down

Outside development mode the server fails closed when a scanner can't be reached:

- With **ClamAV** unreachable, incoming mail is quarantined until it answers again.
- With **rspamd** unreachable, incoming mail goes to Junk.
- **Sending** is refused while either scanner is down.

Check both on the Diagnostics page's **Other containers** table, or with `kubectl -n rapidmx get pods`. ClamAV needs
about 1 GiB of memory; a node short of memory restarts it. Review held mail afterwards in the admin console, see
[Quarantine and audit log](../administration/quarantine-and-audit-log.md).

### A signing certificate request is stuck at "awaiting challenge"

Automatic (RFC 8823) signing certificates are verified by e-mail: the certificate authority mails the mailbox, and the
mailbox's automatic, DKIM-signed reply has to reach it. A request stalls when inbound mail or DKIM signing isn't
working, or `mail.trustedAuthservId` is empty. Check the **Signing Certificates** admin page for the last error, and
the server log for `Rfc8823AcmeSigningCertificateEnrollment` or `AcmeEnrollmentDriverJob` lines. See [Encryption and
certificates](../administration/encryption-and-certificates.md).

### The sign-in page doesn't send codes

The auth-server sends codes over SMTP with its own settings (`global.smtp`). On AWS it needs an SES SMTP account; see
step 7 of the [AWS guide](../getting-started/aws.md). If the settings changed after its first start, use the
reset-to-configuration action on the auth-server admin console's Messages page.

## Running

### Phones or Outlook can't sign in

Outlook and Exchange ActiveSync sign in with an **app password**, created on the account page at `auth.example.com`,
not the account password. After ten failed attempts from one address for one user name within 15 minutes, further
attempts get `429 Too Many Requests` until the window passes. See [App passwords](../clients/app-passwords.md).

### A plugin's pages don't appear

When enabled plugins ship pages, the server builds them as it starts. A plugin whose pages fail to build is left out:
its pages answer `404`, its navigation entries are hidden, and the admin console's plugin status shows the error. The
rest of the server keeps working. A page whose path clashes with another route isn't served either.

### "Could not add default plugin" at every start

A default plugin couldn't be installed from npm, for example because the registry can't be reached or the package
isn't published. The other plugins install and load as usual. Check that the server can reach
`https://registry.npmjs.org`.

### Uploading a plugin pack fails

The upload must pass every limit in front of the server: `plugins.uploads.maxBytes` (50 MiB), the server's
`max_body_size` (100 MiB) and the Gateway's. Envoy Gateway has no body limit by default; nginx-based gateways default to
1 MiB and must be raised.

### Rate limits or the audit log show the same address for everyone

The server doesn't see the clients' real addresses. See [Scaling](scaling.md#client-addresses-behind-a-load-balancer).

### Docker Compose warns about orphan containers

Expected when postfix-bridge runs in the same project as the server. Never answer it with `--remove-orphans`.
