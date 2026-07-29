// Turn any Google Sheets link a user pastes into a CSV export URL the cron
// can fetch. Handles three shapes:
//   - share/edit link:  /spreadsheets/d/<ID>/edit#gid=<GID>   → /export?format=csv&gid=<GID>
//   - already-CSV:      anything containing output=csv or format=csv → passthrough
//   - published-to-web: /spreadsheets/d/e/<TOKEN>/pubhtml     → /pub?output=csv
// Returns null if it doesn't look like a Google Sheets URL at all.
export function deriveCsvUrl(input: string): string | null {
  const url = input.trim()
  if (!url) return null

  // Already a CSV endpoint, leave it alone.
  if (/[?&]output=csv|[?&]format=csv/.test(url)) return url

  // Published-to-web (/d/e/<token>/...), swap the view suffix for pub?output=csv.
  const pub = url.match(/\/spreadsheets\/d\/e\/([\w-]+)/)
  if (pub) {
    return `https://docs.google.com/spreadsheets/d/e/${pub[1]}/pub?output=csv`
  }

  // Standard share/edit link, extract the document id and optional gid.
  const doc = url.match(/\/spreadsheets\/d\/([\w-]+)/)
  if (!doc) return null
  const gid = url.match(/[#?&]gid=(\d+)/)
  return `https://docs.google.com/spreadsheets/d/${doc[1]}/export?format=csv&gid=${gid ? gid[1] : "0"}`
}
