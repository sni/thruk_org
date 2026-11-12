import { assert, test } from 'vitest'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))

for (const value of [undefined, '', '   ']) {
  test(`build and docs checks reject ${JSON.stringify(value)} THRUK_SOURCE without a fallback`, () => {
    const env = { ...process.env }
    if (value === undefined) delete env.THRUK_SOURCE
    else env.THRUK_SOURCE = value
    for (const script of ['scripts/build_site.mjs', 'scripts/docs-check.mjs']) {
      const result = spawnSync(process.execPath, [script], { cwd: root, env, encoding: 'utf8' })
      assert.notEqual(result.status, 0)
      assert.include(result.stderr, 'THRUK_SOURCE is required')
    }
  })
}

test('the docs Makefile delegates to the website Makefile with the local Thruk source', () => {
  assert.ok(process.env.THRUK_SOURCE, 'THRUK_SOURCE is required')
  const source = path.resolve(process.env.THRUK_SOURCE)
  const result = spawnSync('make', ['-n', '-C', path.join(source, 'docs'), `THRUK_ORG_SRC=${root}`, 'MAKE=true', 'build'], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.include(result.stdout, `true -C "${root}" THRUK_SOURCE="${source}" build`)
})
