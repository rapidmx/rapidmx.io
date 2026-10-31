---
title: Automatic setup (Autodiscover)
description: How phones and Outlook find your RapidMX server from just an email address, and the DNS records that make it work.
sidebar_position: 6
---

# Automatic setup (Autodiscover)

When someone adds their work account to a phone or to Outlook, they type an email address and a password, and the app works out the rest. The part that "works out the rest" is **Autodiscover**: the app asks a well-known address at the email domain where the account's server is, and RapidMX answers with the addresses of its Exchange ActiveSync and MAPI over HTTP endpoints.

Without Autodiscover, people have to type the server name by hand, which most phone setup screens hide behind an extra step and Outlook barely supports at all. With it, adding an account takes the email address and an [app password](app-passwords.md).

Autodiscover is a plugin, installed by default alongside the ActiveSync and MAPI plugins. It only advertises the protocols whose plugins are installed: if you removed the MAPI plugin, Autodiscover stops pointing Outlook at it.

## What you need

Two things have to be in place for each mail domain:

1. **The plugin knows your server's public address.** In the admin console, open **Plugins**, find **Autodiscover** and click **Settings**. **Public server URL** must be the `https://` address people reach the server at, for example `https://mail.example.com`. It is filled in with the server's address when the plugin is installed, and the Helm chart sets it to its `host`. Nothing is advertised until it is set.
2. **A DNS record that leads to the server.** A mail app looks for Autodiscover under the domain half of the email address. For `alex@example.com` that means `autodiscover.example.com` or an SRV record at `_autodiscover._tcp.example.com`. Add one of these for every domain you host.

## Add the DNS record

With a DNS provider connected, RapidMX publishes these records for you. See [Automatic DNS](../administration/dns-publishing.md). Otherwise, each domain's page in the admin console has a DNS setup checklist. While the Autodiscover plugin is installed, the checklist includes two extra rows, **Autodiscover (CNAME)** and **Autodiscover (SRV)**, with the exact values to copy. You only need one of them.

| Type | Name | Value |
| --- | --- | --- |
| `CNAME` | `autodiscover.example.com` | `mail.example.com` |
| `SRV` | `_autodiscover._tcp.example.com` | priority `0`, weight `0`, port `443`, target `mail.example.com` |

Which one to choose:

- **The CNAME** needs `autodiscover.example.com` to be covered by your server's TLS certificate, because the app connects to that name over HTTPS. The Helm chart already requests a certificate for `autodiscover.<global.domain>` and answers on that name, so for your main domain the CNAME works as installed. For any additional domain you host, the certificate does not cover `autodiscover.<that domain>`.
- **The SRV record** points at your server's own name, which its certificate already covers, so it needs no extra certificate. The checklist recommends it whenever getting a second certificate is hard, which makes it the simpler choice for additional domains.

After you add the record, click **Verify now** on the domain's page. The row shows **Live** once the record is found. DNS changes can take a few minutes to appear. See [Domains](../administration/domains.md) for the rest of the checklist.

## What Autodiscover answers

You don't need these details to set it up, but they help when you are troubleshooting:

- `POST /autodiscover/autodiscover.xml` is the classic request. A phone asks for the ActiveSync answer and gets the address of `/Microsoft-Server-ActiveSync`. Outlook for Windows asks for its own answer and gets the MAPI over HTTP addresses (`/mapi/emsmdb` and `/mapi/nspi`).
- `GET /autodiscover/autodiscover.json/v1.0/alex@example.com?Protocol=ActiveSync` is the newer JSON form, used by some apps. It only answers for ActiveSync.
- Both are deliberately open without signing in. They only answer for addresses that belong to a real mailbox (including aliases), and the answer contains nothing but your server's public addresses. Reading mail still needs a valid sign-in.

## If it doesn't work

- **The app asks for a server name.** Autodiscover didn't answer. Check that the domain's checklist shows an Autodiscover row as **Live**, and that **Public server URL** is set. You can also type the server name (for example `mail.example.com`) into the app yourself.
- **A certificate warning when using the CNAME.** The certificate does not cover `autodiscover.<domain>`. Switch that domain to the SRV record.
- **Sign-in fails after the server is found.** That is not an Autodiscover problem. Check the [app password](app-passwords.md).
