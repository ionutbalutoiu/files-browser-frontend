import { beforeEach, describe, expect, it, vi } from "vitest"

describe("getPublicFileUrl", () => {
  beforeEach(() => {
    vi.resetModules()
    window.__APP_CONFIG__ = undefined
  })

  it("joins runtime base URL and path without duplicate slashes", async () => {
    window.__APP_CONFIG__ = { publicBaseUrl: "https://example.com/public/" }

    const { getPublicFileUrl } = await import("../config")

    expect(getPublicFileUrl("docs/report.pdf")).toBe(
      "https://example.com/public/docs/report.pdf",
    )
    expect(getPublicFileUrl("/docs/report.pdf")).toBe(
      "https://example.com/public/docs/report.pdf",
    )
  })
})
