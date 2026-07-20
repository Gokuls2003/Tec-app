// Generates consistent initials + a color for any name, so we get avatars
// without needing photo uploads.
const COLORS = ['#6C63FF', '#2ECC71', '#FF7A45', '#22C1D6', '#FFC93C', '#FF5A5F']

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('')
}

export function colorFromName(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}
