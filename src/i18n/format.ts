/** Fills {placeholders}: format("Rated {n} of 5", { n: 4 }) → "Rated 4 of 5". */
export function format(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
