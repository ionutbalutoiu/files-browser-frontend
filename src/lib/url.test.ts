/**
 * Unit tests for URL utilities.
 * Run with: npx tsx src/lib/url.test.ts
 * Or import in browser dev tools to verify.
 */

import { normalizePath, joinUrl } from "./url"

interface TestCase {
  name: string
  fn: () => void
}

const tests: TestCase[] = [
  // normalizePath tests
  {
    name: "normalizePath: collapses double slashes",
    fn: () => {
      assertEqual(normalizePath("/upload//"), "/upload/")
      assertEqual(normalizePath("/upload///path//"), "/upload/path/")
    },
  },
  {
    name: "normalizePath: preserves protocol slashes",
    fn: () => {
      assertEqual(
        normalizePath("http://localhost:3000//upload//"),
        "http://localhost:3000/upload/",
      )
      assertEqual(
        normalizePath("https://example.com//api//path"),
        "https://example.com/api/path",
      )
    },
  },
  {
    name: "normalizePath: preserves query strings",
    fn: () => {
      assertEqual(normalizePath("/upload//?a=1"), "/upload/?a=1")
      assertEqual(
        normalizePath("/path//?foo=bar&baz=1"),
        "/path/?foo=bar&baz=1",
      )
    },
  },
  {
    name: "normalizePath: handles empty and simple paths",
    fn: () => {
      assertEqual(normalizePath(""), "")
      assertEqual(normalizePath("/"), "/")
      assertEqual(normalizePath("/path"), "/path")
    },
  },

  // joinUrl tests
  {
    name: 'joinUrl: base="/upload/" + "" => "/upload/"',
    fn: () => {
      assertEqual(joinUrl("/upload/", ""), "/upload/")
    },
  },
  {
    name: 'joinUrl: "/upload/" + "/" => "/upload/"',
    fn: () => {
      assertEqual(joinUrl("/upload/", "/"), "/upload/")
    },
  },
  {
    name: 'joinUrl: "/upload" + "/" => "/upload/"',
    fn: () => {
      assertEqual(joinUrl("/upload", "/"), "/upload/")
    },
  },
  {
    name: 'joinUrl: "http://localhost:3000" + "/upload//" => "http://localhost:3000/upload/"',
    fn: () => {
      assertEqual(
        joinUrl("http://localhost:3000", "/upload//"),
        "http://localhost:3000/upload/",
      )
    },
  },
  {
    name: "joinUrl: handles multiple parts",
    fn: () => {
      assertEqual(joinUrl("/api", "/upload/", "/path/"), "/api/upload/path/")
    },
  },
]

function assertEqual(actual: string, expected: string): void {
  if (actual !== expected) {
    throw new Error(`Expected "${expected}" but got "${actual}"`)
  }
}

function runTests(): void {
  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      test.fn()
      console.log(`✓ ${test.name}`)
      passed++
    } catch (e) {
      console.error(`✗ ${test.name}`)
      console.error(`  ${e instanceof Error ? e.message : e}`)
      failed++
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`)

  if (failed > 0) {
    throw new Error(`${failed} test(s) failed`)
  }
}

// Run tests if this file is executed directly
runTests()
