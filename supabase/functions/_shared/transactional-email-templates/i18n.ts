// Tiny in-template i18n helper. Templates define a local `dict = { en: {...}, it: {...} }`
// object and call `t(locale, dict, 'key', { name: 'X' })` to resolve a string.
// Variables are interpolated as {var} placeholders.

export type Locale = 'en' | 'it'

export function normalizeLocale(input: unknown): Locale {
  if (input === 'it' || input === 'IT' || (typeof input === 'string' && input.toLowerCase().startsWith('it'))) {
    return 'it'
  }
  return 'en'
}

type Dict<K extends string> = Record<Locale, Record<K, string>>

export function t<K extends string>(
  locale: Locale | undefined,
  dict: Dict<K>,
  key: K,
  vars?: Record<string, string | number>
): string {
  const loc = normalizeLocale(locale)
  const table = dict[loc] || dict.en
  let str = table[key] ?? dict.en[key] ?? String(key)
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }
  return str
}
