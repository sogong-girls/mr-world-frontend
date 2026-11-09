import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

function LoginPage() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await client.post('/api/auth/login', { loginId, password })
      localStorage.setItem('token', res.data.accessToken)

      const me = await client.get('/api/users/me')
      localStorage.setItem('role', me.data.role)
      console.log('Logged in as:', me.data)

      navigate('/')
    } catch (err) {
      console.log('Login failed:', err)
      setError('Login failed. Check the console (F12) for details.')
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      <input
        placeholder="ID"
        value={loginId}
        onChange={(e) => setLoginId(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
      {error && <p>{error}</p>}
    </form>
  )
}

export default LoginPage