import { screen } from '@testing-library/react'
import { VALID_LOGIN } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'
import { HttpResponse, apiUrl, http, server } from '../../test/server'

const loginField = () => screen.getByLabelText(/log in/i, { selector: 'input' })
const passwordField = () => screen.getByLabelText(/password/i, { selector: 'input' })
const submit = () => screen.getByRole('button', { name: /^login$/i })

describe('login screen', () => {
  it('shows "Invalid credentials" inline on a wrong password and stays on login', async () => {
    const { user } = renderApp({ route: '/login' })
    await user.type(loginField(), VALID_LOGIN.email)
    await user.type(passwordField(), 'wrong-password')
    await user.click(submit())

    expect(await screen.findByText('Invalid credentials')).toHaveAttribute('role', 'alert')
    expect(loginField()).toHaveValue(VALID_LOGIN.email)
    expect(passwordField()).toHaveValue('wrong-password')
    expect(screen.queryByRole('heading', { name: 'Overview' })).not.toBeInTheDocument()

    // Editing a field clears the error.
    await user.type(passwordField(), 'x')
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
  })

  it('reveals and masks the password with the eye toggle', async () => {
    const { user } = renderApp({ route: '/login' })
    await user.type(passwordField(), 'secret')
    expect(passwordField()).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(passwordField()).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(passwordField()).toHaveAttribute('type', 'password')
  })

  it('validates empty fields without calling the API', async () => {
    let calls = 0
    server.events.on('request:start', ({ request }) => {
      if (request.url.endsWith('/api/auth/login')) calls++
    })
    const { user } = renderApp({ route: '/login' })

    await user.click(submit())
    expect(screen.getByRole('alert')).toHaveTextContent(/enter your login and password/i)

    await user.type(loginField(), VALID_LOGIN.email)
    await user.click(submit())
    expect(screen.getByRole('alert')).toHaveTextContent(/enter your password/i)

    expect(calls).toBe(0)
    server.events.removeAllListeners()
  })

  it('disables the button and shows progress while signing in', async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    let calls = 0
    server.use(
      http.post(apiUrl('/api/auth/login'), async () => {
        calls++
        await gate
        return HttpResponse.json({ errorMessage: 'Invalid credentials' }, { status: 401 })
      }),
    )
    const { user } = renderApp({ route: '/login' })
    await user.type(loginField(), VALID_LOGIN.email)
    await user.type(passwordField(), VALID_LOGIN.password)
    await user.click(submit())

    const pending = await screen.findByRole('button', { name: /signing in/i })
    expect(pending).toBeDisabled()
    await user.click(pending)
    await user.keyboard('{Enter}')

    release()
    expect(await screen.findByText('Invalid credentials')).toHaveAttribute('role', 'alert')
    expect(submit()).toBeEnabled()
    expect(calls).toBe(1)
  })

  it('lands on the Overview after a successful login', async () => {
    const { user } = renderApp({ route: '/login' })
    await user.type(loginField(), VALID_LOGIN.email)
    await user.type(passwordField(), VALID_LOGIN.password)
    await user.click(submit())
    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
  })
})
