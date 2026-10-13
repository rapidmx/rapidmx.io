---
sidebar_position: 1
title: Upgrading
description: Upgrade a RapidMX server safely on Docker Compose, Kubernetes, k3s and AWS, and what changes on startup when you do.
---

# Upgrading

RapidMX is released often, and an upgrade is usually one command. What makes it worth reading about is what happens
the first time the new version starts: the server updates its own database schema. There are no separate migration
scripts to run, which keeps upgrades simple, but it also means a backup is your only way back if an upgrade goes
wrong. This page covers the backup, the upgrade command for each deployment, and the release-specific steps to look
out for.

## Before you upgrade

1. **Back up the database**, and ideally the volumes too. See [Backup and restore](backup-and-restore.md).
2. **Read the release notes** of every version between yours and the new one. The admin console shows the release
   notes of the running version, and they're in `RELEASE_NOTES.md` in the [server
   repository](https://github.com/rapidmx/server).
3. **Note your secrets** if you don't use OpenBao: `global.jwt.secret` and `global.mailIngestSecret` on Kubernetes
   (see [below](#if-you-lost-the-secrets)), or your `.env` file on Docker Compose.

:::warning PostgreSQL
On PostgreSQL, the schema update can drop and recreate a column whose type changed between releases, and that
column's data is lost. Some releases need a manual SQL step before you start them. Check the "Upgrading" section of
the [@rapidmx/restapi README](https://github.com/rapidmx/restapi#upgrading) for the version you're moving to.
MongoDB has no column types, so this doesn't apply there.
:::

## Upgrade

### Docker Compose

Pull the new code and start again:

```bash
git pull
docker compose -p rapidmx -f docker-compose.mongo.yml up -d --build
```

Add `-f docker-compose.prod.yml` if you run the production setup. Upgrade postfix-bridge the same way, from its own
checkout, with `docker compose -p rapidmx up -d --build`.

### Kubernetes, k3s and AWS

Upgrade the Helm release:

```bash
helm upgrade rapidmx oci://ghcr.io/rapidmx/charts/server --version 1.0.0-beta.43 --namespace rapidmx \
  --reset-then-reuse-values --wait --timeout 10m
```

- The single-server installer installs a release named `rapidmx` in the namespace `rapidmx`.
- On AWS both are `rapidmx-server`, and you run the command on the instance after
  `export KUBECONFIG=/etc/rancher/k3s/k3s.yaml`.
- `--reset-then-reuse-values` (Helm 3.14 or later) keeps every value you set and picks up new defaults. Don't use plain
  `--reuse-values`: it misses new defaults, and the upgrade can fail.

### Re-running the installers

The single-server and AWS installers upgrade too. Run the script again with the new version, and it also re-checks
nginx, the Gateway and the other pieces it installed:

```bash
# Single server
./single_node_install.sh --domain example.com --email you@example.com --version 1.0.0-beta.43
```

```bash
# AWS, in a Session Manager shell on the instance
sudo -i
export RAPIDMX_DOMAIN=example.com RAPIDMX_CHART_VERSION=1.0.0-beta.43
curl -fsSL https://raw.githubusercontent.com/rapidmx/server/main/deploy/aws/bootstrap.sh -o /root/rapidmx-bootstrap.sh
bash /root/rapidmx-bootstrap.sh
```

Pass the same options and environment variables you installed with (for example `--mail-host`, or
`RAPIDMX_HOSTED_ZONE_ID` and `RAPIDMX_SES_SMTP_USERNAME`), or they go back to their defaults. Both scripts keep the
existing secrets.

## What happens during the upgrade

1. **Kubernetes stops the old server pod before starting the new one.** The server's volumes are `ReadWriteOnce`, so
   the Deployment uses the `Recreate` strategy and there is a short outage. Postfix keeps running; postfix-bridge
   treats a server it can't reach as a temporary failure, so the sending mail server retries later.
2. **The server updates its schema** from its models on startup (`datastores:*:synchronize`, on by default): new
   collections, tables, columns and indexes. On a large mailbox table, creating a new index can make the first start
   take a while. The startup probe allows 15 minutes.
3. **Plugins are reinstalled.** Each pod installs the plugin set recorded in the database when it starts, and rebuilds
   the browser bundles if a plugin with pages changed. That adds from a few seconds to about a minute.
4. **New default plugins are added.** A plugin that becomes a default in a new release is added to an existing
   deployment at its next start, unless an administrator removed it before.

Watch it with:

```bash
kubectl -n rapidmx rollout status deploy/rapidmx-server-services
kubectl -n rapidmx get pods
```

If you manage schema changes yourself, turn the automatic update off with `datastores__acl__synchronize=false` and
`datastores__mongo__synchronize=false` (or `datastores__sql__synchronize=false`). See [Server
configuration](configuration.md).

## If you lost the secrets

Without OpenBao, the chart's two required secrets are stored in the cluster. Read them back with:

```bash
kubectl -n rapidmx get secret rapidmx-server-jwt-auth -o jsonpath='{.data.auth__secret}' | base64 -d
kubectl -n rapidmx get secret rapidmx-server-mail-ingest-secret -o jsonpath='{.data.mail__transport__ingest__secret}' | base64 -d
```

`--reset-then-reuse-values` passes them on for you. With OpenBao, upgrades don't need them at all.

## Upgrading the Meet plugin and the TURN server together

The chart gives the Meet plugin two TURN addresses in one setting (`turn:` and `turns:`), which needs the plugin at
version 0.4.0 or later. Update the plugin in the admin console before, or together with, a chart that has TURN over TLS
on. See [Video calls: the TURN relay](video-relay.md).

## Rolling back

Helm can roll back the release (`helm rollback rapidmx -n rapidmx`), but it can't undo a schema change the new version
made. If the new version changed the schema in a way the old one can't read, restore the database backup you took
first. See [Backup and restore](backup-and-restore.md).
