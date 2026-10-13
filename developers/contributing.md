---
title: Contributing
description: How to report a bug, propose a change and get a pull request merged, and how contributions are licensed.
sidebar_position: 7
---

# Contributing

RapidMX is developed in the open on [GitHub](https://github.com/rapidmx), and the same process applies to every
repository. This page covers the path from "I found a problem" to a merged pull request. If you haven't set up a
checkout yet, start with the [development environment](./dev-environment.md).

## Choose the right repository

File issues and pull requests against the repository the problem actually lives in. [Repositories](./repositories.md)
says what each one owns, and [Architecture](./architecture.md) helps you trace a symptom to a component. A few
pointers:

- A page that looks or behaves wrong in the browser is usually `web-client`. If the data it shows is wrong, the cause
  is often in `restapi`.
- A problem with phones or Outlook belongs to the `activesync`, `mapi` or `autodiscover` plugin.
- Deployment, the Helm chart, Docker Compose and the installers live in `server`. Postfix and DKIM signing live in
  `postfix-bridge`.
- Sign-in problems usually belong to the auth-server, in the RapidREST organization.

If you can't tell, open the issue on [`rapidmx/server`](https://github.com/rapidmx/server/issues). It can be moved.

Security vulnerabilities are the exception: never report them in a public issue. See [Security](./security.md).

## Report a bug

A good bug report includes:

- **Steps to reproduce**, as few as possible. A minimal code sample or request is ideal.
- **Expected** and **actual** behaviour, with the full error, stack trace or browser console output.
- **Reproduction rate**, for example 3 out of 3 tries.
- **Severity**: blocker, high, medium or low.
- **Versions**: the package or image version, the `@rapidrest` packages involved, your Node.js version, and for UI
  problems your browser.
- Screenshots and logs where they help. Remove anything private from them first.

```text
Steps to Reproduce:
1. `yarn install` and `yarn dev` in a fresh clone of server
2. Open http://localhost:3000/admin
3. Open Mailboxes

Repro Rate: 3/3

Expected:
The admin console lists existing mailboxes

Actual:
The page renders the error page
// full stack trace / browser console output

Severity: BLOCKER

Project Info:
server: 1.0.0-beta.43
@rapidmx/restapi: 0.33.0
NodeJS: 24.0
```

## Request a feature

Describe the use case, and who it is for. A good request starts with "As a developer, I would like..." or "As an
end user, I would like...":

```text
As an end user I would like the admin console to show each account's last sign-in time and address,
so administrators can audit suspicious activity without querying the database directly.
```

For anything larger than a small change, open an issue and agree on the approach before you write the code. Some
designs aren't possible in RapidMX because of its [security rules](./security.md#design-principles-every-change-must-keep),
and it is better to find that out before you have built one. Consider whether the feature could be a
[plugin](./plugins/overview.md) instead of a change to the core.

## Make the change

1. Create a branch off `main`.
2. Keep the change to one bug or one feature. Several small pull requests are easier to review than one large one.
3. Add or update tests for every behaviour you change, on both database backends where data is involved. Check the
   repository's `vitest.config.ts` for its coverage thresholds. See [Testing](./workflow/testing.md).
4. Follow the [coding standards](./workflow/coding-standards.md) and the
   [commit message format](./workflow/commit-messages.md). Commit messages become the changelog.
5. Update the documentation the change affects: the repository's README, an entry under `## Unreleased` in its
   `RELEASE_NOTES.md` if the change needs explaining, and the pages on this site.
6. Before you push, make sure everything passes:

   ```bash
   yarn install
   yarn build
   yarn test
   ```

Don't bump version numbers or edit `CHANGELOG.md`. Both happen at release time. See [Releasing](./workflow/releasing.md).

## Pull requests

- Say what the change does and why, and link the issue it addresses.
- CI must pass (build, lint and tests) before a pull request can be merged.
- If your change spans repositories, open a pull request in each, link them to each other, and say which must be
  released first. The downstream one raises its dependency range once the upstream one is released; it never contains
  a Yarn patch or a linked sibling. See [Working across repositories](./dev-environment.md#working-across-repositories).
- Every commit in the pull request should follow the commit message format. Merge commits don't reach the changelog,
  but the commits inside the pull request do.

## Code review

The maintainer, Jean-Philippe Steinmetz, reviews pull requests. Expect questions, and expect to be asked for changes.
That is a normal part of the process, not a judgement of the work. Reviews look most closely at:

- **Correctness on both backends**, MongoDB and SQL.
- **The security rules**: no new way for an administrator to read another user's mail, no scanner or verification
  check that fails open, no secrets with usable defaults in production. See [Security](./security.md).
- **Tests that would catch a regression**, not just tests that raise coverage.
- **Where the fix lives.** A workaround in `server` for a bug in `restapi` or RapidREST will usually be sent back to
  the right repository.
- **Upgrade safety.** There are no migration scripts, so a model change must keep existing data working.

Reply to review comments, push follow-up commits to the same branch, and say when the pull request is ready for
another look.

## Licensing

RapidMX's code repositories are licensed under the
[Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/) (MPL-2.0). By submitting a contribution, you
agree that it is licensed under the `LICENSE` of the repository you contribute to.

There is no contributor license agreement to sign, and commits don't need a `Signed-off-by` line. If you add one, the
release tool leaves it out of the changelog.

New source files carry an `SPDX-License-Identifier: MPL-2.0` header. Don't add code copied from projects under
licenses that are incompatible with MPL-2.0. Dependencies are checked for GPL, LGPL, EPL and CPL licenses.

## Attribution

Contributors are recognized in each repository's `CONTRIBUTORS.md`. Add your name in the same pull request as your
first contribution to that repository.

## Questions

If anything here is unclear, open an issue. That is useful feedback on this guide too.
