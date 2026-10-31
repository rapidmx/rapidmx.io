---
title: Repositories
description: Every RapidMX repository and the RapidREST framework repositories it builds on, with their packages and status.
sidebar_position: 3
---

# Repositories

RapidMX is split across many repositories under the [`rapidmx`](https://github.com/rapidmx) GitHub organization, plus
the [`rapidrest`](https://github.com/rapidrest) framework it is built on. Each repository is versioned and released on
its own and depends on the others through published npm packages, not a monorepo workspace. A change that spans
repositories is therefore released in dependency order: `restapi` first, then `web-client`, then the plugins, then
`server`. See [Releasing](./workflow/releasing.md).

Use this page to find where a piece of code lives. [Architecture](./architecture.md) explains how the pieces fit
together at runtime.

## RapidMX

### The core

| Repository | Package | What it is | Status |
| --- | --- | --- | --- |
| [server](https://github.com/rapidmx/server) | Image `ghcr.io/rapidmx/server`, chart `oci://ghcr.io/rapidmx/charts/server` | The mail server a deployment runs: mounts the REST API, renders the web pages, loads plugins. Also holds the Docker Compose files, the Helm chart, the k3s installer and the AWS CloudFormation template. | Beta (`1.0.0-beta` series) |
| [restapi](https://github.com/rapidmx/restapi) | [`@rapidmx/restapi`](https://www.npmjs.com/package/@rapidmx/restapi) | The core library: data models, REST routes, ingestion, scanning, search, encryption, escrow and compliance. | Published, `0.x` |
| [web-client](https://github.com/rapidmx/web-client) | [`@rapidmx/web-client`](https://www.npmjs.com/package/@rapidmx/web-client) | The webmail, admin console and escrow console pages, plus `lib/`: API clients, hooks and generic UI components. | Published, `0.x` |

### Plugins

| Repository | Package | What it is | Status |
| --- | --- | --- | --- |
| [activesync](https://github.com/rapidmx/activesync) | [`@rapidmx/activesync-plugin`](https://www.npmjs.com/package/@rapidmx/activesync-plugin) | Exchange ActiveSync for phones and tablets: mail, contacts, calendar and tasks, with remote wipe. | Published, installed by default |
| [mapi](https://github.com/rapidmx/mapi) | [`@rapidmx/mapi-plugin`](https://www.npmjs.com/package/@rapidmx/mapi-plugin) | MAPI over HTTP for Outlook on the desktop. | Published, installed by default |
| [autodiscover](https://github.com/rapidmx/autodiscover) | [`@rapidmx/autodiscover-plugin`](https://www.npmjs.com/package/@rapidmx/autodiscover-plugin) | Autodiscover, so ActiveSync and Outlook clients configure themselves from an e-mail address. | Published, installed by default |
| [booking-plugin](https://github.com/rapidmx/booking-plugin) | [`@rapidmx/booking-plugin`](https://www.npmjs.com/package/@rapidmx/booking-plugin) | Public booking pages that schedule meetings against a mailbox's calendar. | Published, installed by default |
| [meet-plugin](https://github.com/rapidmx/meet-plugin) | [`@rapidmx/meet-plugin`](https://www.npmjs.com/package/@rapidmx/meet-plugin) | Peer-to-peer WebRTC video meetings, joinable from a calendar invite or a shared link. | Published |
| [crm-plugin](https://github.com/rapidmx/crm-plugin) | [`@rapidmx/crm-plugin`](https://www.npmjs.com/package/@rapidmx/crm-plugin) | Customer relationship management and marketing: contacts, companies, mailing lists, forms and templates. | Published, early (`0.2`) |
| chat-plugin | `@rapidmx/chat-plugin` | Real-time rich-text chat. | Preview. Not yet on GitHub or npm. |

### Mail transport

| Repository | Package | What it is | Status |
| --- | --- | --- | --- |
| [postfix-bridge](https://github.com/rapidmx/postfix-bridge) | Image `ghcr.io/rapidmx/postfix-bridge`, chart `oci://ghcr.io/rapidmx/charts/postfix-bridge` | Postfix plus a small bridge service that connects it to the server's `/internal/mta` ingest contract. Bundled with the server's Helm chart. | Released |
| [ses-bridge](https://github.com/rapidmx/ses-bridge) | `@rapidmx/ses-bridge` | Amazon SES transport: an outbound `MailTransport` and a CDK stack for inbound mail. | Early (`0.1`), not yet on npm |

### Other services and clients

| Repository | Package | What it is | Status |
| --- | --- | --- | --- |
| [dns-controller](https://github.com/rapidmx/dns-controller) | Image `ghcr.io/rapidmx/dns-controller` | Publishes the DNS records a deployment and its domains need through external-dns. The server's chart templates it and pins its version. | Early (`0.1`), image only |
| [acme-server](https://github.com/rapidmx/acme-server) | Image `ghcr.io/rapidmx/acme`, chart `oci://ghcr.io/rapidmx/charts/acme` | A standalone ACME certificate authority for S/MIME certificates, planned for `acme.rapidmx.io`. Its root is not in any public trust store. | Early (`0.x`), private npm package |
| [tauri-client](https://github.com/rapidmx/tauri-client) | None (an app) | The native desktop and mobile app, built with Tauri v2 (Rust plus the web-client pages). | Preview. Not packaged or signed yet. |
| [react-shared](https://github.com/rapidmx/react-shared) | [`@rapidmx/react-shared`](https://www.npmjs.com/package/@rapidmx/react-shared) | Former shared React library. | Merged into `@rapidmx/web-client` as its `lib/` directory. Nothing builds here any more. |
| rapidmx.io | None (a website) | This website. See [Contributing to this site](./workflow/documentation.md). | Not yet on GitHub |

A customer's branding (header, footer and stylesheet files uploaded through the admin console) is configuration, not
code, and is not kept in any of these repositories.

## RapidREST

RapidMX is built on the RapidREST framework, which has the same maintainer. When a bug turns out to be in the
framework, fix it there rather than working around it in RapidMX. The framework is documented at
[rapidrest.dev](https://rapidrest.dev).

| Repository | Package | What RapidMX uses it for |
| --- | --- | --- |
| [core](https://github.com/rapidrest/core) | [`@rapidrest/core`](https://www.npmjs.com/package/@rapidrest/core) | Dependency injection, configuration, logging and shared utilities. |
| [service-core](https://github.com/rapidrest/service-core) | [`@rapidrest/service-core`](https://www.npmjs.com/package/@rapidrest/service-core) | The HTTP server, routes, models and datastores, ACLs, background jobs, the `/push` WebSocket and test helpers. |
| [react](https://github.com/rapidrest/react) | [`@rapidrest/react`](https://www.npmjs.com/package/@rapidrest/react) | Server-side rendering of the web-client pages, hydration and the client-side router. |
| [auth](https://github.com/rapidrest/auth) | [`@rapidrest/auth`](https://www.npmjs.com/package/@rapidrest/auth) | The authentication library the auth-server is built from. |
| [auth-server](https://github.com/rapidrest/auth-server) | Image `ghcr.io/rapidrest/auth-server` | The sign-in service every RapidMX deployment runs. |
| [cli](https://github.com/rapidrest/cli) | [`@rapidrest/cli`](https://www.npmjs.com/package/@rapidrest/cli) | The `rapidrest` command: `dev`, `build`, `test` and `release`. |
| [rapidrest.io](https://github.com/rapidrest/rapidrest.io) | None (a website) | The rapidrest.dev documentation site. |

The `rapidrest/mail` and `rapidrest/mail-server` repositories are the predecessors that RapidMX was split out of. New
work does not go there.

## Licenses

Every RapidMX code repository listed above, and the RapidREST libraries RapidMX depends on, is licensed under the
[Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/). See [Contributing](./contributing.md#licensing)
for what that means for your contributions.
