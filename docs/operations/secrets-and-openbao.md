---
sidebar_position: 4
title: Secrets and OpenBao
description: Which secrets a RapidMX deployment has, how they are generated and kept, and how to store them in OpenBao instead of Kubernetes Secrets.
---

# Secrets and OpenBao

A RapidMX deployment has a handful of secrets that hold it together: the key that signs sign-in tokens, the secret
postfix-bridge uses to hand mail to the server, the keys behind cookies and sessions, and the key that makes the escrow
audit log tamper-evident. They have to be the same on every copy of the server, the same on both ends of each
connection, and stable across upgrades. Change one by accident and everyone is signed out, mail stops arriving, or
the escrow audit log stops verifying.

By default the Helm chart keeps them in Kubernetes Secrets. The single-server and AWS installers go one step further
and keep them in [OpenBao](https://openbao.org), an open-source secrets vault, from which
[External Secrets](https://external-secrets.io) copies them into the Kubernetes Secrets the pods read. This page
explains both.

## The secrets

| Secret | Shared with | Server setting | Without OpenBao | OpenBao field |
| --- | --- | --- | --- | --- |
| JWT secret | auth-server | `auth:secret` | `global.jwt.secret`, required | `auth_secret` |
| Mail ingest secret | postfix-bridge or ses-bridge | `mail:transport:ingest:secret` | `global.mailIngestSecret`, required | `mail_ingest_secret` |
| Cookie secret | — | `cookie_secret` | generated once and kept | `cookie_secret` |
| Session secret | — | `session:secret` | generated once and kept | `session__secret` |
| Escrow audit key | none | `mail:escrow:audit_hmac_key` | generated once and kept | `escrow_audit_hmac_key` |

Other Secrets the chart generates once and keeps: the rspamd controller password (`<fullname>-rspamd`), the TURN
secret (`<fullname>-coturn`) and the [configuration keyring](#the-configuration-keyring) (`<fullname>-config-keyring`).
The auth-server keeps the `admin` account's initial password in `<release>-authserver-service-secrets`.

:::danger Never change the escrow audit key
Every entry of the escrow audit log is chained under this key. Entries chained under an old key no longer verify. The
chart refuses to render when you set a different key than the one stored, and OpenBao's copy is written once and never
replaced.
:::

## Without OpenBao (the chart's default)

You supply two secrets and the chart generates the rest:

- **`global.jwt.secret`** is required while the bundled auth-server is installed. Each side reads the same value; left
  out, each would generate its own and the server would reject every sign-in.
- **`global.mailIngestSecret`** is required. It can't be generated, because postfix-bridge must be given the same value.

Pass both again on every upgrade, or use `helm upgrade --reset-then-reuse-values`. The cookie, session and escrow audit
secrets are generated on install into `<fullname>-service-secrets` and read back on every upgrade. To manage those
yourself, set `global.secrets.cookies`, `global.secrets.sessions` and `mail.escrow.auditHmacKey`, or point
`global.secrets.existingSecret` at a Secret with the keys `cookie_secret`, `session__secret` and
`mail__escrow__audit_hmac_key`.

### Rendering without cluster access

Generating a secret once and keeping it needs the chart to read the existing Secret, which `helm template`, `--dry-run`
and GitOps tools like Argo CD and Flux can't do. Rather than generate new secrets on every render (and sign everyone
out on every sync), the chart fails with a message naming what to set. Set the values above explicitly, along with
`mail.rspamd.controller.password` or `mail.rspamd.controller.existingSecret`, and `coturn.auth.sharedSecret` or
`coturn.auth.existingSecret`, and set `configEncryption.existingSecret` for the
[configuration keyring](#the-configuration-keyring).

## The configuration keyring

Credentials an administrator saves in the admin console (DNS provider credentials, the Giphy key, the plugin registry
and namespace tokens, and plugins' secret settings) are encrypted in the database with AES-256-GCM. A database dump
alone reveals none of them. The key is the configuration keyring.

:::danger Back up the keyring with the database
A production server **refuses to start** without a keyring, and a database backup is useless without the keyring it was
encrypted with. Back the two up together, keep each keyring copy as long as the database backups it serves, and back it
up again after every rotation. See [Backup and restore](backup-and-restore.md).
:::

Where it lives depends on the deployment:

- **Without OpenBao**, it is the Secret `<fullname>-config-keyring`, key `keyring.json`. The chart generates it once, in
  a pre-install/pre-upgrade hook, and Helm keeps it through `helm uninstall` and `helm rollback`. Never use
  `helm rollback --force`, which replaces every resource it touches.
- **With OpenBao**, it is the KV secret `<kv mount>/<fullname>/config-keyring`, property `keyring`, which External
  Secrets syncs into that same Secret. The installers create it once, copying an existing Secret's keyring so nothing
  needs re-encrypting.
- **Rendering without cluster access** can't generate it, so the render fails. Set `configEncryption.existingSecret` to
  a Secret you manage, with the key `keyring.json`, and the chart mounts that one.

Only the server pods mount it, read-only, at `/etc/rapidmx/config-keyring`. A secret the server can't decrypt, for
example after a restore with an older keyring, shows in the console as **Set, but can't be read: enter it again**. For
a plugin's secret setting, the deployment's value or the plugin's default applies instead, with a warning in the log.

### Rotating the keyring

An administrator starts a rotation on the admin console's **Configuration encryption** page; it never runs on a
schedule. The server adds a key, waits until every server copy has loaded it, re-encrypts every secret and removes the
old key. Use **Key compromised** if the keyring may have leaked, and replace the credentials at their providers
afterwards too.

The server writes the new keyring through the Role `<fullname>-config-keyring` (`configEncryption.rbac.create`), which
may only `get` and `update` that one Secret, or with OpenBao through its own identity (`openbao.auth`). Without either,
a rotation is refused.

With `configEncryption.existingSecret`, a rotation is refused too, because a tool that owns the Secret would put its own
copy back, and what the rotation re-encrypted could no longer be read. Add the new key to the Secret's source yourself.
Only for a Secret nothing else reconciles, `configEncryption.existingSecretRotation=true` lets the server replace it.

### Leaving OpenBao

Turning off OpenBao or External Secrets is refused while the ExternalSecret owns the keyring's Secret, since deleting one
would delete the other. Save the keyring first, then release the Secret:

```bash
kubectl -n rapidmx delete externalsecret rapidmx-server-config-keyring --cascade=orphan
```

## With OpenBao

With `global.openbao.enabled=true`, the release reads its secrets from OpenBao, at `global.openbao.kvMount` (default
`secret`), path `global.openbao.secretsPath` (default `<fullname>/secrets`). External Secrets copies them into the same
Kubernetes Secrets the pods already load, so nothing in the application changes. The bundled auth-server reads the
same path, so both sides share one JWT secret without either value being passed in, and upgrades need no secrets at
all.

```mermaid
flowchart LR
    Bao[("OpenBao<br/>secret/rapidmx-server/secrets")] -->|External Secrets| K8s["Kubernetes Secrets<br/>jwt-auth, service-secrets,<br/>mail-ingest-secret"]
    K8s --> Server["RapidMX server"]
    K8s --> Auth["auth-server"]
    K8s --> PB["postfix-bridge"]
```

**OpenBao and External Secrets are prerequisites, like cert-manager.** The chart installs neither, which is why the
value is off by default. External Secrets' CRDs are cluster-wide, so the chart can't bring them, and the render fails
with the command to install it when it's missing.

### What the installers set up

The single-server installer (`--openbao true`, the default) and the AWS installer (`EnableOpenBao`, on by default):

1. Install OpenBao in the `openbao` namespace, standalone with file storage on a volume, and External Secrets.
2. Initialise the vault with a single unseal key, and keep the key and the root token in the **`openbao-keys`** Secret
   in the `openbao` namespace.
3. Run an **`openbao-unsealer`** Deployment that unseals the vault within about ten seconds whenever it comes back
   sealed: after a pod restart, an upgrade or a reboot.
4. Write the release's secrets into the kv v2 mount `secret`, at `<fullname>/secrets`. A value already there always
   wins, so a re-run never re-keys anything.
5. Create a PKI mount (`pki`) with a root CA, and an issuing role (`rapidmx-encryption`) for the server's mail
   encryption certificates.
6. Create the [configuration keyring](#the-configuration-keyring)'s KV entry, once.
7. Have cert-manager issue the vault's listener certificate from a CA of its own, and copy that CA into the ConfigMap
   `<fullname>-openbao-ca`. The vault listens with TLS only, at `https://openbao.openbao.svc:8200`.
8. Turn on OpenBao's `kubernetes` auth method, with one role per client. No long-lived token is kept: each client logs in
   with a short-lived token of its own ServiceAccount, for the audience `openbao`, and gets an OpenBao token that lasts
   an hour.

| Role | ServiceAccount | May |
| --- | --- | --- |
| `<fullname>-eso` | `<fullname>-openbao-eso`, used by External Secrets | Read the release's secrets and the keyring |
| `<fullname>-server` | The server's own | Sign and revoke on the PKI role, and read and update the keyring |

Re-running an installer on an older install moves it over. Once External Secrets and the server log in the new way, it
revokes the two periodic tokens earlier versions made and deletes their Secrets (`<fullname>-openbao-eso` and
`<fullname>-openbao-pki`).

Read the release's secrets with the root token from `openbao-keys`:

```bash
kubectl -n openbao exec -it openbao-0 -- env BAO_TOKEN=<root token> bao kv get -mount=secret rapidmx-server/secrets
```

:::warning The trade-off of auto-unsealing
Keeping the unseal key in a Secret is what lets the deployment heal itself after a reboot. The cost is that anyone who
can read Secrets in the `openbao` namespace can unseal the vault. **Back up the `openbao-keys` Secret**: without it,
nothing in the vault can be recovered. A cluster with a KMS to auto-unseal from should run its own vault and point the
chart at it instead.
:::

### Using an OpenBao you already run

Point the chart at it with `global.openbao.address`, and the installers with `OPENBAO_ADDRESS` (single server) or
`RAPIDMX_OPENBAO_ADDRESS` (AWS); they then install and prepare nothing. Your vault must hold, under
`global.openbao.kvMount` at `global.openbao.secretsPath`, the fields `auth_secret`, `cookie_secret`, `session__secret`,
`escrow_audit_hmac_key` and `mail_ingest_secret`. Generate each once, for example with `openssl rand -hex 32`. It must
also hold the property `keyring` at `configEncryption.openbao.path` (default `<fullname>/config-keyring`): the
installation's existing `keyring.json` if it has one.

The address must be `https://` (plain `http://` only to the host itself). If a private CA signed the vault's listener,
name a ConfigMap holding it under `ca.crt` in `global.openbao.caConfigMap`, which External Secrets and the server verify
the vault with.

Authenticate External Secrets in one of two ways:

- **A token** (`global.openbao.auth.method=token`, the default): `global.openbao.auth.tokenSecret` names a Secret
  (default `<fullname>-openbao-eso`) whose `token` key may read that path.
- **Kubernetes auth** (`global.openbao.auth.method=kubernetes`), which stores no token at all: set
  `global.openbao.auth.kubernetes.role` to an OpenBao role bound to the namespace's ServiceAccount, and
  `global.openbao.auth.kubernetes.mountPath` and `.serviceAccount` if they differ from `kubernetes` and `default`.

If `escrow_audit_hmac_key` is missing from a path you made by hand, its ExternalSecret reports `SecretSyncedError` and
the Secret stops being refreshed. Add the field before upgrading.

### The encryption certificate authority

The server issues users' encryption certificates from a certificate authority. Its backend is the server setting
`mail:pki:backend`:

- `local` (the server's default): a CA key kept on the PKI volume, `/var/lib/rapidmx/pki`.
- `openbao`: an OpenBao PKI mount. The server sends each certificate signing request to the vault, so the CA's private
  key never leaves it. It needs `mail:pki:openbao:address`, `:mount`, `:role` and an identity that may `update` on
  `<mount>/sign/<role>` and `<mount>/revoke`.

Give the server that identity with the chart's `openbao.auth`:

- **`openbao.auth.method=kubernetes`**, which the installers use: the pod logs in with a projected ServiceAccount token
  for the audience `openbao`, as the role `openbao.auth.role` (default `<fullname>-server`). The pod can't run as the
  namespace's `default` ServiceAccount.
- **`openbao.auth.method=token`**, for a vault prepared by hand: the token under the key `token` of the Secret
  `openbao.auth.tokenSecret`. The chart refuses a token in `service.config`, whose ConfigMap is plaintext.

To see which backend your server runs with, open **Diagnostics** in the admin console and look up `mail:pki:backend` in
the **Configuration** table. See [Server configuration](configuration.md#encryption-certificates) for every
`mail:pki:*` setting.

## Rotating secrets

| Secret | Effect of changing it |
| --- | --- |
| JWT secret | Everyone is signed out. Change it on both the server and the auth-server at once (one value with the chart). |
| Cookie and session secrets | Everyone is signed out. |
| Mail ingest secret | Mail stops flowing until postfix-bridge (or ses-bridge) has the new value too. |
| Escrow audit key | Don't. The escrow audit log stops verifying. To rotate on purpose, first remove `mail__escrow__audit_hmac_key` from the `<fullname>-service-secrets` Secret, as the chart's error message explains. |
| Configuration keyring | Never replace it by hand. Use the [rotation](#rotating-the-keyring), which re-encrypts what the old key protected. |

Without OpenBao, change a secret by passing the new value to `helm upgrade`. With OpenBao, write the new value into the
vault; External Secrets picks it up within `global.externalSecrets.refreshInterval` (default `1m`), and the pods read it
when they next restart (`kubectl -n rapidmx rollout restart deploy/rapidmx-server-services`).
