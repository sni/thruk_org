export function releaseStatus(installed, latest) {
  if (!installed) return null
  const parse = (value) => {
    if (!/^v?\d+(?:\.\d+)+$/.test(value)) return null
    const parts = value.replace(/^v/, '').split('.').map(Number)
    return parts.every(Number.isSafeInteger) ? parts : null
  }
  const current = parse(installed)
  const stable = parse(latest)
  if (!current || !stable) return 'unknown'
  for (let i = 0; i < Math.max(current.length, stable.length); i++) {
    if ((current[i] || 0) < (stable[i] || 0)) return 'update'
    if ((current[i] || 0) > (stable[i] || 0)) return 'unknown'
  }
  return 'current'
}
