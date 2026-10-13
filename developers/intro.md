---
title: Developer guide
description: Where to start if you want to contribute code, tests, documentation or plugins to RapidMX.
sidebar_position: 1
---

# Developer guide

RapidMX is a self-hosted mail, calendar and collaboration server. It is written in TypeScript on top of
[RapidREST](https://rapidrest.dev), a decorator-driven framework for REST services, and it is open source under the
Mozilla Public License 2.0. This part of the site is for people who want to change RapidMX itself: fix a bug, add a
feature, write a plugin, improve the tests or improve these docs.

If you want to install and run a server instead, the [operator and user documentation](/docs/) is the place to
start.

## What you can contribute

- **Bug fixes.** Reproduce the problem, write a failing test, fix it. Most fixes land in one repository, but a bug can
  start in the web client and end in the REST API, so expect to read across repositories.
- **Features.** Open an issue first for anything larger than a small change, so the design can be agreed before you
  spend time on it. RapidMX has standing security rules (an administrator never reads another user's mail, scanning
  fails closed) that shape how many features have to be built.
- **Plugins.** Booking pages, video meetings and the CRM are all plugins: npm packages that add API routes, pages,
  navigation and settings to a running server. A plugin is often the right home for a new feature, and you can publish
  one without changing the core at all.
- **Tests.** Most repositories enforce full or near-full coverage. Tests that pin down real behaviour, especially on
  both database backends, are always welcome.
- **Documentation.** This site lives in its own repository and accepts changes the same way the code does.

## How this section is organized

| Page | What it covers |
| --- | --- |
| [Architecture](./architecture.md) | The moving parts, and how a request, a sign-in and a message travel through them. |
| [Repositories](./repositories.md) | Every repository, its npm package and its status. |
| [Development environment](./dev-environment.md) | Prerequisites, cloning the repositories side by side, `yarn dev`, and working across repositories. |
| [Development workflow](./workflow/coding-standards.md) | Coding standards, testing, commit messages, releasing, and contributing to this site. |
| [Writing plugins](./plugins/overview.md) | Building, testing and publishing a plugin. |
| [Internals](./internals/rest-api.md) | Deep dives: the REST API, mail flow, authentication, encryption, protocols and search. |
| [Contributing](./contributing.md) | Issues, pull requests, licensing and code review. |
| [Security](./security.md) | Reporting a vulnerability, and the security rules every change must keep. |

## Before you start

RapidMX builds on RapidREST, so a little of RapidREST's model goes a long way. Classes are wired together by
dependency injection (`@Inject`, `@Config`), HTTP routes are classes with decorated methods (`@Route`, `@Get`,
`@Post`), and data models are decorated classes stored in MongoDB or a SQL database. The RapidREST documentation
covers these in depth:

- [Dependency injection](https://rapidrest.dev/docs/core-concepts/dependency-injection)
- [Routing](https://rapidrest.dev/docs/routing)
- [Server-side React](https://rapidrest.dev/docs/ssr-react)
- [Testing](https://rapidrest.dev/docs/testing)

Then read [Architecture](./architecture.md) and set up a [development environment](./dev-environment.md).

The project is maintained by Jean-Philippe Steinmetz. Questions about direction or design are best asked in an issue
on the repository concerned.
