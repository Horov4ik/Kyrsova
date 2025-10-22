import React, {useEffect, useState} from 'react'
import axios from 'axios'

export default function YearTab({year, api, refreshList}){
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  // flourish embed removed per user request

  const fetchStats = async () => {
    setLoading(true)
    try{
  const { data } = await axios.get(`${api}/admin/stats/${year}`)
  setStats(data)
    }catch(e){ console.error(e) }
    setLoading(false)
  }

  const seed = async (count) => {
    setLoading(true)
    try{
  if (count) await axios.post(`${api}/admin/seed/${year}/${count}`)
  else await axios.post(`${api}/admin/seed/${year}`)
      await fetchStats()
      if (refreshList) refreshList()
    }catch(e){ console.error(e) }
    setLoading(false)
  }

  const clearAll = async () => {
    setLoading(true)
    try{
  await axios.delete(`${api}/admin/clear/${year}`)
      await fetchStats()
      if (refreshList) refreshList()
    }catch(e){ console.error(e) }
    setLoading(false)
  }

  useEffect(()=>{ fetchStats() }, [])

  const chartUrl = () => {
    if (!stats) return null
    // build simple QuickChart pie chart
    const labels = stats.breakdown.map(b => b._id || 'Невідомо')
    const data = stats.breakdown.map(b => b.count)
    const qc = {
      type: 'pie',
      data: { labels, datasets:[{ data }] },
      options: { title: { display: true, text: `Розподіл по підрозділах (${year})` } }
    }
    const encoded = encodeURIComponent(JSON.stringify(qc))
    return `https://quickchart.io/chart?c=${encoded}`
  }

  return (
    <div className="card p-3 mb-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5>Випуск {year}</h5>
        <div>
          <button className="btn btn-sm btn-outline-secondary me-2" onClick={fetchStats} disabled={loading}>Оновити</button>
          <button className="btn btn-sm btn-primary me-2" onClick={()=>seed()} disabled={loading}>Заповнити рандомом (65–120)</button>
          <button className="btn btn-sm btn-danger" onClick={()=>{ if (confirm('Видалити всіх з цього року?')) clearAll() }} disabled={loading}>Очистити всіх</button>
        </div>
      </div>
      {loading && <div>Завантаження...</div>}
      {stats && (
        <div>
          <div>Всього: {stats.total}</div>
          <img src={chartUrl()} alt={`chart-${year}`} style={{maxWidth:'100%'}} />
        </div>
      )}
      {/* Flourish embed removed per request */}
    </div>
  )
}
