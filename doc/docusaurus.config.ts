import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'kumiko-gen',
  tagline: 'kumiko-gen documentation',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  url: 'https://kumiko-gen.netlify.app',
  baseUrl: '/pj/kumiko-gen/doc/',

  onBrokenLinks: 'ignore',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'ignore',
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
          beforeDefaultRemarkPlugins: [
            [require('./plugins/remark-creation-date.js'), {}],
          ],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'kumiko-gen',
      logo: {
        alt: 'kumiko-gen Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'kumikoGenSidebar',
          position: 'left',
          label: 'kumiko-gen',
        },
        {
          type: 'docSidebar',
          sidebarId: 'viewerSidebar',
          position: 'left',
          label: 'kumiko-gen-viewer',
        },
        {
          type: 'docSidebar',
          sidebarId: 'svgToPngSidebar',
          position: 'left',
          label: 'svg-to-png',
        },
        {
          type: 'docSidebar',
          sidebarId: 'changelogSidebar',
          position: 'left',
          label: 'Changelog',
        },
        {
          type: 'docSidebar',
          sidebarId: 'inboxSidebar',
          position: 'left',
          label: 'INBOX',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} kumiko-gen. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
