---
sidebar_position: 2
title: Backup and restore
description: What a RapidMX server stores where, which parts can't be recreated, and the commands to back them up and restore them.
---

# Backup and restore

A RapidMX server keeps your organization's mail, calendars and contacts, and the keys that protect them. Some of that
can't be recreated if it's lost: a message body, a DKIM private key whose public half is published in DNS, the
certificate authority that issued your users' encryption certificates, or the key that makes the escrow audit log
tamper-evident. This page lists everything a deployment stores, says which parts matter, and gives the commands to
copy them out and put them back.

Back up on a schedule, and always before an [upgrade](upgrading.md): the server updates its database schema when a new
version starts, and a backup is the only way to undo that.

## What to back up

| What | Holds | If you lose it |
| --- | --- | --- |
| **The database** (MongoDB or PostgreSQL) | Mailboxes, folders, the message index, calendars, contacts, tasks, domains, policies, the audit log, the escrow audit log, and the auth-server's accounts | Everything is gone. |
| **Message storage** (blob volume, or your S3 bucket) | Message bodies, attachments, contact photos, uploaded plugin packs | The database still lists messages, but they can't be opened. |
| **DKIM keys** | The private keys outgoing mail is signed with | Mail fails DKIM until you publish new keys in DNS for every domain. |
| **PKI volume** | The local encryption certificate authority's key, the signing-certificate ACME account and pending requests | New encryption certificates come from a new CA that existing correspondents don't recognize. |
| **Secrets** | The JWT, cookie and session secrets, the mail ingest secret, the escrow audit key, the auth-server's own secrets | The escrow audit log stops verifying without its key. Lost sign-in secrets only sign everyone out. |
| **OpenBao** (when used) | The secrets above, and the encryption CA's key on the PKI mount | Without the `openbao-keys` Secret, nothing in the vault can be recovered. |

Things you don't need to back up: Redis (a cache; it only holds the spam filter's learned statistics, which rebuild
from users' reports), the plugins folder (reinstalled at every start), ClamAV's signatures, and Postfix's TLS
certificate (cert-manager issues it again).

:::warning The escrow audit key
`mail:escrow:audit_hmac_key` (Helm `mail.escrow.auditHmacKey`, Compose `ESCROW_AUDIT_HMAC_KEY`) keys the hash chain of
the escrow audit log. Keep a copy with your database backups and restore **the same key** with them. A restored log
checked against a different key no longer verifies.
:::

### Where each part lives

| Part | Kubernetes, k3s, AWS | Docker Compose (project `rapidmx`) |
| --- | --- | --- |
| Database | Deployment `mongodb`, claim `mongodb` | Service `mongo`, volume `rapidmx_mongo_data` (or `postgres`, `rapidmx_postgres_data`) |
| Message storage | Claim `rapidmx-server-blob-data`, mounted at `/app/data` | Volume `rapidmx_blob_data` |
| DKIM keys | Claim `rapidmx-server-dkim-keys`, mounted at `/var/lib/rspamd/dkim` | Volume `rapidmx_dkim_rspamd_keys` |
| PKI | Claim `rapidmx-server-pki-data`, mounted at `/var/lib/rapidmx/pki` | Volume `rapidmx_pki_data` |
| Secrets | Secrets in the release namespace (or OpenBao) | Your `.env` file |

The names above are for a release named `rapidmx` (the Kubernetes guide and the single-server installer). On AWS the
release and namespace are `rapidmx-server`, and the resources are named `rapidmx-server-...` the same way. The bundled
MongoDB holds both the server's and the auth-server's databases.

## Back up on Kubernetes

The commands below run from a machine with `kubectl` access, for the release `rapidmx` in the namespace `rapidmx`.
Each writes a file to the current directory. Copy the files somewhere off the server afterwards, and keep them
encrypted: they contain all of your mail and your secrets.

1. **The database.** The MongoDB image includes `mongodump`; it streams a compressed archive to your machine:

   ```bash
   kubectl -n rapidmx exec deploy/mongodb -c mongodb -- mongodump --archive --gzip > rapidmx-mongodb-$(date +%F).archive.gz
   ```

2. **Message storage, DKIM keys and PKI**, copied out of the running server pod:

   ```bash
   kubectl -n rapidmx exec deploy/rapidmx-server-services -- tar czf - -C /app/data . > rapidmx-blobs-$(date +%F).tgz
   kubectl -n rapidmx exec deploy/rapidmx-server-services -- tar czf - -C /var/lib/rspamd/dkim . > rapidmx-dkim-$(date +%F).tgz
   kubectl -n rapidmx exec deploy/rapidmx-server-services -- tar czf - -C /var/lib/rapidmx/pki . > rapidmx-pki-$(date +%F).tgz
   ```

   With `mail.blob.backend=s3` there is no blob volume. Back up the bucket with your provider's tools instead (for
   example S3 versioning or replication).

3. **Secrets.** Export every Secret in the namespace:

   ```bash
   kubectl -n rapidmx get secrets -o yaml > rapidmx-secrets-$(date +%F).yaml
   ```

   The escrow audit key on its own, to keep with the database backups:

   ```bash
   kubectl -n rapidmx get secret rapidmx-server-service-secrets -o jsonpath='{.data.mail__escrow__audit_hmac_key}' | base64 -d
   ```

4. **OpenBao**, if the installer set it up. Save the Secret with the vault's unseal key and root token:

   ```bash
   kubectl -n openbao get secret openbao-keys -o yaml > openbao-keys-$(date +%F).yaml
   ```

   That Secret only unlocks the vault; the vault's contents live on its own volume in the `openbao` namespace. Back that
   volume up too, with your storage's snapshot tools. The encryption CA's private key was generated inside the vault
   and never leaves it, so only a copy of the vault's storage preserves it. The release's other secrets can also be
   read out of the vault:

   ```bash
   kubectl -n openbao exec -it openbao-0 -- env BAO_TOKEN=<root token> bao kv get -mount=secret rapidmx-server/secrets
   ```

:::tip Volume snapshots
If your storage class supports CSI volume snapshots, snapshots of the `mongodb`, blob, DKIM and PKI claims are a good
complement to the file copies above. A snapshot of a running database isn't guaranteed to be consistent, so keep the
`mongodump` archive as well.
:::

## Back up on Docker Compose

Run these in the server checkout. Volume names start with the project name, `rapidmx`.

1. **The database:**

   ```bash
   # MongoDB
   docker compose -p rapidmx -f docker-compose.mongo.yml exec -T mongo mongodump --archive --gzip > rapidmx-mongo-$(date +%F).archive.gz

   # PostgreSQL
   docker compose -p rapidmx -f docker-compose.sql.yml exec -T postgres pg_dumpall -U postgres > rapidmx-postgres-$(date +%F).sql
   ```

2. **The volumes**, each into a tarball, with a throwaway container:

   ```bash
   for v in blob_data dkim_rspamd_keys pki_data; do
     docker run --rm -v rapidmx_$v:/data:ro -v "$PWD":/backup alpine tar czf /backup/rapidmx-$v-$(date +%F).tgz -C /data .
   done
   ```

3. **Your `.env` file**, which holds every secret.

## Restore

Restoring means putting the same data back behind a server that uses the same secrets. The safest way is onto a fresh
installation of the **same version** you backed up, before anyone uses it.

### Kubernetes

1. Install the same chart version with the same release name, namespace and secrets. Without OpenBao, pass the backed-up
   values explicitly:

   ```bash
   helm upgrade --install --create-namespace --namespace rapidmx rapidmx \
     oci://ghcr.io/rapidmx/charts/server --version 1.0.0-beta.43 \
     --set global.domain=example.com \
     --set global.jwt.secret=<backed-up auth__secret> \
     --set global.mailIngestSecret=<backed-up mail__transport__ingest__secret> \
     --set mail.escrow.auditHmacKey=<backed-up escrow audit key>
   ```

   With OpenBao, restore the vault (its volume and the `openbao-keys` Secret) first, then install as before.

2. Wait for the pods to start, then stop the server and the auth-server so nothing writes during the restore:

   ```bash
   kubectl -n rapidmx scale deploy/rapidmx-server-services deploy/rapidmx-authserver-services --replicas=0
   ```

3. Restore the database. `--drop` replaces each collection that exists in the archive:

   ```bash
   kubectl -n rapidmx exec -i deploy/mongodb -c mongodb -- mongorestore --archive --gzip --drop < rapidmx-mongodb-2026-10-12.archive.gz
   ```

4. Start the server again, and copy the files back into its volumes:

   ```bash
   kubectl -n rapidmx scale deploy/rapidmx-server-services --replicas=1
   kubectl -n rapidmx rollout status deploy/rapidmx-server-services
   kubectl -n rapidmx exec -i deploy/rapidmx-server-services -- tar xzf - --no-overwrite-dir -C /app/data < rapidmx-blobs-2026-10-12.tgz
   kubectl -n rapidmx exec -i deploy/rapidmx-server-services -- tar xzf - --no-overwrite-dir -C /var/lib/rspamd/dkim < rapidmx-dkim-2026-10-12.tgz
   kubectl -n rapidmx exec -i deploy/rapidmx-server-services -- tar xzf - --no-overwrite-dir -C /var/lib/rapidmx/pki < rapidmx-pki-2026-10-12.tgz
   ```

5. Restart the server so it reads the restored keys, and start the auth-server:

   ```bash
   kubectl -n rapidmx rollout restart deploy/rapidmx-server-services
   kubectl -n rapidmx scale deploy/rapidmx-authserver-services --replicas=1
   ```

6. Sign in, open a few messages with attachments, and check each domain's DNS checklist in the admin console: the DKIM
   row should be **Live** without any DNS change.

### Docker Compose

1. Put your `.env` file back, and start the stack once so the volumes exist:

   ```bash
   docker compose -p rapidmx -f docker-compose.mongo.yml up -d --build
   ```

2. Stop the server and the auth-server, and restore the database:

   ```bash
   docker compose -p rapidmx -f docker-compose.mongo.yml stop server auth-server
   docker compose -p rapidmx -f docker-compose.mongo.yml exec -T mongo mongorestore --archive --gzip --drop < rapidmx-mongo-2026-10-12.archive.gz
   ```

   On PostgreSQL, restore into a fresh `postgres_data` volume with
   `docker compose -p rapidmx -f docker-compose.sql.yml exec -T postgres psql -U postgres < rapidmx-postgres-2026-10-12.sql`.

3. Restore the volumes:

   ```bash
   for v in blob_data dkim_rspamd_keys pki_data; do
     docker run --rm -v rapidmx_$v:/data -v "$PWD":/backup alpine tar xzf /backup/rapidmx-$v-2026-10-12.tgz -C /data
   done
   ```

4. Start everything again:

   ```bash
   docker compose -p rapidmx -f docker-compose.mongo.yml up -d
   ```

## Test your backups

A backup you haven't restored is a guess. At least once, restore onto a separate test installation (a
[single server](../getting-started/single-server.md) with a `.local` domain works) and check that mail opens and the
admin console's [Diagnostics](monitoring.md) page reports a healthy server.
