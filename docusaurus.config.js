// @ts-check

import {themes as prismThemes} from 'prism-react-renderer';

const REPO_URL = 'https://github.com/govambam/content-studio-docs';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Content Studio Docs',
  tagline: 'The content pipeline tool, documented',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://docs-production-40b1.up.railway.app',
  baseUrl: '/',
  trailingSlash: false,

  organizationName: 'govambam',
  projectName: 'content-studio-docs',

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: `${REPO_URL}/edit/main/`,
          routeBasePath: 'docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Content Studio Docs',
        logo: {
          alt: 'Content Studio Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            href: REPO_URL,
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {label: 'Introduction', to: '/docs/intro'},
              {label: 'Local dev', to: '/docs/getting-started/local-dev'},
              {label: 'API routes', to: '/docs/api/routes'},
            ],
          },
          {
            title: 'Integrations',
            items: [
              {label: 'Sentry', to: '/docs/integrations/sentry'},
              {label: 'LaunchDarkly', to: '/docs/integrations/launchdarkly'},
            ],
          },
          {
            title: 'More',
            items: [
              {label: 'GitHub', href: REPO_URL},
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Macroscope. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
