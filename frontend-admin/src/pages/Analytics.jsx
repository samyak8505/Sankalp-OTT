import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import api from '../services/api'

const PERIODS = ['Weekly', 'Monthly', 'Annual']
const REPORTS = ['subscription', 'coins', 'users', 'content', 'revenue']

const reportTitles = {
  subscription: 'Subscription report',
  coins: 'Coin usage report',
  users: 'User growth report',
  content: 'Content unlock report',
  revenue: 'Revenue by plan',
}

export default function Analytics() {
  const [period, setPeriod] = useState('Monthly')
  const [activeReport, setActiveReport] = useState('subscription')
  const [reportData, setReportData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchReportData(activeReport, period)
  }, [activeReport, period])

  async function fetchReportData(report, selectedPeriod) {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`/v1/admin/reports/${report}?period=${selectedPeriod}`)
      setReportData(response.data.data?.reportData || [])
    } catch (err) {
      setError(err.response?.data?.message || err.message)
      setReportData([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-enter">
      {/* Period + Export */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ display:'flex', gap:6 }}>
          {PERIODS.map(p => (
            <button key={p} className={`btn btn-sm ${period===p?'btn-primary':'btn-ghost'}`} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm"><Download size={12}/> Export to CSV</button>
      </div>

      {/* Report selector + details */}
      <div className="grid2">
        <div className="card">
          <div className="card-title">Select report</div>
          {REPORTS.map(r => (
            <div key={r} onClick={() => setActiveReport(r)} style={{
              padding:'10px 12px', borderRadius:'var(--radius-sm)', marginBottom:4, cursor:'pointer',
              background:activeReport===r?'var(--accent-bg)':'transparent',
              border:`1px solid ${activeReport===r?'var(--accent-border)':'transparent'}`,
              color:activeReport===r?'var(--accent2)':'var(--text2)',
              fontSize:13, fontWeight:activeReport===r?600:400,
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              {reportTitles[r]}
              {activeReport===r && <span style={{ fontSize:10 }}>▶</span>}
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div className="card-title" style={{ marginBottom:0 }}>{reportTitles[activeReport]}</div>
            <span className="badge badge-blue" style={{ fontSize:10 }}>{period}</span>
          </div>

          {loading && (
            <div style={{ textAlign:'center', padding:'20px', color:'var(--text2)' }}>Loading...</div>
          )}

          {error && !loading && (
            <div style={{ padding:'10px', backgroundColor:'var(--red-bg)', borderRadius:'var(--radius-sm)', color:'var(--red)', marginBottom:10 }}>
              Error: {error}
            </div>
          )}

          {!loading && reportData.map(r => (
            <div key={r.lbl} className="stat-row">
              <span className="stat-lbl">{r.lbl}</span>
              <span className="stat-val" style={{ color:r.color }}>{r.val}</span>
            </div>
          ))}

          {!loading && reportData.length === 0 && !error && (
            <div style={{ textAlign:'center', padding:'20px', color:'var(--text2)' }}>No data available</div>
          )}

          <button className="btn btn-ghost" style={{ marginTop:14, width:'100%' }}><Download size={12}/> Download report</button>
        </div>
      </div>

    </div>
  )
}
