---
sidebar_position: 11
title: Uninstalling
description: Remove a RapidMX deployment, and decide deliberately whether its mail, keys and secrets go with it.
---

# Uninstalling

Removing RapidMX is two separate decisions: removing the software, and deleting the data. RapidMX keeps them apart on
purpose. A plain `helm uninstall` leaves the mail, the DKIM keys and the encryption CA behind, so an accidental
uninstall can't destroy your organization's mail. Deleting the data is a step you take explicitly, and can't be
undone.

Before you delete anything, take a final [backup](backup-and-restore.md), and export any mailboxes people want to keep
(see [Import and export](../user-guide/import-export.md)). If other people's mail depends on the server, point your
domains' MX records somewhere else first.

## Single server (k3s)

The installer records what it installed, and removes only that:

```bash
./single_node_install.sh --uninstall --yes
```

`--uninstall` alone removes nothing and explains what `--yes` would delete. With `--yes`:

- **If the script installed k3s**, it removes k3s, and with it the whole cluster: RapidMX, its data, OpenBao and
  everything else in it.
- **If k3s was already there**, it removes the RapidMX release **and its data volumes**, OpenBao (with its unseal key
  and everything the vault held), External Secrets and cert-manager, but only the ones it installed.
- It removes its nginx configuration and restores the `http` server blocks it had commented out, removes nginx if it
  installed it, and removes the firewall rules it added.

If the install publishes [DNS records automatically](../administration/dns-publishing.md), it also deletes the records
the DNS controller published and waits up to ten minutes for them to leave DNS. A record that was at the provider before
RapidMX and was left alone stays. `--keep-dns` leaves every record in DNS instead.

:::warning Before you run it
- **Domains managing their root TXT records.** While RapidMX manages a domain's [root TXT records](../administration/dns-publishing.md#spf-and-the-root-txt-records),
  the script stops with nothing removed and names the domain. Choose **Stop managing** on the domain's page first, which
  puts its SPF record and kept values back, then run it again. `--keep-dns` skips this check.
- **The configuration keyring.** A k3s cluster the script installed is removed whole, [keyring](secrets-and-openbao.md#the-configuration-keyring)
  included. Save it first if you are keeping the database. The script says whether the keyring is kept.
:::

The kubeconfig in `~/.kube/config` is left in place; delete it if it only held this cluster.

## Kubernetes (Helm)

1. Uninstall the release:

   ```bash
   helm uninstall rapidmx -n rapidmx
   ```

   This removes the pods, Services, Gateways and Secrets, but **keeps** these claims
   (`mail.storage.keepOnUninstall` and the MongoDB subchart's `persistence.resourcePolicy`):

   ```bash
   kubectl -n rapidmx get pvc
   ```

   | Claim | Holds |
   | --- | --- |
   | `rapidmx-server-dkim-keys` | DKIM private keys |
   | `rapidmx-server-blob-data` | Message bodies and attachments |
   | `rapidmx-server-pki-data` | The encryption CA's key |
   | `mongodb` | The database |

2. To delete the data for good, delete the claims:

   ```bash
   kubectl -n rapidmx delete pvc rapidmx-server-dkim-keys rapidmx-server-blob-data rapidmx-server-pki-data mongodb
   ```

   Whether the underlying volumes are deleted too depends on your storage class's reclaim policy.

3. Delete the namespace if nothing else lives in it:

   ```bash
   kubectl delete namespace rapidmx
   ```

:::warning Reinstalling under the same name
Helm won't adopt a claim it didn't create. Delete the kept claims before installing a release of the same name in the
same namespace again, or restore into a fresh installation as described in [Backup and restore](backup-and-restore.md).
:::

cert-manager, your Gateway controller, OpenBao and External Secrets are yours to remove separately; the chart didn't
install them.

## AWS

Delete the ses-bridge stack for each mail domain, then the RapidMX stack:

```bash
aws cloudformation delete-stack --stack-name rapidmx
```

`bootstrap.sh` has no uninstall of its own. Load balancers and EBS volumes that Kubernetes created on the instance are
not resources of the stack; check the EC2 console for any left behind and delete them. Remove the SES identities and
the SES SMTP user if you no longer need them, and the DNS records.

## Docker Compose

Stop and remove the containers, keeping the volumes:

```bash
docker compose -p rapidmx -f docker-compose.mongo.yml down
```

To delete the data as well, add `-v`. This removes every message, key and account:

```bash
docker compose -p rapidmx -f docker-compose.mongo.yml down -v
```

If postfix-bridge runs in the same project, bring it down from its own checkout too
(`docker compose -p rapidmx down`, with `-v` to delete its DKIM and TLS volumes).

## After uninstalling

- Remove or change the DNS records: `mail`, `auth`, and each domain's MX, SPF, DKIM, DMARC, ownership and Autodiscover
  records.
- Revoke anything you created for the deployment elsewhere: an SES SMTP user, IAM roles, firewall rules at your hosting
  provider.
- Keep the final backup, and its escrow audit key, for as long as your retention rules require.
