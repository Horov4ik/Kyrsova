import React, {useState} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Login({api, onLogin}){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try {
      console.log('Login submit', {username})
      setErr(null)
      setLoading(true)
      const res = await axios.post(`${api}/auth/login`, {username, password})
      onLogin(res.data.token)
      // navigate to home after successful login
      navigate('/')
    } catch (e) { setErr(e.response?.data?.error || e.message) }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="card p-3">
      <h5>Вхід</h5>
      {err && <div className="alert alert-danger">{err}</div>}
      <input className="form-control mb-2" placeholder="Логін" value={username} onChange={e=>setUsername(e.target.value)} required />
      <input className="form-control mb-2" placeholder="Пароль" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
      <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Зачекайте...' : 'Увійти'}</button>
    </form>
  )
}
