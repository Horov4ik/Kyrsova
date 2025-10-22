import React, {useState} from 'react'
import axios from 'axios'

export default function SoldiersList({soldiers, refresh, setEditing, api, year, compact=false, maxItems=6, hideControls=false}){
  const [q, setQ] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [exportErr, setExportErr] = useState(null)

  const del = async (id) => {
    if (!confirm('Видалити запис?')) return;
    await axios.delete(`${api}/soldiers/${id}`)
    refresh()
  }

  const exportCsv = async () => {
    setExportErr(null)
    try{
      const exportUrl = `${api}/export` + (year ? `?yearOut=${year}` : '')
      const res = await axios.get(exportUrl, { responseType: 'blob' })
      const blob = new Blob([res.data])
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      const filename = `soldiers${year ? '_' + year : ''}.csv`
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    }catch(e){
      if (e.response?.data?.error === 'No token' || e.response?.status === 401) setExportErr('Будь ласка, увійдіть у систему для експорту.')
      else setExportErr('Помилка експорту: ' + (e.message||''))
    }
  }

  const stripDigits = (v) => v ? v.toString().replace(/\d+/g,'').replace(/\s+/g,' ').trim() : ''
  const fmtUnitNumber = (u) => {
    if (!u) return ''
    return u.toString().replace(/\D+/g,'')
  }

  const filtered = soldiers.map(s => ({...s, fullName: stripDigits(s.fullName)})).filter(s => {
    if (!q) return true;
    return [s.fullName, s.rank, s.specialty].join(' ').toLowerCase().includes(q.toLowerCase())
  })

  const visible = compact ? filtered.slice(0, maxItems) : (showAll ? filtered : filtered.slice(0,10))

  return (
    <div>
      {exportErr && <div className="alert alert-warning">{exportErr}</div>}
      {!hideControls && (
        <div className="d-flex mb-2 align-items-center">
          <input className="form-control me-2" placeholder="Пошук за ім'ям, званням, спеціальністю" value={q} onChange={e=>setQ(e.target.value)} />
          <button className="btn btn-outline-secondary me-2" onClick={exportCsv}>Експорт CSV</button>
          {!compact && (
            <button className="btn btn-sm btn-outline-primary" onClick={()=>setShowAll(s=>!s)}>{showAll ? 'Сховати всіх' : `Показати всіх (${filtered.length})`}</button>
          )}
        </div>
      )}

      <div className="soldiers-grid">
        {visible.map(s => (
          <div key={s._id} className="soldier-card animate-fadein">
            <div className="card-body p-2">
              <div className="fw-bold">{s.fullName} <small className="text-muted">({s.rank})</small></div>
              <div className="text-muted small">{s.specialty}{s.position ? `, ${s.position}` : ''}</div>
              <div className="mt-2 small text-muted">№ в/ч: {fmtUnitNumber(s.unitNumber) || '-' }{s.unitName ? ` | Назва в/ч: ${s.unitName}` : ''}</div>
            </div>
            <div className="card-footer p-2 d-flex justify-content-end gap-1">
              <button className="btn btn-sm btn-primary" onClick={()=>setEditing(s)}>Редагувати</button>
              <button className="btn btn-sm btn-danger" onClick={()=>del(s._id)}>Видалити</button>
            </div>
          </div>
        ))}
      </div>
      {!compact && (
        <div className="mt-2">
          {/* keep bottom fallback toggle for accessibility */}
          {!showAll && filtered.length>10 && <button className="btn btn-sm btn-link" onClick={()=>setShowAll(true)}>Показати всіх ({filtered.length})</button>}
          {showAll && <button className="btn btn-sm btn-link" onClick={()=>setShowAll(false)}>Сховати всіх</button>}
        </div>
      )}
    </div>
  )
}
