// rest_endpoints.md is generated from Thruk's registered routes and command arguments.
export function buildOpenAPI(reference) {
  const paths = {}
  for (const section of reference.split(/^### /m).slice(1)) {
    const heading = /^`(GET|POST|PATCH|PUT|DELETE|HEAD|OPTIONS) (\/[^`]*)` \{#([\w-]+)\}\n/.exec(section)
    if (!heading) throw new Error(`Invalid REST endpoint heading: ${section.split('\n')[0]}`)
    const [, method, route, anchor] = heading
    if (route.endsWith('/cmd/...')) continue // Index of commands, not a route.
    const path = route.replace(/<([\w-]+)>/g, '{$1}')
    const body = section.slice(heading[0].length).trim()
    const parameters = [...path.matchAll(/\{([^}]+)\}/g)].map(([, name]) => ({
      name, in: 'path', required: true, schema: { type: 'string' },
    }))
    const operation = {
      operationId: anchor,
      summary: body.split('\n')[0],
      externalDocs: { url: `https://www.thruk.org/documentation/rest_endpoints.html#${anchor}` },
      parameters,
      responses: { default: { description: 'See the endpoint reference for the response.' } },
    }
    if (method === 'GET' && ['/hosts', '/services'].includes(path)) {
      for (const [name, type] of [['columns', 'string'], ['limit', 'integer'], ['offset', 'integer'], ['backends', 'string']]) {
        parameters.push({ name, in: 'query', schema: { type } })
      }
      operation.responses[200] = { description: 'Rows with the selected columns.', content: {
        'application/json': { schema: { type: 'array', items: { type: 'object', additionalProperties: true } } },
      } }
    }
    if (method === 'GET' && path === '/thruk/whoami') {
      operation.responses[200] = { description: 'Current profile.', content: {
        'application/json': { schema: { type: 'object', properties: { id: { type: 'string' } } } },
      } }
    }
    if (method === 'POST' && body.startsWith('Sends the ')) {
      const properties = {}
      let required = []
      for (const [, kind, list] of body.matchAll(/^(Required|Optional) arguments:\n\n((?:  \* \w+\n?)+)/gm)) {
        const names = [...list.matchAll(/\* (\w+)/g)].map(([, name]) => name)
        for (const name of names) properties[name] = { type: 'string' }
        if (kind === 'Required') required = names
      }
      if (Object.keys(properties).length) {
        operation.requestBody = { required: Boolean(required.length), content: {
          'application/x-www-form-urlencoded': { schema: { type: 'object', properties, required } },
        } }
      }
      operation.responses[200] = { description: 'Submitted. Check failed_backends for partial failures when rest_commands_ignore_partial_errors is enabled.' }
      operation.responses.default.description = 'Submission failed. A partial failure lists the failed_backends.'
    }
    const methods = paths[path] ??= {}
    if (methods[method.toLowerCase()]) throw new Error(`Duplicate REST endpoint: ${method} ${path}`)
    methods[method.toLowerCase()] = operation
  }
  if (!paths['/thruk/whoami']?.get) throw new Error('REST endpoint reference is incomplete')
  return {
    openapi: '3.1.0',
    info: { title: 'Thruk REST API', version: '1', description: 'Documented v1 operations. Available routes depend on the installed plugins. Consult the endpoint reference for additional parameters and response fields.' },
    servers: [{ url: '{baseUrl}', variables: { baseUrl: { default: 'https://monitor.example.org/thruk/r/v1', description: 'Base URL of your Thruk installation, including any site prefix.' } } }],
    components: { securitySchemes: { apiKey: { type: 'apiKey', in: 'header', name: 'X-Thruk-Auth-Key' }, basic: { type: 'http', scheme: 'basic' } } },
    security: [{ apiKey: [] }, { basic: [] }],
    paths,
  }
}
