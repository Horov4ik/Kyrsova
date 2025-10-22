import React, {useEffect, useState} from 'react'
import axios from 'axios'

const UNIT_OPTIONS = [
  'ЗСУ', 'ГУР', 'СЗРУ', 'ССО', 'ДШВ', 'МП', 'ВПС', 'ВМС', 'НГУ', 'СБУ', 'СБС', 'ГШ', 'МОУ','ДПСУ','Інші'
]

const RANK_OPTIONS = ['Лейтенант']
const POSITION_OPTIONS = ['Командир взводу','Командир роти','Начальник служби','Офіцер розвідки','Інженер-офіцер']

const UNIT_BY_GRADE = {
  3: ['ЗСУ','НГУ','ДПСУ','Інші'],
  4: ['ДШВ','МП','ВМС','ВПС','СБС','Інші'],
  5: ['СБУ','ГУР','СЗРУ','ГШ','МОУ', 'ВМС','ВПС','СБС','Інші']
}

function sanitizeName(name){
  if (!name) return ''
  return name.toString().replace(/\d+/g,'').replace(/\s+/g,' ').trim()
}

export default function SoldierForm({onSaved, editing, setEditing, api, year}){
  const [form, setForm] = useState({fullName:'', rank:'Лейтенант', specialty:'', yearIn:'', yearOut: year || '', averageGrade: '', unit:'', unitNumber:'', unitName:'', position:''})

  useEffect(()=>{
    if (editing) setForm({...editing, fullName: sanitizeName(editing.fullName)})
    else setForm(f => ({...f, yearOut: year || f.yearOut}))
  }, [editing, year])

  const save = async (e) =>{
    e.preventDefault()
    try{
      const payload = {...form}
      // sanitize full name: remove digits and excess spaces
      payload.fullName = sanitizeName(payload.fullName)
      if (!payload.yearOut) payload.yearOut = year || form.yearOut
      if (editing && editing._id) {
        await axios.put(`${api}/soldiers/${editing._id}`, payload)
      } else {
        await axios.post(`${api}/soldiers`, payload)
      }
      setForm({fullName:'', rank:'Лейтенант', specialty:'', yearIn:'', yearOut: year || '', averageGrade: '', unit:'', unitNumber:'', unitName:'', position:''})
      onSaved()
    }catch(err){
      console.error(err)
      const msg = err.response?.data?.error || err.message
      if (err.response?.status === 401 || msg === 'No token'){
        alert('Будь ласка, увійдіть, щоб зберегти запис.')
        window.location.href = '/'
        return
      }
      alert('Не вдалося зберегти: ' + msg)
    }
  }

  return (
    <form onSubmit={save} className="card p-3">
      <h5>{editing? 'Редагувати військовослужбовця' : 'Додати військовослужбовця'}</h5>
      <div className="mb-2">
        <input className="form-control" placeholder="ПІБ" value={form.fullName} onChange={e=>setForm({...form, fullName:e.target.value})} required />
      </div>
      <div className="mb-2 d-flex gap-2">
        <select className="form-select" value={form.rank} onChange={e=>setForm({...form, rank:e.target.value})} required>
          <option value="Лейтенант">Лейтенант</option>
        </select>
        <input className="form-control" placeholder="Спеціальність" value={form.specialty} onChange={e=>setForm({...form, specialty:e.target.value})} required />
      </div>
      <div className="mb-2 d-flex gap-2">
        <select className="form-select" value={form.averageGrade || ''} onChange={e=>setForm({...form, averageGrade: parseInt(e.target.value||'0',10)})} required>
          <option value="">-- Сер. бал --</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
        </select>
        <input className="form-control" placeholder="Посада" value={form.position || ''} onChange={e=>setForm({...form, position:e.target.value})} required />
      </div>
      <div className="mb-2 d-flex gap-2">
        <input className="form-control" type="number" placeholder="Рік вступу" value={form.yearIn || ''} onChange={e=>setForm({...form, yearIn:e.target.value})} />
        <input className="form-control" type="number" placeholder="Рік випуску" value={form.yearOut || ''} onChange={e=>setForm({...form, yearOut:e.target.value})} />
      </div>
      <div className="mb-2 d-flex gap-2">
        <select className="form-select" value={form.unit || ''} onChange={e=>setForm({...form, unit:e.target.value})}>
          <option value="">-- Підрозділ --</option>
          {(() => {
            const g = parseInt(form.averageGrade || '0', 10)
            let allowed = []
            if (g >= 5) {
              // grade 5 can choose units for grades 3,4 and 5
              allowed = Array.from(new Set([...(UNIT_BY_GRADE[3]||[]), ...(UNIT_BY_GRADE[4]||[]), ...(UNIT_BY_GRADE[5]||[])]))
            } else if (g === 4) {
              // 4 can choose 3 and 4
              allowed = Array.from(new Set([...(UNIT_BY_GRADE[3]||[]), ...(UNIT_BY_GRADE[4]||[])]))
            } else if (g === 3) {
              allowed = UNIT_BY_GRADE[3] || []
            } else {
              allowed = UNIT_OPTIONS
            }
            return (allowed.length ? allowed : UNIT_OPTIONS).map(u => <option key={u} value={u}>{u}</option>)
          })()}
        </select>
        <input className="form-control" placeholder="№ в/ч" value={form.unitNumber || ''} onChange={e=>setForm({...form, unitNumber:e.target.value})} />
      </div>
      <div className="mb-2">
        <input className="form-control" placeholder="Назва в/ч" value={form.unitName || ''} onChange={e=>setForm({...form, unitName:e.target.value})} />
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-success" type="submit">Зберегти</button>
  <button type="button" className="btn btn-secondary" onClick={()=>{ setEditing(null); setForm({fullName:'', rank:'', specialty:'', yearIn:'', yearOut: year || '', averageGrade:'', unit:'', unitNumber:'', unitName:'', position:''})}}>Скасувати</button>
      </div>
    </form>
  )
}
