import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.48/deno-dom-wasm.ts"

const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (compatible; EscapeLog-Crawler/1.0)",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.5",
}

export function parseHTML(html: string) {
  const parser = new DOMParser()
  return parser.parseFromString(html, "text/html")
}

export async function fetchHTML(url: string): Promise<string> {
  const res = await fetch(url, { headers: DEFAULT_HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

export async function fetchAndParse(url: string) {
  const html = await fetchHTML(url)
  return parseHTML(html)
}

export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
