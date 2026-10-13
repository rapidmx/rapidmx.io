---
sidebar_position: 2
title: Before you deploy
description: The domain, DNS records, open ports, reverse DNS and hardware a public RapidMX server needs before you install it.
---

# Before you deploy

A mail server is only useful if the rest of the internet can find it and trusts it. That depends on things outside
RapidMX: your domain's DNS, your hosting provider's firewall and port policy, and the reverse DNS of your server's
address. Getting these right *before* you install saves you from the most common first-day problems: HTTPS
certificates that never issue, mail that can't leave the server, and mail that arrives in recipients' spam folders.

This page applies to the [Kubernetes](kubernetes.md), [single server](single-server.md) and [AWS](aws.md) options, and
to Docker Compose when you run it in production. Docker Compose on your own computer needs none of it.

## A domain you control

Pick the domain your addresses will use, for example `example.com`, so mail is addressed to `you@example.com`. You
need to be able to create DNS records for it. RapidMX derives its own host names from this domain:

| Host name | What it serves |
| --- | --- |
| `mail.example.com` | The web app, the admin console, Exchange ActiveSync and MAPI. Also the name Postfix uses as your MX host. |
| `auth.example.com` | The sign-in page and account settings (the auth-server). |

Every installer lets you change the `mail` and `auth` labels if those names are already taken. You can host more mail
domains later from the same server; you add them in the admin console after the install.

## Two DNS records, created first

Point both host names at the server's public address **before** you install, so the HTTPS certificates can be issued
during the install:

```text
mail.example.com.   A   203.0.113.10
auth.example.com.   A   203.0.113.10
```

Add matching `AAAA` records if the server has an IPv6 address. On AWS you create `CNAME` records pointing at the load
balancer instead, or let the stack create them in a Route 53 hosted zone.

The mail records for your domain (MX, SPF, DKIM, DMARC and an ownership record) come later. RapidMX generates them for
you in the setup wizard, see [First-time setup](first-time-setup.md).

:::tip Good to know
Let's Encrypt limits how many certificates it issues for the same names each week. Avoid installing over and over
against a real domain while you experiment. For a throwaway test, the single-server installer accepts a domain ending
in `.local`, which serves plain HTTP and requests no certificates.
:::

## Ports

Open these ports to the internet in every firewall and cloud security group between the internet and the server:

| Port | Protocol | Used for |
| --- | --- | --- |
| `80` | TCP | HTTP, the redirect to HTTPS, and Let's Encrypt's HTTP-01 challenge |
| `443` | TCP | HTTPS: the web app, sign-in, ActiveSync, MAPI and Autodiscover |
| `25` | TCP | SMTP: mail to and from other mail servers (not needed on AWS, where SES handles mail) |
| `3478` | TCP and UDP | TURN, for video calls (Kubernetes and single server, when the bundled TURN server is on) |
| `5349` | TCP | TURN over TLS, for video calls |
| `49152`-`49252` | UDP | TURN relay ports, for video calls |

The TURN ports are only needed for video calls through restrictive networks. See [Video calls: the TURN
relay](../operations/video-relay.md). The single-server installer opens all of these in the host firewall (firewalld
or ufw) for you, but not in your hosting provider's firewall.

## Outbound port 25

Many hosting providers block **outgoing** connections to port 25 by default to stop spam from compromised servers.
Without outbound port 25, your server can receive mail but can't deliver any. Check your provider's documentation and
request that the block be lifted before you go live. On AWS this doesn't apply, because outgoing mail goes through
Amazon SES.

## Reverse DNS (PTR)

Set a reverse DNS record for the server's public address that points back to `mail.example.com`. You set it at your
hosting provider, usually in the control panel for the server or its IP address, not at your DNS provider. It isn't
strictly required, but mail from servers without one is often treated as spam.

## Hardware

| Deployment | What it needs |
| --- | --- |
| Docker Compose (trying it out) | Docker with Compose v2.20 or later, Git and a few GiB of free memory. ClamAV alone uses about 1 GiB. |
| Single server (k3s) | A Debian, Ubuntu or RHEL-family Linux server with `sudo` and about 8 GiB of memory. No Docker running on it, because it conflicts with k3s. |
| AWS | The stack's default instance type is `t3.large`. 8 GiB of memory is the practical minimum. |
| Kubernetes | Enough capacity for the requests in the [Helm chart reference](../operations/helm-chart.md): the server requests 512 MiB, MongoDB 512 MiB and ClamAV 1 GiB of memory, plus the auth-server, Redis, rspamd, Postfix and the TURN server. |

Message storage grows with your mail. The chart's default message volume is 20 GiB (`mail.blob.storage.size`), which
you can raise before the first install. A volume's size can't always be changed afterwards, depending on your storage
class.

## Checklist

Before you install, confirm that:

1. `mail.example.com` and `auth.example.com` resolve to the server (`dig +short mail.example.com`).
2. Ports `80` and `443` are reachable from the internet, and `25` too unless you're on AWS.
3. Your hosting provider allows outbound connections to port 25, or you're using SES.
4. The PTR record for the server's address is `mail.example.com`.

Then continue with the option you chose in [Choose a deployment](overview.md).
