export interface CrawledRoom {
  vendor_name: string
  theme_name: string
  region: string
  poster_url?: string
}

export interface CrawlResult {
  source: string
  total_crawled: number
  inserted: number
  skipped: number
  posters_uploaded: number
  errors: string[]
  crawled_at: string
}
