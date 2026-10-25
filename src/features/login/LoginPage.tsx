import { useState, type FormEvent } from 'react'
import { useSession } from '../../auth/session'
import { errorMessage } from '../../components/ui'

// PLACEHOLDER — replaced by the Login agent (see docs/SPEC.md, stories 1–10).
export function LoginPage() {
  const { login } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-24 flex max-w-sm flex-col gap-3">
      <label>
        Log In <input value={email} onChange={(e) => setEmail(e.target.value)} className="border" />
      </label>
      <label>
        Password <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border" />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit">Login</button>
    </form>
  )
}
