import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError } from '../lib/api'
import { setDisplayLocale } from '../lib/time'
import { MESSAGES, type Lang, type MessageKey } from './messages'

const LANG_KEY = 'cms.lang'

function readLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === 'ar' ? 'ar' : 'en'
  } catch {
    return 'en'
  }
}

/**
 * Wraps user data (Latin names, zone names) in Unicode first-strong isolates so trailing
 * punctuation like "Sr." keeps its place inside right-to-left sentences.
 */
export const isolate = (s: string) => `\u2068${s}\u2069`

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string

interface I18nValue {
  lang: Lang
  dir: 'ltr' | 'rtl'
  setLang: (lang: Lang) => void
  t: Translate
  /** Direction-isolates user data inside translated sentences (no-op in LTR). */
  iso: (s: string) => string
  /** Maps API errors to localized copy where we know the meaning; falls back to the message. */
  errorText: (err: unknown) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang)
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  // Date/number formatting in lib/time follows the active language (Western digits kept).
  setDisplayLocale(lang)

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(LANG_KEY, next)
    } catch {
      // Not persisted; fine.
    }
  }, [])

  const t = useCallback<Translate>(
    (key, vars) => {
      let s: string = MESSAGES[lang][key] ?? MESSAGES.en[key]
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
      return s
    },
    [lang],
  )

  const errorText = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError) {
        if (err.status === 401) return t('login.errInvalid')
        if (err.status === 0) return err.message.includes('long') ? t('errors.timeout') : t('errors.network')
        return err.message
      }
      return err instanceof Error ? err.message : t('common.somethingWrong')
    },
    [t],
  )

  const iso = useCallback((s: string) => (dir === 'rtl' ? isolate(s) : s), [dir])

  const value = useMemo(() => ({ lang, dir, setLang, t, iso, errorText }) as const, [lang, dir, setLang, t, iso, errorText])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
