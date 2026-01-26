/**
 * Runtime configuration injection script.
 * This runs before the main app to set up window.__APP_CONFIG__.
 * Placeholders are replaced at container startup by docker/00-inject-config.sh
 */

interface RuntimeConfig {
  publicBaseUrl?: string
}

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig
  }
}

const config: RuntimeConfig = {
  publicBaseUrl: "__PUBLIC_BASE_URL__",
}

// Clean up placeholders that weren't replaced
// Check if value looks like an unreplaced placeholder (starts and ends with __)
if (
  config.publicBaseUrl?.startsWith("__") &&
  config.publicBaseUrl?.endsWith("__")
) {
  delete config.publicBaseUrl
}

window.__APP_CONFIG__ = config
