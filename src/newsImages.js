const MICROLINK_API = 'https://api.microlink.io/'

const cleanUrl = (value) => typeof value === 'string' ? value.trim() : ''

function firstImageFromHtml(html = '') {
  const match = String(html).match(/<img[^>]+src=["']([^"']+)/i)
  return cleanUrl(match?.[1])
}

function isImageLink(link = '', type = '') {
  return /^image\//i.test(type) || /\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(link)
}

export function extractFeedImage(item = {}) {
  const thumbnail = cleanUrl(item.thumbnail)
  if (thumbnail) return thumbnail

  const enclosure = item.enclosure || {}
  const enclosureLink = cleanUrl(enclosure.link)
  if (enclosureLink && isImageLink(enclosureLink, enclosure.type)) return enclosureLink

  return firstImageFromHtml(item.content) || firstImageFromHtml(item.description)
}

export function buildNewsImageFallback(link) {
  const target = cleanUrl(link)
  if (!target) return ''
  const params = new URLSearchParams({
    url: target,
    screenshot: 'true',
    meta: 'false',
    embed: 'screenshot.url',
    'viewport.width': '1200',
    'viewport.height': '630',
  })
  return `${MICROLINK_API}?${params.toString()}`
}
