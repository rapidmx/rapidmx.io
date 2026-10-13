# rapidmx.io

The source of [rapidmx.io](https://rapidmx.io): the RapidMX landing page, the user and operator
documentation (`/docs`) and the contributor guide (`/developers`). It is built with
[Docusaurus](https://docusaurus.io/) and deployed to GitHub Pages on every push to `main`.

## Working on the site

You need Node.js 24 or later and Yarn (enabled with `corepack enable`).

```bash
yarn install
yarn start      # dev server with live reload at http://localhost:3000
yarn build      # production build into build/; also checks every link
yarn serve      # serve the production build locally
```

`yarn build` fails on any broken link, so run it before opening a pull request. Search only works
in a production build (`yarn build && yarn serve`), not under `yarn start`.

## Layout

| Path | What it is |
| --- | --- |
| `src/pages/index.tsx` | The landing page |
| `src/css/custom.css` | Site-wide theme (RapidMX colours and fonts) |
| `docs/` | Install, connect, use, administer and operate a RapidMX server (`/docs`) |
| `developers/` | Contributing to RapidMX and writing plugins (`/developers`) |
| `static/` | Images, fonts and `CNAME` |

Sidebars are generated from the folder structure. Order pages with `sidebar_position` front matter
and folders with their `_category_.json`. Write pages as `.md` (plain CommonMark, so `<placeholder>`
text is safe) and use `.mdx` only when a page needs a React component such as `<Tabs>`.

See [`developers/workflow/documentation.md`](developers/workflow/documentation.md) for the writing
style.

## License

[MPL-2.0](https://www.mozilla.org/MPL/2.0/), the same as RapidMX.
