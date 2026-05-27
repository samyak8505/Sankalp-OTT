import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Users, Film, DollarSign, Coins, AlertTriangle, CreditCard } from 'lucide-react'
import api from '../services/api'

const PERIODS = ['Daily', 'Weekly', 'Monthly', 'Annual']

const metricIcons = [Users, CreditCard, DollarSign, Film, Coins, Coins, AlertTriangle]

const alerts = []

export default function Dashboard() {
  const [period, setPeriod] = useState('Monthly')
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMetrics(period)
  }, [period])

  async function fetchMetrics(selectedPeriod) {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`/v1/admin/dashboard/metrics?period=${selectedPeriod}`)
      setMetrics(response.data.data?.metrics || [])
    } catch (err) {
      setError(err.response?.data?.message || err.message)
      setMetrics([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-enter">
      {/* Alerts */}
      {alerts.map((a, i) => (
        <div key={i} style={{
          display:'flex', alignItems:'center', gap:10, padding:'10px 14px', marginBottom:10,
          background: a.type==='error'?'var(--red-bg)':a.type==='warn'?'var(--amber-bg)':'var(--blue-bg)',
          border:`1px solid ${a.type==='error'?'rgba(255,92,106,0.25)':a.type==='warn'?'rgba(245,166,35,0.25)':'rgba(77,166,255,0.25)'}`,
          borderRadius:'var(--radius)', fontSize:12,
          color: a.type==='error'?'var(--red)':a.type==='warn'?'var(--amber)':'var(--blue)',
        }}>
          <AlertTriangle size={13}/>
          {a.msg}
          <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto', fontSize:11 }}>Review</button>
        </div>
      ))}

      {/* Period filter */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div style={{ fontWeight:600, fontSize:14 }}>Platform overview</div>
        <div style={{ display:'flex', gap:6 }}>
          {PERIODS.map(p => (
            <button key={p} className={`btn btn-sm ${period===p?'btn-primary':'btn-ghost'}`} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'40px' }}>
          <div style={{ animation:'spin 1s linear infinite' }}>Loading...</div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{ padding:'20px', backgroundColor:'var(--red-bg)', borderRadius:'var(--radius)', color:'var(--red)', marginBottom:20 }}>
          Error: {error}
        </div>
      )}

      {/* Metrics grid */}
      {!loading && metrics.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
          {metrics.map((m, i) => {
            const Icon = metricIcons[i] || Users
            return (
              <div key={m.label} className="metric-card" style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div className="metric-label">{m.label}</div>
                  <div style={{ width:28,height:28,borderRadius:6,background:'var(--bg4)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <Icon size={13} color="var(--text3)"/>
                  </div>
                </div>
                <div className="metric-value" style={{ fontSize:20 }}>{m.value}</div>
                <div className="metric-sub">
                  <span>{m.sub}</span>
                  {m.trend && (
                    <span style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:3, color:m.up===false?'var(--red)':m.up?'var(--green)':'var(--text3)', fontFamily:'var(--mono)', fontSize:11 }}>
                      {m.up===true?<TrendingUp size={10}/>:m.up===false?<TrendingDown size={10}/>:null}
                      {m.trend}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && metrics.length === 0 && !error && (
        <div style={{ padding:'40px', textAlign:'center', color:'var(--text3)' }}>
          No metrics available for this period
        </div>
      )}
    </div>
  )
}
