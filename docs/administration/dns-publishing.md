---
sidebar_position: 2.5
title: Automatic DNS
description: Connect a DNS provider so RapidMX publishes and maintains each domain's DNS records, and see which records stay manual, how conflicts work and how SPF is handled.
---

# Automatic DNS

Every mail domain needs a handful of DNS records, and a typo in any of them means lost mail or failed sign-ins. Automatic DNS removes that step: you connect your DNS hosting account once, and RapidMX publishes each domain's records and keeps them up to date. Add a domain in the console and it can start receiving mail without a trip to your DNS host. New DKIM keys are published for you when they [rotate](../operations/mail-transport.md).

It's optional. A domain with no provider stays **manual**, and its [DNS setup checklist](domains.md#the-dns-setup-checklist) shows the records to add yourself. You can use both on one server.

## Where it's available

Publishing runs on Kubernetes, through [external-dns](https://github.com/kubernetes-sigs/external-dns) and a small DNS controller:

| Deployment | How to turn it on |
| --- | --- |
| **Single server** | Pass `--dns-provider` to the installer. See [Single server](../getting-started/single-server.md). |
| **Kubernetes** | Set `dns.publishing.enabled=true` and `dns.publicAddresses`, and install external-dns's `DNSEndpoint` custom resource definition, which the chart doesn't ship. See [Helm chart](../operations/helm-chart.md). |
| **AWS, Docker Compose** | Not available. Publish the records by hand. |

## Supported providers

| Provider | Status | Limits |
| --- | --- | --- |
| **Cloudflare** | Tested live | Records are never proxied. A token restricted by client IP must list every address the server goes out from, IPv4 and IPv6. |
| **Amazon Route 53** | Not yet live-tested | Uses access keys, or with none, an IAM role on the external-dns ServiceAccount. |
| **Google Cloud DNS** | Not yet live-tested | |
| **Azure DNS** | Not yet live-tested | Holds one value per TXT name, so a domain with other values to keep at its root can't opt in to SPF. |
| **RFC 2136** (BIND and other DNS servers) | Not yet live-tested | Can't hold MX or SRV records, or SPF, DKIM and DMARC values, so those stay manual. |

## Connect a provider

1. Open **Integrations**, then **DNS providers**, and choose **+ New DNS provider**.
2. Choose the **Type**, give it a **Name**, and list the DNS **Zones** it serves.
3. Fill in its **Credentials**. They are saved encrypted and never shown again. The encryption key is the [configuration keyring](../operations/secrets-and-openbao.md), which you must back up with your database.
4. Leave **Publish through this provider** ticked, and save.
5. Choose **Test connection** on the provider's page to check the credentials.

The single-server installer does this for you when you give it `--dns-provider`.

## Assign a domain

1. Open the domain under **Domains**.
2. Under **DNS provider**, choose the provider. RapidMX offers the one whose zone covers the domain most specifically, and **Manual: I publish the records myself**.
3. Save, then watch the **Published** column in the checklist.

Moving a domain to another provider removes what the old provider published, until the new one has published it again. Domains the installer created are assigned already.

## What gets published

| Record | Name | Published |
| --- | --- | --- |
| Ownership | `_rapidmx-verify.example.com` | Always, and kept after the domain is verified |
| MX | `example.com` | `10 mail.example.com` |
| DKIM | `<selector>._domainkey.example.com` | The active key, plus the next and previous ones during a rotation |
| DMARC | `_dmarc.example.com` | As the checklist recommends |
| OpenPGP keys | `openpgpkey.example.com` | A CNAME to the mail host |
| Autodiscover | `autodiscover.example.com` and `_autodiscover._tcp.example.com` | While the Autodiscover plugin is active |
| SPF | `example.com` | **Only after you [opt in](#spf-and-the-root-txt-records)** |

The server's own host names are published too, through whichever provider's zones cover them: `mail.` and `auth.` as address records, and `autodiscover.` and `openpgpkey.` as CNAMEs to the mail host.

Reverse DNS (PTR) is never published, because it belongs to your IP address. Set it at your hosting provider. See [Before you deploy](../getting-started/before-you-deploy.md).

## Read the checklist

The **Published** column says what RapidMX is doing with each record. The **Status** column is still the live check against public DNS, and it's the one that says whether a record works.

| Published | Means |
| --- | --- |
| **Automatic: published** | RapidMX published the record. |
| **Automatic: pending** | It's on its way. |
| **Automatic: conflict** | Something else is at that name. See [Existing records](#existing-records). |
| **Manual** | You need to add it yourself. The reason is shown: no provider, a name outside the provider's zones, a kind of record the provider can't hold, or SPF not opted in. |

## Existing records

RapidMX only changes records it created, so a record already at a name it wants, such as the MX of your previous mail provider, is left alone and shown as a conflict with its value. You have two ways forward:

- **Take over** on the checklist row replaces that record, after you confirm. For the server's own host names, use **Take over host names** on the provider's page.
- **Allow taking over existing records** on the provider does this automatically, a few minutes after a conflict is found. The installer's `--dns-takeover` sets it from the start.

After a takeover, RapidMX owns the whole record set at that name and type. A value you add there by hand is removed at the next sync.

A record of a **different type** at the name, such as a CNAME where RapidMX publishes addresses, is never taken over. Delete it at your DNS host. The conflict lists what to delete.

## SPF and the root TXT records

SPF is a TXT record at the root of the domain, shared with the verification records of other services. RapidMX never touches that set on its own, so SPF stays manual until you opt in.

1. On the domain's page, find **Root TXT records** and review what's there now.
2. List the values to keep, one per line.
3. Choose **Manage the root TXT records** and confirm. The confirmation shows what is published and what is removed.

RapidMX then publishes your SPF record if it already allows the domain's mail servers, or `v=spf1 mx ~all`, plus the values you kept.

:::warning
While a domain is managed, this list is the only place to edit its root TXT records. Anything you add at your DNS host is removed within a minute.
:::

**Stop managing** hands the records back as plain ones you edit at your DNS host. They are missing for a few minutes while that happens. A managed domain can't move to another provider until you stop managing it.

## Turn it off

Remove the publishing while the DNS controller is still running: unassign the domains or delete the provider, and the controller deletes the records it published and then its own instances. Only then turn publishing off in the chart. Anything left behind has to be removed by hand, as [Helm chart](../operations/helm-chart.md) explains.

To stop publishing but leave the records in place, untick **Publish through this provider**.

## Related

- [Domains](domains.md): adding domains and the DNS checklist
- [Mail transport](../operations/mail-transport.md): DKIM signing and rotation
- [Secrets and OpenBao](../operations/secrets-and-openbao.md): the keyring that protects provider credentials
