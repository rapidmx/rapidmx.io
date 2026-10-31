import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'RapidMX',
  tagline: 'Private, self-hosted mail, calendar and collaboration for your whole organization.',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
    faster: {
      // Same as rapidrest.dev: the rspack bundler panics on `yarn start` (cssExtractHmr.js not
      // found), so bundle with webpack and keep the other faster-mode swaps. rspackPersistentCache
      // requires rspackBundler, so it is off too.
      rspackBundler: false,
      rspackPersistentCache: false,
    },
  },

  // Hosted on GitHub Pages at the custom domain rapidmx.io (see static/CNAME and
  // .github/workflows/deploy.yml).
  url: 'https://rapidmx.io',
  baseUrl: '/',

  organizationName: 'rapidmx',
  projectName: 'rapidmx.io',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    // .md files are plain CommonMark (so `<placeholder>` text in commands is safe); use .mdx only
    // for pages that need components such as <Tabs>.
    format: 'detect',
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'preload',
        href: '/fonts/Blender-Pro-Bold.ttf',
        as: 'font',
        type: 'font/ttf',
        crossorigin: 'anonymous',
      },
    },
  ],

  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        docsRouteBasePath: ['docs', 'developers'],
        docsDir: ['docs', 'developers'],
        indexBlog: false,
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'developers',
        path: 'developers',
        routeBasePath: 'developers',
        sidebarPath: './sidebarsDevelopers.ts',
        editUrl: 'https://github.com/rapidmx/rapidmx.io/tree/main/',
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/rapidmx/rapidmx.io/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo_photo_dark_bg.png',
    metadata: [
      {
        name: 'keywords',
        content:
          'self-hosted email, private email server, Google Workspace alternative, Microsoft 365 alternative, Exchange alternative, S/MIME, OpenPGP, end-to-end encryption, zero-access encryption, calendar, ActiveSync, MAPI',
      },
    ],
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'RapidMX',
      logo: {
        alt: 'RapidMX logo',
        src: 'img/logo.svg',
      },
      items: [
        {to: '/#features', label: 'Features', position: 'left', activeBaseRegex: '^$'},
        {to: '/#compare', label: 'Compare', position: 'left', activeBaseRegex: '^$'},
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'docSidebar',
          sidebarId: 'developersSidebar',
          docsPluginId: 'developers',
          position: 'left',
          label: 'Developers',
        },
        {
          href: 'https://github.com/rapidmx',
          label: 'GitHub',
          position: 'right',
        },
        {
          to: '/docs/getting-started/overview',
          label: 'Get started',
          position: 'right',
          className: 'navbar__cta',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Product',
          items: [
            {label: 'Features', to: '/#features'},
            {label: 'Compare', to: '/#compare'},
            {label: 'Security', to: '/#security'},
            {label: 'FAQ', to: '/#faq'},
          ],
        },
        {
          title: 'Docs',
          items: [
            {label: 'Get started', to: '/docs/getting-started/overview'},
            {label: 'Connect your apps', to: '/docs/clients/overview'},
            {label: 'User guide', to: '/docs/user-guide/mail'},
            {label: 'Administration', to: '/docs/administration/admin-console'},
            {label: 'Operations', to: '/docs/operations/upgrading'},
          ],
        },
        {
          title: 'Developers',
          items: [
            {label: 'Contributor guide', to: '/developers/intro'},
            {label: 'Architecture', to: '/developers/architecture'},
            {label: 'Writing plugins', to: '/developers/plugins/overview'},
          ],
        },
        {
          title: 'Community',
          items: [
            {label: 'GitHub', href: 'https://github.com/rapidmx'},
            {label: 'Issues', href: 'https://github.com/rapidmx/server/issues'},
            {label: 'npm', href: 'https://www.npmjs.com/org/rapidmx'},
            {label: 'RapidREST', href: 'https://rapidrest.dev'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} RapidMX. Open source under the Mozilla Public License 2.0.`,
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml', 'nginx', 'ini', 'powershell', 'dns-zone-file'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
