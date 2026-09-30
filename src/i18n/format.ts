/** Fills {placeholders}: format("Rated {n} of 5", { n: 4 }) → "Rated 4 of 5". */
export function format(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** "2026-09-30" → "30 September 2026" in the page language. Dates are calendar days, so format in UTC. */
export function formatDate(isoDate: string, localeTag: string) {
  return new Intl.DateTimeFormat(localeTag, { dateStyle: "long", timeZone: "UTC" }).format(new Date(isoDate));
}
