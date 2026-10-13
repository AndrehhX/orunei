export function truncateWithEllipsis(value, maxLength = 180) {
  const text = String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text

  const contentLength = Math.max(1, maxLength - 3)
  const content = text.slice(0, contentLength).trimEnd()
  const breakAt = content.lastIndexOf(' ')
  const clipped = breakAt > contentLength * 0.6 ? content.slice(0, breakAt).trimEnd() : content
  return `${clipped}...`
}
