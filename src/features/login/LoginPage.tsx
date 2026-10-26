import { useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useSession } from '../../auth/session'
import { EyeIcon, EyeOffIcon, KloudspotLogo } from '../../components/icons'
import { errorMessage } from '../../components/ui'
import { OfficeBackdrop } from './OfficeBackdrop'

// Figma: outlined 43px field, #E3E3E3 border, label notched into the top border.
const inputClass =
  'peer block h-[43px] w-full rounded border border-[#e3e3e3] bg-white px-3 text-sm text-black placeholder:text-[#b5b5b5] ' +
  'outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-page'

const notchedLabelClass =
  'absolute -top-2 left-2.5 bg-white px-1 text-xs leading-4 text-[#8e8e8e] peer-focus:text-brand-600'

/**
 * Login screen (SPEC stories 1–5, 10). Redirect after success is owned by `LoginRoute`;
 * this component only collects credentials, calls `login`, and reports failures inline.
 * Credentials are held in component state only and never logged.
 */
export function LoginPage() {
  const { login } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  // A ref as well as state: two quick submits can land before the re-render disables the button.
  const inFlight = useRef(false)

  const emailId = useId()
  const passwordId = useId()
  const errorId = useId()

  function edit(setter: (v: string) => void) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value)
      if (error) setError(null)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (inFlight.current) return
    if (!email.trim() || !password) {
      setError(
        !email.trim() && !password
          ? 'Enter your login and password.'
          : !email.trim()
            ? 'Enter your login.'
            : 'Enter your password.',
      )
      return
    }
    inFlight.current = true
    setPending(true)
    setError(null)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }

  return (
    <main className="relative isolate flex min-h-full items-center overflow-hidden bg-[#2b2b2b]">
      <OfficeBackdrop />

      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-center gap-12 px-4 py-10 min-[900px]:justify-between min-[900px]:px-12 xl:px-20">
        <h1 className="hidden text-[2rem] leading-[1.25] font-semibold tracking-[0.01em] text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.35)] min-[900px]:block xl:text-[2.4rem]">
          Welcome to the
          <br />
          Crowd Management System
        </h1>

        <section
          aria-label="Sign in"
          className="w-full max-w-[360px] shrink-0 overflow-hidden rounded-lg bg-white shadow-2xl shadow-black/40"
        >
          <header className="card-header-bg flex h-[108px] items-center justify-center">
            <KloudspotLogo />
          </header>

          <form noValidate onSubmit={onSubmit} className="flex flex-col px-6 pt-6 pb-6">
            <div className="relative">
              <input
                id={emailId}
                name="email"
                type="text"
                inputMode="email"
                autoComplete="username"
                placeholder="Parking_solutions"
                value={email}
                onChange={edit(setEmail)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                required
                className={inputClass}
              />
              <label htmlFor={emailId} className={notchedLabelClass}>
                Log In *
              </label>
            </div>

            <div className="relative mt-[22px]">
              <input
                id={passwordId}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={edit(setPassword)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                required
                className={`${inputClass} pr-11`}
              />
              <label htmlFor={passwordId} className={notchedLabelClass}>
                Password *
              </label>
              {/*
                Name comes from visually hidden text, not aria-label, so `getByLabelText(/password/i)`
                keeps resolving to the input alone.
              */}
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r text-ink hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-brand-500"
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={pending}
              aria-busy={pending || undefined}
              className="mt-4 h-[42px] w-full rounded-md bg-brand-500 text-base text-white transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending ? 'Signing in…' : 'Login'}
            </button>

            <p id={errorId} role="alert" className="mt-3 text-center text-sm text-down empty:mt-0">
              {error}
            </p>
          </form>
        </section>
      </div>
    </main>
  )
}
