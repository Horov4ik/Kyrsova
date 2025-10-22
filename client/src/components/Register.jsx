import React, {useState} from 'react'
import axios from 'axios'

export default function Register({api}){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [ok, setOk] = useState(null)
  const [err, setErr] = useState(null)

  const submit = async (e) =>{
    e.preventDefault()
    try {
      await axios.post(`${api}/auth/register`, {username, password})
      setOk('Користувача створено. Можна увійти.')
      setErr(null)
    } catch (e) { setErr(e.response?.data?.error || e.message); setOk(null) }
  }

  return (
    <form onSubmit={submit} className="card p-3">
      <h5>Реєстрація</h5>
      {ok && <div className="alert alert-success">{ok}</div>}
      {err && <div className="alert alert-danger">{err}</div>}
      <input className="form-control mb-2" placeholder="Логін" value={username} onChange={e=>setUsername(e.target.value)} required />
      <input className="form-control mb-2" placeholder="Пароль" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
      <button className="btn btn-success">Зареєструватись</button>
    </form>
  )
}
