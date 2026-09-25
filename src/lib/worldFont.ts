/**
 * Font for all in-world text (drei <Text> / troika).
 *
 * Without an explicit font, troika resolves one from cdn.jsdelivr.net at
 * runtime (even for plain Latin), so every sign, gateway and pedestal label
 * would silently fail to render if that CDN were blocked, slow or offline.
 * Geist Regular (SIL OFL) is bundled in /public/fonts instead. It covers Latin
 * plus common punctuation; avoid symbols outside that (▲ ◄ ►), which would
 * bring the CDN fetch back for the fallback glyphs.
 */
export const WORLD_FONT = '/fonts/Geist-Regular.ttf'
