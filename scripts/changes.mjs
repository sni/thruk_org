export function parseChanges(text) {
  const headers = [...text.matchAll(/^(next:|(\d+(?:\.\d+)+(?:-\d+)?)[ \t]+([^\r\n]+))[^\r\n]*$/gm)]
  return {
    preamble: headers.length ? text.slice(0, headers[0].index) : text,
    releases: headers.map((header, index) => ({
      version: header[2] || 'next',
      date: header[3] || '',
      body: text.slice(header.index, headers[index + 1]?.index ?? text.length),
    })),
  }
}

export function releaseDate(date) {
  // Release 0.94.4 uses the German month name "Mai".
  let zoned = date.replace(/\bMai\b/, 'May').replace(/\bCEST\b/, '+0200').replace(/\bCET\b/, '+0100').replace(/\b(?:UTC|GMT)\b/, '+0000')
  if (!/[+-]\d{4}/.test(zoned)) zoned += ' UTC'
  const value = new Date(zoned)
  if (Number.isNaN(value.getTime())) throw new Error(`Invalid release date: ${date}`)
  return value
}

export function releaseDay(date) {
  // Keep the entry's calendar date even when its time would cross midnight in UTC.
  return releaseDate(date.replace(/\b\d{1,2}:\d{2}:\d{2}(?:\s+(?:[A-Z]+|[+-]\d{4}))?/, '')).toISOString().slice(0, 10)
}

function fenced(text) {
  let fence = '```'
  while (text.includes(fence)) fence += '`'
  return `${fence}text\n${text}${text.endsWith('\n') ? '' : '\n'}${fence}\n`
}

export function renderChanges(text, highlights = []) {
  const { releases } = parseChanges(text)
  const available = new Set(highlights)
  let markdown = '# Changelog\n\n'
  for (const release of releases) {
    const title = release.version === 'next' ? 'Nightly development version' : `v${release.version}`
    const id = title.toLowerCase().replace(/[ .]/g, '-')
    if (release.version !== 'next') markdown += `<a id="v${release.version}"></a>\n\n`
    const day = release.date ? releaseDay(release.date) : ''
    const date = day ? ` <time class="release-date ignore-header" datetime="${day}">${day}</time>` : ''
    const changes = release.body.replace(/^[^\n]*(?:\n|$)/, '').replace(/^ {10}/gm, '')
    markdown += `## ${title}${date} {#${id}}\n\n`
    if (available.has(release.version)) markdown += `[What's new in ${title}](/whatsnew/v${release.version}.html)\n\n`
    markdown += `${fenced(changes)}\n`
  }
  return markdown
}

export function renderReleaseNotes(markdown) {
  // Only release-record fences are prose; configuration and command examples stay fenced.
  return markdown.replace(/^```\n(\d+\.\d+[^\n]*\n[\s\S]*?)^```$/gm, (_, body) => {
    const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/([\\`*_{}\[\]()#+.!|~-])/g, '\\$1')
    const indent = Math.min(...[...body.matchAll(/^( +)- /gm)].map((match) => match[1].length))
    return body.split('\n').map((line) => {
      if (!line.trim()) return ''
      const item = /^(\s*)- (.*)$/.exec(line)
      if (item) return ' '.repeat(Math.max(0, item[1].length - indent)) + '- ' + escape(item[2])
      if (/^\d+\.\d+/.test(line)) return '\n**' + escape(line.trim()) + '**\n'
      return '  ' + escape(line.trim())
    }).join('\n')
  })
}
