---
sidebar_position: 5
title: Monitoring
description: Watch a RapidMX server's health with the admin console's Diagnostics page, the status endpoint, Prometheus metrics and logs.
---

# Monitoring

A mail server that quietly stops receiving mail is worse than one that crashes loudly, so it pays to know where to
look. RapidMX gives you four views, from the friendliest to the most automatable:

- the admin console's **Diagnostics** page, for a human looking at one server;
- the **status endpoint**, which load balancers and Kubernetes probe;
- **Prometheus metrics**, for dashboards and alerts;
- the **logs**, live in the admin console or through `kubectl` and `docker compose`.

For problems you've already noticed, see [Troubleshooting](troubleshooting.md).

## The Diagnostics page

Open the admin console and choose **Diagnostics** (`https://mail.example.com/admin/diagnostics`). It has four tabs:

| Tab | What it shows |
| --- | --- |
| **Information** | The server's version and uptime; **Other containers** (mail transport, databases, spam and virus filters, the TURN relay) with their versions and state (**Running**, **Not ready**, **Not found**); the installed plugins; the server's **Environment variables** and effective **Configuration**; and the packages it runs. |
| **Runtime** | The Kubernetes version, distribution and namespace, and the **Nodes** that run this install's pods. |
| **System** | Live figures, sampled every 5 seconds while the tab is open, with the last five minutes as sparklines: the host's CPU, memory, load and disks, the server process's CPU, memory and heap, CPU, memory and I/O **Pressure**, the namespace's CPU and memory per pod, and each volume's usage. |
| **Logs** | The server's log as it's written, with filters by level and a search box. **Start capture** records up to 50,000 lines, whatever the filters show, for download. |

**Download diagnostics report** saves the Information, Runtime and the latest System figures as a JSON file, without
logs, to attach to a support request.

:::note Secrets are never shown
Settings on the server's list of hidden settings (passwords, tokens and keys) are withheld by the server and never
sent to the browser, and so are credentials inside URLs. A plugin's settings aren't included in the report.
:::

### Kubernetes permissions

The Kubernetes parts of the page (the other containers, nodes, the namespace's figures and the volumes) come from the
Kubernetes API, read with the server pod's own ServiceAccount. The chart grants it a read-only `Role` in the release
namespace only (`global.diagnostics.rbac.create`, on by default); the auth-server gets the same for its own page. The
live figures need metrics-server, which k3s includes.

Under Docker Compose, or with the Role turned off, those parts say **Kubernetes information is not available on this
server**. That's expected, and the rest of the page works.

## The status endpoint

`GET /api/status` answers `200` while the server is serving, and `503` while it is draining: during the seconds before
it stops for a shutdown or a plugin change. The chart uses it for the server pod's startup, readiness and liveness
probes, and the Docker image for its health check. A load balancer you run in front of the server should use it too.

```bash
curl -fsS https://mail.example.com/api/status
```

## Prometheus metrics

The server exposes Prometheus metrics at `/api/metrics`, and a single metric at `/api/metrics/<name>`. The endpoint
requires the bearer token of an account with a trusted role (`admin` by default), so scrape it with a token rather
than relying on the pod's `prometheus.io/*` annotations alone.

```yaml
scrape_configs:
  - job_name: rapidmx
    scheme: https
    metrics_path: /api/metrics
    authorization:
      type: Bearer
      credentials_file: /etc/prometheus/rapidmx-token
    static_configs:
      - targets: ["mail.example.com"]
```

## Logs

### In the admin console

The **Logs** tab of the Diagnostics page streams the server's log live. Use it to watch what happens while you
reproduce a problem, and **Start capture** to keep the lines for a bug report.

### On Kubernetes

```bash
kubectl -n rapidmx logs deploy/rapidmx-server-services --since=1h
kubectl -n rapidmx logs deploy/rapidmx-authserver-services --since=1h
kubectl -n rapidmx logs deploy/clamav
kubectl -n rapidmx get pods
kubectl -n rapidmx get events --sort-by=.lastTimestamp
```

### On Docker Compose

```bash
docker compose -p rapidmx -f docker-compose.mongo.yml logs -f server auth-server
```

The log level is `info` in production and `debug` otherwise. Change it with the server setting `logger__level`. See
[Server configuration](configuration.md).

### Warnings to look for at startup

The server checks its own configuration when it starts and says so in its log:

| Message mentions | Meaning |
| --- | --- |
| `mail:security:trusted_authserv_id ... is not set` | No sender is DKIM-verified. Members-only lists drop mail and several features ignore incoming mail. See [Mail transport](mail-transport.md#sender-verification-mailtrustedauthservid). |
| `mail:escrow:audit_hmac_key ... is not set` | The escrow audit log isn't tamper-evident. |
| `mail__transport__ingest__secret ... is shorter than 16 characters` | Replace the ingest secret, on the server and on the MTA bridge. |
| `Refusing to start ... with empty or default development secret(s)` | Set the named secrets, see [Secrets and OpenBao](secrets-and-openbao.md). |

## What to keep an eye on

- **Volume usage** on the System tab, especially message storage. When it fills up, mail can't be stored.
- **Other containers**: ClamAV restarting, or rspamd not ready, affects every message (see
  [Troubleshooting](troubleshooting.md#spam-or-virus-scanner-down)).
- **Certificates**: `kubectl -n rapidmx get certificate` should show `READY True`. cert-manager renews them 15 days
  before they expire.
- **Signing certificate requests** that stall: the admin console's **Signing Certificates** page lists them with their
  last error. See [Encryption and certificates](../administration/encryption-and-certificates.md).
- **The audit log** and **quarantine**: see [Quarantine and audit log](../administration/quarantine-and-audit-log.md).
