import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import SoldiersList from './components/SoldiersList'
import SoldierForm from './components/SoldierForm'
import Login from './components/Login'
import Register from './components/Register'
import YearTab from './components/YearTab'
import YearPage from './components/YearPage'

// Normalize and validate the API base URL provided via VITE_API_URL.
// Guard against accidentally pasting a MongoDB connection string into VITE_API_URL.
const _rawApi = import.meta.env.VITE_API_URL || ''
function looksLikeMongoUri(s){ return typeof s === 'string' && /^mongodb(\+srv)?:\/\//i.test(s) }
function isAbsoluteUrl(s){ return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s) }
function normalizeApi(raw){
  // default to the deployed Render backend if no VITE_API_URL is provided
  if (!raw) return 'https://kyrsova-0cpo.onrender.com/api'
  if (looksLikeMongoUri(raw)){
    console.error('VITE_API_URL looks like a MongoDB connection string. Set VITE_API_URL to your backend API URL (e.g. https://my-backend.onrender.com/api). Falling back to http://localhost:4000/api')
    return 'http://localhost:4000/api'
  }
  // If absolute (has protocol) use as-is (trim trailing slash)
  if (isAbsoluteUrl(raw)) return raw.replace(/\/+$/,'')
  // If starts with a slash, make absolute relative to current origin
  if (raw.startsWith('/')) return `${location.origin}${raw.replace(/\/+$/,'')}`
  // Otherwise assume https host if no protocol provided
  try {
    const candidate = `https://${raw}`
    // ensure URL constructor accepts it
    new URL(candidate)
    return candidate.replace(/\/+$/,'')
  } catch (e){
    console.warn('VITE_API_URL is not a valid absolute URL; falling back to http://localhost:4000/api')
    return 'http://localhost:4000/api'
  }
}
const API = normalizeApi(_rawApi)
console.log('Using API base:', API)

// make axios use the same base URL so components can call relative paths
axios.defaults.baseURL = API

// attach token if present
const token = localStorage.getItem('token')
if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

function Header({onLogout, user}){
  const location = useLocation()
  const hideLogout = location.pathname === '/'
  return (
    <header className="app-header">
      <div className="container header-inner">
        <div className="logo-area">
          <Link to="/auth" aria-label="Увійти або реєстрація" className="logo-link">
            <div className="logo-placeholder">
              {/* Place an image named `logo.png` into the `client/public` folder for this to load */}
              <img src="/logo.png" alt="Лого" className="site-logo" onError={(e)=>{ e.target.style.display='none' }} />
              <span className="logo-fallback">Лого</span>
            </div>
          </Link>
          <div className="site-name">Підсистема обліку військовослужбовців</div>
        </div>
        <div className="header-actions">
          {user && !hideLogout && (
            <button className="btn btn-outline-primary logout-btn" onClick={onLogout}>Вихід</button>
          )}
        </div>
      </div>
    </header>
  )
}

function Footer(){
  return (
    <footer className="app-footer">
      <div className="container footer-inner">
        <div>Розробник: Владислав Хоров'як</div>
        <div>email: horov4ik@gmail.com • тел: +380 95 083 0848</div>
      </div>
    </footer>
  )
}

function _AppMain({user, logout, releaseLabels, onEditLabel}){
  const years = [2024,2025,2026]
  return (
    <div>
      <main className="container py-4 full-height-center">
        <div className="hero card p-4 mb-4 animate-card text-center">
          <h1 className="hero-title">Підсистема обліку військовослужбовців</h1>
          <p className="lead">Керуйте випусками, переглядайте статистику та експортуйте дані — все в одному місці.</p>
          <div className="d-flex gap-3 mt-3 hero-actions justify-content-center align-items-center">
            {years.map(y => (
              <div key={y} className="release-button-wrap">
                <Link className="btn btn-lg btn-outline-primary btn-release" to={`/year/${y}`}>{releaseLabels[y] || `Випуск ${y}`}</Link>
                <div className="release-edit-row">
                  <button className="btn btn-edit" onClick={()=>onEditLabel(y)} title="Редагувати назву">✎ Ред.</button>
                </div>
              </div>
            ))}
            <div className="release-button-wrap">
              <Link className="btn btn-lg btn-outline-primary btn-release" to="/auth">Увійти / Реєстрація</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function App(){
  const [soldiers, setSoldiers] = useState([])
  const [editing, setEditing] = useState(null)
  const [user, setUser] = useState(token ? {token} : null)
  const [releaseLabels, setReleaseLabels] = useState(() => JSON.parse(localStorage.getItem('releaseLabels') || '{}'))

  const fetchList = async () => {
    if (!user) return
    const res = await axios.get(`${API}/soldiers`)
    setSoldiers(res.data)
  }

  useEffect(()=>{ if (user) fetchList() }, [user])

  const onLogin = (token) => {
    localStorage.setItem('token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser({token})
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    setSoldiers([])
  }

  const onEditLabel = (year) => {
    const current = releaseLabels[year] || `Випуск ${year}`
    const v = prompt('Нова назва кнопки', current)
    if (!v) return
    const copy = {...releaseLabels, [year]: v}
    setReleaseLabels(copy)
    localStorage.setItem('releaseLabels', JSON.stringify(copy))
  }

  const AuthView = (
    <div className="auth-wrapper">
      <div className="auth-card card p-3">
        <div style={{width:'100%', textAlign:'center', marginBottom:12}}>
          <h2 className="hero-title" style={{fontSize:28}}>Підсистема обліку військовослужбовців</h2>
          <div className="lead">Увійдіть або зареєструйтесь, щоб продовжити</div>
        </div>
        <div className="d-flex" style={{gap:20}}>
          <div className="col-md-6"><Login api={API} onLogin={onLogin} /></div>
          <div className="col-md-6"><Register api={API} /></div>
        </div>
      </div>
    </div>
  )

  return (
    <BrowserRouter>
      <Header onLogout={logout} />
      <Routes>
  <Route path="/" element={user ? <_AppMain user={user} logout={logout} releaseLabels={releaseLabels} onEditLabel={onEditLabel} /> : AuthView} />
  <Route path="/auth" element={AuthView} />
        <Route path="/year/:year" element={<YearRouteWrapper api={API} />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

function YearRouteWrapper({api}){
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const path = window.location.pathname
  const year = parseInt(path.split('/').pop(),10)
  if (!year) { navigate('/'); return null }
  return <div className="container py-4"><LinkBack /><YearPage year={year} api={api} /></div>
}

function LinkBack(){
  return <div className="mb-3"><Link to="/" className="btn btn-outline-secondary">Назад</Link></div>
}
