import { describe, expect, it } from "vitest"
import { getCurrentPath, parseBreadcrumbs } from "../router"

describe("router path decoding", () => {
  it("does not throw when hash contains malformed escape sequences", () => {
    window.location.hash = "#/%E0%A4%A"

    expect(() => getCurrentPath()).not.toThrow()
    expect(getCurrentPath()).toBe("/%E0%A4%A/")
  })

  it("keeps malformed breadcrumb segments readable without throwing", () => {
    const segments = parseBreadcrumbs("/safe/%E0%A4%A/")

    expect(segments).toHaveLength(3)
    expect(segments[0]).toEqual({ name: "Home", path: "/" })
    expect(segments[1]).toEqual({ name: "safe", path: "/safe/" })
    expect(segments[2]).toEqual({ name: "%E0%A4%A", path: "/safe/%E0%A4%A/" })
  })
})
