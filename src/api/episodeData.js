const cleanEpisodeTitle = (value = '') => String(value)
  .replace(/<[^>]+>/g, '')
  .replace(/[*_`#>]+/g, '')
  .trim()

export function buildEpisodeCards(media = {}) {
  const fallbackThumbnail = media.coverImage?.extraLarge || ''
  const seen = new Set()
  return (Array.isArray(media.streamingEpisodes) ? media.streamingEpisodes : [])
    .filter((episode) => {
      const url = typeof episode?.url === 'string' ? episode.url.trim() : ''
      if (!url || seen.has(url)) return false
      seen.add(url)
      return true
    })
    .map((episode, index) => ({
      title: cleanEpisodeTitle(episode.title) || `Episodio ${index + 1}`,
      url: episode.url.trim(),
      site: episode.site || 'Fuente oficial',
      thumbnail: episode.thumbnail || fallbackThumbnail,
    }))
}
