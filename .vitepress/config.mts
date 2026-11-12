import { defineConfig } from 'vitepress'
import { docsSidebar, guideSidebar, developmentSidebar, developmentNav, downloadsNav, docNav } from '../scripts/nav.mts'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'en-US',
  title: 'Thruk',
  description: 'Thruk is a monitoring web interface for Naemon, Nagios, Icinga and Shinken.',
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon-light.png', media: '(prefers-color-scheme: light)' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon-dark.png', media: '(prefers-color-scheme: dark)' }]
  ],

  srcDir: '.build',
  // Keep existing .html URLs working without server rewrite rules.
  cleanUrls: false,
  // Large pages (changelog, REST API reference) produce chunks over 500 kB.
  vite: { clearScreen: false, build: { chunkSizeWarningLimit: 1024 } },

  themeConfig: {
    logo: { light: '/images/logo-light.svg', dark: '/images/logo-dark.svg', alt: 'Thruk' },
    siteTitle: false,

    nav: [
      { text: 'Home', link: '/' },
      {
        component: 'NavDropdown',
        props: { text: 'Downloads', items: downloadsNav }
      },
      {
        component: 'NavDropdown',
        props: { text: 'Documentation', items: docNav }
      },
      {
        component: 'NavDropdown',
        props: { text: 'Guides', items: guideSidebar }
      },
      { text: 'Screenshots', link: '/screenshots.html' },
      { text: 'Demo', link: '/demo.html' },
      {
        component: 'NavDropdown',
        props: { text: 'Development', items: developmentNav }
      },
      {
        component: 'NavDropdown',
        props: { text: 'Services', items: [
          { text: 'Support', link: '/support.html' },
          { text: 'Mailing List', link: 'https://groups.google.com/group/thruk' }
        ] }
      }
    ],

    outline: [2, 3],

    sidebar: {
      '/documentation/': docsSidebar,
      '/guides/': guideSidebar,
      '/development/': developmentSidebar,
      '/README': developmentSidebar,
      '/naglint': developmentSidebar,
      '/donate': developmentSidebar,
      '/download': downloadsNav,
      '/whatsnew/': downloadsNav,
      '/changelog': downloadsNav,
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/sni/Thruk' }
    ],

    search: {
      provider: 'local'
    }
  }
})
