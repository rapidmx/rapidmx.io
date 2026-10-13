---
sidebar_position: 6
title: Scaling
description: How far one RapidMX server goes, how to give it more resources, and what it takes to run more than one copy of the server.
---

# Scaling

A RapidMX installation starts as one copy of the server on one node, which is the right size for most small and
medium organizations. When it needs more, there are two directions: give the one copy more CPU, memory and storage, or
run several copies of the server behind the Gateway. The first is a values change. The second needs shared storage,
because by default the server keeps its message store, DKIM keys and encryption CA on volumes only one pod can mount.

## Give one server more room

Most growth is handled by resources and storage:

| What | Value | Default |
| --- | --- | --- |
| Server CPU and memory | `service.resources` | requests `100m` CPU, `512Mi` memory |
| Message storage | `mail.blob.storage.size` | `20Gi` |
| MongoDB | `mongodb.resources` | requests `500m` CPU, `512Mi` memory |
| ClamAV | `mail.clamav.resources` | requests `200m` CPU, `1Gi` memory |
| rspamd | `mail.rspamd.resources` | requests `100m` CPU, `256Mi` memory |

The chart sets requests rather than limits for most components, so a pod can use what the node has spare. When
enabled plugins ship pages, the server builds their browser bundles as it starts, which takes a few hundred MiB more
for a moment; leave room for it.

Growing a volume that already exists depends on your storage class supporting volume expansion. Its storage class
can't be changed once the claim exists.

The **System** tab of the admin console's [Diagnostics](monitoring.md) page shows CPU, memory, pressure and volume
usage, which tell you which of these to raise.

## Run more than one copy of the server

`service.replicas` sets the number of server pods. The chart refuses more than one while any of these volumes is
`ReadWriteOnce`, because a second pod couldn't mount it:

| Volume | To share it |
| --- | --- |
| Message storage | Move it to S3 or an S3-compatible service, or use `ReadWriteMany` storage (`mail.blob.storage.accessMode`) |
| DKIM keys | `mail.dkim.storage.accessMode=ReadWriteMany` |
| PKI | `mail.pki.storage.accessMode=ReadWriteMany` |

You need a storage class that supports `ReadWriteMany`, such as an NFS or CephFS provisioner.

### Message storage on S3

`mail.blob.backend=s3` stops the chart creating the blob volume. Tell the server about the bucket through
`service.config`, for example:

```bash
helm upgrade rapidmx oci://ghcr.io/rapidmx/charts/server --version 1.0.0-beta.43 --namespace rapidmx \
  --reset-then-reuse-values \
  --set mail.blob.backend=s3 \
  --set service.config.mail__blob__backend=s3 \
  --set service.config.mail__blob__s3__bucket=example-rapidmx-mail \
  --set service.config.mail__blob__s3__region=eu-west-1
```

For a service other than AWS S3, also set `mail__blob__s3__endpoint` and, for MinIO and most self-hosted services,
`mail__blob__s3__force_path_style=true`. Credentials come from the AWS credential chain: on AWS, give the server's
ServiceAccount an IAM role with `global.serviceAccount.annotations`. A static key pair (`mail__blob__s3__access_key_id`
and `mail__blob__s3__secret_access_key`) belongs in a Secret, not in `service.config`. See [Server
configuration](configuration.md#message-storage).

:::warning Existing mail
Switching an existing deployment to S3 doesn't move the messages already on the blob volume, and there is no built-in
migration. Choose the backend before you store real mail.
:::

### What changes with several copies

- **Rolling updates.** With only shared volumes, the Deployment rolls pods one at a time instead of stopping the old
  one first, so upgrades no longer cause an outage.
- **Plugin changes** restart the copies one at a time, coordinated through Redis, so the others keep serving.
- **Uploaded plugin packs** are kept in message storage, which is why it must be shared.
- **Postfix** signs with the DKIM keys, so with `ReadWriteOnce` DKIM storage it must run on the server's node; with
  `ReadWriteMany` it can run anywhere.

## Components that run as one copy

| Component | Why |
| --- | --- |
| MongoDB | The bundled MongoDB is `standalone`. The chart can point the server at a database of your own with `global.database.url`; the auth-server subchart has datastore settings of its own. |
| Redis | `standalone`, and holds nothing that can't be rebuilt |
| rspamd, ClamAV | One replica each |
| coturn | A TURN allocation lives in one process, and coturn uses the node's own network. On a cluster with several nodes, pin it with `coturn.nodeSelector`. |

## Client addresses behind a load balancer

The server's rate limits and audit log use each client's real address, taken from `X-Forwarded-For` when the request
comes from an address in `global.trustedProxies` (by default the private ranges). That's only safe where the Gateway
sees the real client address, through the PROXY protocol (as the single-server and AWS installers set up) or
`externalTrafficPolicy: Local`. If your load balancer source-NATs traffic to a private address, narrow
`global.trustedProxies` to the Gateway's pod range.
