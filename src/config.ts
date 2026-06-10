// Canonical data endpoint — merged data PRs go live here without app redeploy
export const DATA_URL =
  'https://raw.githubusercontent.com/anten-tv/anten-tv.github.io/main/data/towers.json'

export const COVERAGE_URL_BASE =
  'https://raw.githubusercontent.com/anten-tv/anten-tv.github.io/main/data/coverage/'

// OpenFreeMap: keyless vector tiles, no usage caps
export const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
export const STYLE_URL_FALLBACK = 'https://demotiles.maplibre.org/style.json'

// Last-resort style needing zero network: plain background so tower dots,
// user position and coverage polygons still render fully offline.
// (glyphs URL kept so the channel-label layer is valid; labels simply skip
// rendering while glyph fetches fail.)
export const STYLE_OFFLINE = {
  version: 8 as const,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background' as const,
      paint: { 'background-color': '#e8eef4' },
    },
  ],
}

export const REPO_URL = 'https://github.com/anten-tv/anten-tv.github.io'
export const ISSUE_URL = `${REPO_URL}/issues/new?template=tower-report.yml`

// Vietnam map defaults
export const VN_CENTER: [number, number] = [106.0, 16.0]
export const VN_ZOOM = 5.2
