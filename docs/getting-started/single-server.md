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
- The DNS records from [Before you deploy](before-you-deploy.md), or a supported DNS provider so that the script
  [publishes them for you](#publish-dns-records-automatically), and ports `25`, `80` and `443` open
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
| `--dns-provider <type>` | [Publish DNS records](#publish-dns-records-automatically) through `cloudflare`, `route53`, `rfc2136`, `google` or `azure` |
| `--dns-zone <zone>` | The DNS zone, when `--domain` is below the zone's apex |
| `--dns-credentials-file <file>` | A file of `NAME=value` lines with the provider's credentials |
| `--dns-takeover` | Let the provider replace records that already exist at the names it publishes |
| `--public-address <ip>` | The address to publish for the mail host, replacing the detected one. Repeat it for several. |
| `--openpgpkey-host true\|false\|auto` | Serve `openpgpkey.<domain>`, the OpenPGP Web Key Directory host. `auto` (the default) serves it once its record resolves to the server. |
| `--uninstall --yes` | Remove what the script installed, including the mail data. `--uninstall` alone removes nothing. See [Uninstalling](../operations/uninstalling.md). |
| `--keep-dns` | With `--uninstall`, leave every published record in DNS |
| `--help` | List everything |

Some environment variables change what the script installs:

| Variable | What it does |
| --- | --- |
| `CHART` | The chart to install (default `oci://ghcr.io/rapidmx/charts/server`), for example `./helm` for a local checkout. `--version` is ignored then. |
| `OPENBAO_ADDRESS` | An OpenBao this cluster already runs, used instead of installing one |
| `OPENBAO_VERSION`, `EXTERNAL_SECRETS_VERSION` | The OpenBao chart and External Secrets release to install |
| `K3S_VERSION`, `CERT_MANAGER_VERSION`, `ENVOY_GATEWAY_VERSION` | The pinned releases of those components (defaults `v1.36.5+k3s1`, `v1.21.2` and `v1.9.1`) |
| `DNS_PROVIDER` | The default of `--dns-provider` |
| `OPENPGPKEY_HOST` | The default of `--openpgpkey-host` |
| `DNS_CONTROLLER_TAG`, `DNS_CONTROLLER_DIGEST` | Deploy another DNS controller than the release the chart pins |
| `DNS_CLEANUP_WAIT_SECONDS` | How long `--uninstall` waits for published records to leave DNS (default `600`) |

## Publish DNS records automatically

With `--dns-provider`, the script publishes the DNS records for you, so there is nothing to add at your DNS host. Your
domain's zone must already be at that provider. [DNS publishing](../administration/dns-publishing.md) explains what is
published and how it behaves afterwards.

```bash
./single_node_install.sh --domain example.com --email you@example.com \
  --dns-provider cloudflare --dns-credentials-file ./dns.env
```

Here `dns.env` holds the line `CF_API_TOKEN=<your token>`. Keep it readable only by you. The script reads it as text and
never runs it. You can use the provider's environment variables instead (`sudo` drops them unless you run `sudo -E`).
A credential is never a command-line option.

| `--dns-provider` | Credentials and settings |
| --- | --- |
| `cloudflare` | `CF_API_TOKEN`: a token with Zone:Zone:Read and Zone:DNS:Edit on the zone. If it is restricted by client IP, list every address the server goes out from, IPv4 and IPv6. |
| `route53` | `AWS_REGION` (required), `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (both or neither: with neither, external-dns's IAM role), `EXTERNAL_DNS_AWS_ZONE_TYPE`, `EXTERNAL_DNS_AWS_ASSUME_ROLE` |
| `rfc2136` | `EXTERNAL_DNS_RFC2136_HOST` (required), `EXTERNAL_DNS_RFC2136_PORT`, `EXTERNAL_DNS_RFC2136_ZONE`, `EXTERNAL_DNS_RFC2136_TSIG_KEYNAME`, `EXTERNAL_DNS_RFC2136_TSIG_SECRET`, `EXTERNAL_DNS_RFC2136_TSIG_SECRET_ALG`, `EXTERNAL_DNS_RFC2136_INSECURE`. It can't hold MX, SRV, SPF, DKIM or DMARC records, so those stay manual. |
| `google` | `GOOGLE_APPLICATION_CREDENTIALS` (the path of a service account's key file) and `EXTERNAL_DNS_GOOGLE_PROJECT` |
| `azure` | `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` and `AZURE_RESOURCE_GROUP` |

Only Cloudflare has been tested live so far. The other four are not yet live-tested.

Every option is checked before anything is installed. The final message lists what is published, what stays manual and
why, and any conflicts. Keep these in mind:

- **The mail host's address.** It is published at the machine's global IPv4 addresses, or else the IPv4 address it is
  seen from outside. IPv6 is published only for an address you give with `--public-address`.
- **Existing records.** A record already at a name RapidMX publishes, such as your previous mail provider's MX, is left
  alone and shown as a conflict until you take it over in the admin console. `--dns-takeover` allows that for the whole
  provider from the start.
- **SPF stays manual** until you opt the domain in, because it shares the domain's root TXT records with other services.
- **Domains outside the zone stay manual.** So do a release's existing domains if you add `--dns-provider` later: assign
  each to the provider in the admin console, then run the script again.
- **Pass the same `--dns-*` options on every run that upgrades.** A run without `--dns-provider` turns publishing off.
  After the first run, change the provider's credentials, zones and takeover setting in the admin console; a later run
  doesn't apply them, and says so.
- **Uninstalling.** `--uninstall --yes` deletes the records the DNS controller published, and waits for them to leave
  DNS. A record that was at the provider before RapidMX and was left alone stays. While RapidMX manages a domain's root
  TXT records, it stops with nothing removed and names the domain: opt the domain out in the admin console first.
  `--keep-dns` leaves every record in DNS and skips that check.

## After the install

- **Secrets.** With OpenBao (the default), the release's secrets live in the vault and upgrades don't need them. The
  vault's unseal key and root token are in the `openbao-keys` Secret in the `openbao` namespace. **Back that Secret
  up**: without it nothing in the vault can be recovered. See [Backup and restore](../operations/backup-and-restore.md).
- **Configuration keyring.** It encrypts the credentials saved in the admin console, and a database backup is useless
  without it. **Back it up with the database.** See
  [The configuration keyring](../operations/secrets-and-openbao.md#the-configuration-keyring).
- **Without OpenBao**, the script prints how to read `global.jwt.secret` and `global.mailIngestSecret` back from the
  cluster. You need them to run `helm upgrade` yourself. Re-running the script reuses them automatically.
- **Re-running** the script is safe. It keeps every secret and re-checks nginx, the Gateway and the other pieces, which
  makes it a good way to [upgrade](../operations/upgrading.md): run it again with `--version`.
- **More domains.** Add them in the admin console and assign them to a DNS provider, or publish the DNS records it
  shows. Postfix accepts, sends and signs mail for them within seconds.

## Next steps

- [First-time setup](first-time-setup.md)
- [Backup and restore](../operations/backup-and-restore.md)
- [Video calls: the TURN relay](../operations/video-relay.md), if people will join calls from restrictive networks
