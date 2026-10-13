---
title: Contributing to this site
description: How the rapidmx.io website is organized, how to write and preview a page, and how changes are deployed.
sidebar_position: 5
---

# Contributing to this site

This website, rapidmx.io, is the documentation for people who run RapidMX, use it, and build on it. It is a
[Docusaurus 3](https://docusaurus.io/) site in its own repository, `rapidmx.io`, and it takes changes the same way the
code does: a branch, a pull request, a review. Fixing a wrong step or a missing setting here helps every
administrator who follows the docs after you.

## How the site is organized

| Path | Served at | For |
| --- | --- | --- |
| `src/pages/index.tsx` | `/` | The landing page. |
| `docs/` | `/docs` | People who **run and use** a server: getting started, connecting clients, the user guide, administration and operations. |
| `developers/` | `/developers` | People who **contribute** to RapidMX or write plugins (this section). |
| `static/` | `/` | Images and other files served as they are. Screenshots are in `static/img/screenshots/`. |

`docs/` and `developers/` are two separate instances of the Docusaurus docs plugin, each with its own sidebar.

**Sidebars are generated from the folders.** You never edit `sidebars.ts` or `sidebarsDevelopers.ts` to add a page.
A folder's label and position come from its `_category_.json`, and a page's position from `sidebar_position` in its
front matter.

Every page starts with front matter like this:

```yaml
---
title: Mail transport
description: One sentence that says what the page covers, used in search results and link previews.
sidebar_position: 3
---
```

## Markdown or MDX

The site detects the format by file extension.

- **`.md` is plain CommonMark.** Use it by default. Text like `<placeholder>` and `{braces}` in prose and commands is
  safe in it.
- **`.mdx` is MDX**, for pages that need React components such as `<Tabs>`. In an `.mdx` file, `<` and `{` in prose
  are parsed as JSX, so escape them.

Both formats support Mermaid diagrams (a ` ```mermaid ` code fence) and admonitions (`:::tip`, `:::note`,
`:::warning`, `:::danger`).

## Links

Link to another page in the same section by its relative file path, including the extension:

```markdown
See [Domains](../administration/domains.md).
```

Docusaurus resolves and checks these. To link between the two sections (from `developers/` to `docs/`, or back), use
the URL path instead, such as `[Docker Compose](/docs/getting-started/docker-compose)`.

Broken links fail the build. That is deliberate: `yarn build` is the link checker.

## Writing guidelines

- **Be accurate.** Every statement about RapidMX must be traceable to the source code, a README or the Helm chart.
  Don't describe features, settings, ports or defaults you haven't checked. UI labels must match the `web-client`
  source exactly.
- **Say when something isn't finished.** If a feature is a preview or unreleased (the native app, the chat plugin),
  say so on the page.
- **Open by explaining.** Before steps, tables or syntax, tell the reader what problem the page solves and when they
  would need it.
- **Write for the section's reader.** `docs/` is for an IT generalist who has run a Linux server or a Kubernetes
  cluster, and its user guide for people with no technical background. `developers/` is for a TypeScript developer
  who has built a backend before. Explain what is specific to RapidMX and RapidREST, not general concepts.
- **Prefer numbered steps** for procedures, and concrete example values (`example.com`, `203.0.113.10`) over
  `<placeholder>` where a real-looking value works.
- **Document one path.** Show the primary way to do something rather than every alternative.
- **Don't repeat sibling pages.** Link to them instead. Reference tables (settings, parameters, environment
  variables) are the exception and stay complete.
- **Keep sentences short.** Use em dashes sparingly; two sentences usually read better.
- **Stick to the facts that are easy to get wrong.** RapidMX has no IMAP or POP3. The RapidMX ACME certificate
  authority is not publicly trusted. Don't compare RapidMX to other products page by page in `docs/`; the landing page
  does that.

## Preview your change

```bash
corepack enable
yarn install
yarn start
```

`yarn start` serves the site at `http://localhost:3000` and reloads as you edit. It doesn't check links, so run a full
build before you open a pull request:

```bash
yarn build
yarn serve   # optional: browse the production build
```

`yarn build` fails on any broken link. Search is built during `yarn build`, so it only works in the production build,
not under `yarn start`.

## How changes are deployed

The site is hosted on GitHub Pages at `https://rapidmx.io`. A GitHub Actions workflow
(`.github/workflows/deploy.yml`) runs `yarn build` on every pull request, so a broken link shows up as a failed check,
and on every push to `main` it builds the site and deploys it. There is no manual publishing step: once your pull
request is merged, the change is live within a few minutes.
