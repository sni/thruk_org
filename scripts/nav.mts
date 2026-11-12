import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const stage = resolve(dirname(fileURLToPath(import.meta.url)), '..', '.build')
function pages(directory: string): string[] {
  if (!existsSync(join(stage, directory))) return []
  return readdirSync(join(stage, directory), { withFileTypes: true }).flatMap((entry) => {
    const file = directory + '/' + entry.name
    return entry.isDirectory() ? pages(file) : entry.name.endsWith('.md') ? [file] : []
  }).sort()
}
function item(file: string) {
  const text = readFileSync(join(stage, file), 'utf8')
  const title = /^title:\s*(.+)$/m.exec(text)?.[1] || /^#\s+(.+)$/m.exec(text)?.[1] || file
  return { text: title.replace(/["'`*]/g, '').trim(), link: '/' + file.replace(/\.md$/, '.html') }
}
function selected(names: string[]) {
  return names.map((name) => 'documentation/' + name + '.md').filter((file) => existsSync(join(stage, file))).map(item)
}

export const guideSidebar = pages('guides').sort((a, b) => {
  if (a.endsWith('/first-steps.md')) return -1
  if (b.endsWith('/first-steps.md')) return 1
  return a.localeCompare(b)
}).map(item)

const groups: [string, string[]][] = [
  ['Installation', ['install', 'install_from_source', 'install-webserver', 'ubuntu-nginx', 'omd-multisite']],
  ['Configuration', ['configuration', 'cgi-cfg', 'cgi-parameters', 'macros', 'timedefinitions', 'modified_attributes', 'menu', 'action-menu', 'custom-quick-actions', 'custom-host-actions', 'custom-service-actions', 'dynamic-views']],
  ['Backends and operations', ['cluster', 'lmd', 'logfiles', 'logfile-cache']],
  ['Plugins and views', ['plugins', ...pages('documentation/plugins').map((file) => file.replace(/^documentation\/|\.md$/g, '')), 'dashboard', 'dashboard_scripted', 'broadcasts', 'business-process']],
  ['Data and reports', ['graphing', 'graph-exports', 'json-exports', 'reporting', 'ssi']],
  ['API and access', ['rest', 'rest_endpoints', 'rest_commands', 'rest_examples', 'check_thruk_rest', 'cli', 'teams', 'oauth2', 'themes', 'commands']],
]
const covered = new Set(['index', 'introduction', 'faq', ...groups.flatMap(([, names]) => names)]
  .map((name) => `documentation/${name}.md`))
const remaining = pages('documentation').filter((file) => !covered.has(file))

export const docsSidebar = [
  { text: 'Overview', link: '/documentation/index.html' },
  ...selected(['introduction']),
  { text: 'Guides', collapsed: true, items: guideSidebar },
  ...groups.map(([text, names]) => ({ text, collapsed: true, items: selected(names) })),
  { text: 'More topics', collapsed: true, items: remaining.map(item) },
  ...selected(['faq']),
].filter((entry) => !('items' in entry) || entry.items.length)

export const downloadsNav = [
  { text: 'Download', link: '/download.html' },
  { text: "What's New?", link: '/whatsnew/index.html' },
  { text: 'Changelog', link: '/changelog.html' },
]

export const developmentNav = [
  { text: 'Developer guide', link: '/development/README.html' },
  { text: 'Logo', link: '/development/logo.html' },
  { text: 'Maintain the docs', link: '/README.html' },
  { text: 'Naglint', link: '/naglint.html' },
  { text: 'GitHub', link: 'https://github.com/sni/Thruk' },
  { text: 'Issues / Bug reports', link: 'https://github.com/sni/Thruk/issues' },
  { text: 'Donations', link: '/donate.html' },
]

export const developmentSidebar = [
  ...developmentNav.filter((entry) => entry.link.startsWith('/')),
  ...pages('development').filter((file) => !file.startsWith('development/tables/') && !['development/README.md', 'development/logo.md'].includes(file)).map(item),
]
export const docNav = [
  { text: 'Overview', link: '/documentation/index.html' },
  ...selected(['install', 'configuration', 'rest', 'plugins']),
  { text: 'Agents', link: '/documentation/plugins/agents/index.html' },
  { text: 'Node Control', link: '/documentation/plugins/node-control/index.html' },
  { text: 'Business Process', link: '/documentation/business-process.html' },
  ...selected(['faq']),
]
