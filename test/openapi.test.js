import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('published OpenAPI describes a parameterized command and projected host queries', () => {
  const { paths } = JSON.parse(readFileSync(new URL('../.vitepress/dist/openapi-v1.json', import.meta.url)))
  const cmd = paths['/hosts/{name}/cmd/schedule_host_downtime'].post
  assert.ok(cmd.parameters.some(p => p.name === 'name' && p.in === 'path' && p.required))
  const form = cmd.requestBody.content['application/x-www-form-urlencoded'].schema
  assert.deepEqual(form.required, ['comment_data'])
  assert.ok(form.properties.duration)
  assert.ok(paths['/hosts'].get.parameters.some(p => p.name === 'columns' && p.in === 'query'))
  assert.ok(!Object.keys(paths).some(path => path.includes('...')))
})
