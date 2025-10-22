import React, {useEffect, useState} from 'react'
import YearTab from './YearTab'
import axios from 'axios'
import SoldiersList from './SoldiersList'
import SoldierForm from './SoldierForm'


export default function YearPage({year, api}){
  const [soldiers, setSoldiers] = useState([])
  const [editing, setEditing] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetch = async () => {
    try{
      const res = await axios.get(`${api}/soldiers?yearOut=${year}`)
      setSoldiers(res.data)
    }catch(e){ console.error(e) }
  }

  useEffect(()=>{ fetch() }, [refreshKey])

  const onSaved = ()=> setRefreshKey(k=>k+1)

  return (
    <div>
      <YearTab year={year} api={api} refreshList={()=>setRefreshKey(k=>k+1)} />
      <div className="year-layout">
        <aside className="year-left">
          <SoldierForm onSaved={onSaved} editing={editing} setEditing={setEditing} api={api} year={year} />
          {/* Compact preview removed — show main search/list immediately */}
        </aside>
        <main className="year-right">
          <SoldiersList soldiers={soldiers} refresh={fetch} setEditing={setEditing} api={api} year={year} />
        </main>
      </div>
    </div>
  )
}
