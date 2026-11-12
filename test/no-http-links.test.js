import { assert, test } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(file, out)
    else out.push(file)
  }
  return out
}

// Links to thruk.org must use https. download.thruk.org and demo.thruk.org are
// exceptions, and the jQuery example in the docs is historical.
test('thruk.org links use https', () => {
  const dirs = [path.join(root, 'src')]
  if (process.env.THRUK_SOURCE) dirs.push(path.join(path.resolve(process.env.THRUK_SOURCE), 'docs', 'documentation'))
  const fails = []
  for (const dir of dirs) {
    for (const file of walk(dir)) {
      const lines = readFileSync(file, 'utf8').split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (!/thruk\.org/.test(line) || !/http:/.test(line)) continue
        if (/download\.thruk|demo\.thruk|insertBefore/.test(line)) continue
        fails.push(`${path.relative(root, file)}:${i + 1}: ${line.trim()}`)
      }
    }
  }
  assert.deepEqual(fails, [])
})
