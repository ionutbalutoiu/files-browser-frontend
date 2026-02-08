import { describe, expect, it } from "vitest"
import { joinUrl, normalizePath } from "../url"

describe("normalizePath", () => {
  it("collapses duplicate slashes", () => {
    expect(normalizePath("/upload//")).toBe("/upload/")
    expect(normalizePath("/upload///path//")).toBe("/upload/path/")
  })

  it("preserves protocol slashes", () => {
    expect(normalizePath("http://localhost:3000//upload//")).toBe(
      "http://localhost:3000/upload/",
    )
    expect(normalizePath("https://example.com//api//path")).toBe(
      "https://example.com/api/path",
    )
  })

  it("preserves query strings", () => {
    expect(normalizePath("/upload//?a=1")).toBe("/upload/?a=1")
    expect(normalizePath("/path//?foo=bar&baz=1")).toBe("/path/?foo=bar&baz=1")
  })
})

describe("joinUrl", () => {
  it("joins base with empty and root segments", () => {
    expect(joinUrl("/upload/", "")).toBe("/upload/")
    expect(joinUrl("/upload/", "/")).toBe("/upload/")
    expect(joinUrl("/upload", "/")).toBe("/upload/")
  })

  it("joins full URLs", () => {
    expect(joinUrl("http://localhost:3000", "/upload//")).toBe(
      "http://localhost:3000/upload/",
    )
  })

  it("joins multiple parts", () => {
    expect(joinUrl("/api", "/upload/", "/path/")).toBe("/api/upload/path/")
  })
})
