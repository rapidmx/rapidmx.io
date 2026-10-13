---
sidebar_position: 5
title: Single server (k3s)
description: Install a complete RapidMX server on one Linux machine with a single script that sets up k3s, HTTPS, OpenBao, Postfix and RapidMX.
---

# Single server (k3s)

The single-server installer turns one Linux machine into a complete RapidMX server with one command. Under the hood it
installs [k3s](https://k3s.io/), a small Kubernetes distribution, and then the same Helm chart as the
[Kubernetes](kubernetes.md) option, so you get automatic certificates, Postfix that picks up new domains on its own,
and in-place upgrades, without having to run a cluster yourself.

Use it for a rented VPS, a dedicated server or a machine in your office. If you already run Kubernetes, use the
[Helm chart](kubernetes.md) directly instead.

## What you need

- A Debian, Ubuntu or RHEL-family Linux server with `sudo` and about 8 GiB of memory
- The DNS records from [Before you deploy](before-you-deploy.md), and ports `25`, `80` and `443` open
- No Docker running on the same server. It conflicts with k3s, and the script stops if it finds it.

## What the script installs

In order, and only what isn't already there:

1. **k3s**, without its bundled Traefik. Its admin kubeconfig stays readable by root only; the user who ran the
   script gets a private copy in `~/.kube/config`.
2. **Helm**.
3. **cert-manager**, with Gateway API support, for Let's Encrypt certificates (skipped with `--tls false`).
4. **Envoy Gateway**, and one shared Gateway with a listener per host name.
5. **nginx** on the host, forwarding ports 80 and 443 to the Gateway with the PROXY protocol, so the server sees each
   visitor's real address. Any existing `http` server block listening on port 80 is commented out, and restored by
   `--uninstall`.
6. **OpenBao** and **External Secrets**, which hold the release's secrets and the certificate authority for encrypted
   mail (skipped with `--openbao false`). See [Secrets and OpenBao](../operations/secrets-and-openbao.md).
7. **The RapidMX chart**, as a release named `rapidmx` in the namespace `rapidmx`, with Postfix answering on port 25 as
   `mail.example.com`.

It also opens ports 25, 80, 443 and the TURN ports (3478 TCP and UDP, 5349 TCP, 49152-49252 UDP) in firewalld or ufw
when either is active. It records what it installed in `/var/lib/rapidmx-installer/state`, so `--uninstall` removes
only that.

## Install

1. Point `mail.example.com` and `auth.example.com` at the server's public address.

2. Download the script:

   ```bash
   curl -fsSLO https://raw.githubusercontent.com/rapidmx/server/main/single_node_install.sh
   chmod +x single_node_install.sh
   ```

3. Run it with your domain and an email address for Let's Encrypt:

   ```bash
   ./single_node_install.sh --domain example.com --email you@example.com
   ```

   It takes several minutes and prints each step as it goes.

4. Wait for the final message:

   ```text
   Installation complete.
   The server is at https://mail.example.com, with sign-in at https://auth.example.com.
   Postfix listens on port 25 as mail.example.com and knows example.com. Add each domain in the admin console, ...
   ```

5. Read the `admin` account's password:

   ```bash
   kubectl -n rapidmx get secret rapidmx-authserver-service-secrets -o jsonpath='{.data.default_accounts}' \
     | base64 -d | tr -d '\\' | sed -n 's/.*"password":"\([^"]*\)".*/\1/p'
   ```

6. Open `https://mail.example.com` and continue with [First-time setup](first-time-setup.md).

:::tip Good to know
- The certificates are requested during the install and issued once both names point at the server. You can add the
  DNS records afterwards; `kubectl -n rapidmx get certificate` shows when they're ready.
- To try it without a public domain, use a name that ends in `.local`, such as `--domain example.local`. It serves
  plain HTTP; add both names to your hosts file, as the script reminds you.
:::

## Options

| Option | What it does |
| --- | --- |
| `--domain example.com` | Your mail domain (required) |
| `--email you@example.com` | The Let's Encrypt account address (default `admin@<domain>`) |
| `--mail-host` / `--auth-host` | Change `mail` / `auth` to another label or a whole host name, for example `--mail-host webmail` |
| `--mail-domains a.com,b.com` | The domains Postfix knows when it starts (default: `--domain`). Domains you add in the admin console later need no restart or re-run. |
| `--tls false` | No certificates: plain HTTP, for testing |
| `--openbao false` | Keep secrets in Kubernetes Secrets instead of OpenBao |
| `--gateway shared` / `--gateway chart` | `shared` (the default): one Gateway made by the script, which the release's routes attach to. `chart`: the chart makes a Gateway for each of its hosts. |
| `--version <version>` | Install a specific release (default: the release the script was published with) |
| `--skip-k3s` | Use the cluster `kubectl` already reaches instead of installing k3s |
| `--uninstall --yes` | Remove what the script installed, including the mail data. `--uninstall` alone removes nothing. See [Uninstalling](../operations/uninstalling.md). |
| `--help` | List everything |

Some environment variables change what the script installs:

| Variable | What it does |
| --- | --- |
| `CHART` | The chart to install (default `oci://ghcr.io/rapidmx/charts/server`), for example `./helm` for a local checkout. `--version` is ignored then. |
| `OPENBAO_ADDRESS` | An OpenBao this cluster already runs, used instead of installing one |
| `OPENBAO_VERSION`, `EXTERNAL_SECRETS_VERSION` | The OpenBao chart and External Secrets release to install |
| `K3S_VERSION`, `CERT_MANAGER_VERSION`, `ENVOY_GATEWAY_VERSION` | The pinned releases of those components (defaults `v1.36.5+k3s1`, `v1.21.2` and `v1.9.1`) |

## After the install

- **Secrets.** With OpenBao (the default), the release's secrets live in the vault and upgrades don't need them. The
  vault's unseal key and root token are in the `openbao-keys` Secret in the `openbao` namespace. **Back that Secret
  up**: without it nothing in the vault can be recovered. See [Backup and restore](../operations/backup-and-restore.md).
- **Without OpenBao**, the script prints how to read `global.jwt.secret` and `global.mailIngestSecret` back from the
  cluster. You need them to run `helm upgrade` yourself. Re-running the script reuses them automatically.
- **Re-running** the script is safe. It keeps every secret and re-checks nginx, the Gateway and the other pieces, which
  makes it a good way to [upgrade](../operations/upgrading.md): run it again with `--version`.
- **More domains.** Add them in the admin console and publish the DNS records it shows. Postfix accepts, sends and
  signs mail for them within seconds.

## Next steps

- [First-time setup](first-time-setup.md)
- [Backup and restore](../operations/backup-and-restore.md)
- [Video calls: the TURN relay](../operations/video-relay.md), if people will join calls from restrictive networks
