import { useI18n } from '../i18n/i18n'

/**
 * The Figma's En / ع pill: switches the whole UI between English and Arabic (RTL).
 * `glass` is the translucent variant used over the login photo.
 */
export function LanguageToggle({ variant = 'default' }: { variant?: 'default' | 'glass' }) {
  const { lang, setLang, t } = useI18n()
  const glass = variant === 'glass'
  const option = (code: 'en' | 'ar', label: string, name: string) => (
    <button
      type="button"
      lang={code}
      aria-pressed={lang === code}
      aria-label={name}
      onClick={() => setLang(code)}
      className={`h-7 w-7 rounded-full text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-500 ${
        lang === code
          ? 'bg-brand-500 text-white'
          : glass
            ? 'text-white/85 hover:bg-white/15 hover:text-white'
            : 'text-ink-muted hover:bg-page hover:text-ink'
      } ${code === 'ar' ? 'text-sm' : ''}`}
    >
      {label}
    </button>
  )
  return (
    <div
      role="group"
      aria-label={t('shell.language')}
      className={`flex items-center gap-1 rounded-full p-1 ${
        glass ? 'bg-black/25 ring-1 ring-white/25 backdrop-blur-sm' : 'border border-line'
      }`}
    >
      {option('en', 'En', 'English')}
      {option('ar', 'ع', 'العربية')}
    </div>
  )
}
