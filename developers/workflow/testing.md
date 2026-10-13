---
title: Testing
description: How RapidMX is tested, what coverage each repository enforces, and how to write tests that hold up on both database backends.
sidebar_position: 2
---

# Testing

RapidMX handles other people's mail, so its tests carry a lot of weight. Most repositories hold their code to full
statement, line and function coverage, and CI fails a pull request that drops below the threshold. The goal isn't the
number. It is that every branch of behaviour someone relies on has a test that would notice if it changed.

## Running tests

Every repository uses [Vitest](https://vitest.dev/):

```bash
yarn test          # the whole suite, with coverage
yarn test:watch    # re-run on change, where the repository defines it
yarn vitest run test/routes/BaseMailboxRoute.test.ts   # one file
```

`server` and `acme-server` run their tests through `rapidrest test`. The other repositories call Vitest directly.
Tests need no external services: MongoDB runs in memory (`mongodb-memory-server`), SQL tests use SQLite through
`better-sqlite3`, and Redis is replaced by an in-memory fake.

A test run writes `coverage/` (an HTML report you can open locally, and `lcov.info`, which CI sends to Coveralls) and
`junit.xml`.

## Coverage thresholds

Each repository's `vitest.config.ts` sets its own thresholds, and CI fails when a run falls below them.

| Repositories | Statements, lines, functions | Branches |
| --- | --- | --- |
| `restapi`, `activesync`, `mapi`, `autodiscover`, `booking-plugin`, `meet-plugin`, `crm-plugin` | 100% | 95% |
| `postfix-bridge`, `ses-bridge`, `tauri-client` | 100% | 100% |
| `web-client` | 100% | Slightly under 100% for `apps/` and `lib/`, with each gap explained in the config |
| `server`, `acme-server` | No enforced floor | No enforced floor |

The 95% branch threshold in the libraries is not slack. TypeScript's decorator metadata emits one branch per
`@Inject` or `@Config` field that can only be taken in a broken build, so 100% is unreachable. Every other relaxation
is written down next to the threshold with the reason it exists, and it is not a general excuse to skip branch tests.
If you believe a branch truly can't be reached, explain why in the config, the same way, and expect the reviewer to
check.

`server` has no floor because its frontend code moved to `web-client` and the plugins, which carry the strict
thresholds now. New server code still needs tests.

## Writing tests

### Test real behaviour over HTTP

Route tests start a real server against a real (in-memory) database and make HTTP requests to it. That catches what
unit tests of a single method miss: a route that never mounted, an ACL check in the wrong place, a query that works on
MongoDB and fails on SQL. Mock the edges (outbound mail, scanners, DNS, the blob store) with the test doubles each
repository already has, and keep the database real.

### Cover both backends

Behaviour that has to be identical on MongoDB and SQL is written once as a shared suite (`test/routes/*Suite.ts` in
`restapi`) and run from both a `mongo/` and a `sql/` test file. When you add a feature that stores data, add it to
both, or add a suite. A test that only runs on one backend is a common review comment.

### Keep the access rules tested

In `restapi`, every mailbox-scoped route class must be listed in `test/routes/mailAccessRouteTable.ts` and covered by
the access matrix (`test/routes/mailAccessMatrixSuite.ts`). A guard test fails if a new route is missing from the table
or calls `aclUtils.hasPermission()` directly. This is how the rule that administrators can't read other users' mail
stays true. See [Security](../security.md).

### Mock Redis with the existing fake

The server uses the `redis` package (node-redis), not `ioredis`. Mock it with the in-memory fake in the server's
`test/helpers/FakeRedis.ts`:

```ts
vi.mock("redis", async () => (await import("./helpers/FakeRedis.js")).createFakeRedisModule());
```

### Register providers in server tests

`server`'s `test/Server.mongo.test.ts` and `test/Server.sql.test.ts` build their own server from the config files
rather than importing the real entry points. If you register a new provider by token (`objectFactory.register(X,
"Token")`), register it in those two test files as well, or every route that needs it fails with `No class found with
name: Token`.

### Don't share SQLite files between datastores

`better-sqlite3` takes an exclusive lock per write. Two datastores pointed at the same SQLite file fail at startup with
`database is locked`. Give each datastore in a test config its own file.

## What CI runs

CI runs on every push. In the library repositories the **Build** workflow has three jobs: build and lint, tests with
coverage, and a non-blocking `validate.sh` (dependency audit and license check). `server`'s **CI** workflow adds:

- a Docker image build;
- `helm lint` and a full `helm template` render of the chart with the values an install has to provide;
- smoke tests that start the built image with Docker Compose on MongoDB and on PostgreSQL and wait for it to report
  healthy.

A pull request is ready for review when CI is green. If CI fails and you can't reproduce it locally, read the job's
log rather than guessing: a coverage miss and a flaky test look alike from the outside.
