import { useState, useEffect } from 'react'
import { Trash2, X, AlertCircle, Loader } from 'lucide-react'
import { ConfirmDialog } from '../components/ui/Controls.jsx'
import api from '../services/api.js'

const AUDIENCE_MAP = {
  'All users': 'all',
  'Free users': 'free',
  'Paid members': 'paid',
  'Weekly plan': 'weekly-plan',
  'Monthly plan': 'monthly-plan',
  'Annual plan': 'annual-plan',
}

const TRIGGER_OPTIONS = [
  { label: 'On Login', value: 'on-login' },
  { label: 'Real-Time', value: 'real-time' },
  { label: 'Scheduled', value: 'scheduled' },
]

const NOTIF_TYPES = [
  { label: 'New drama release', value: 'drama' },
  { label: 'Membership offer', value: 'membership' },
  { label: 'Reward coins', value: 'reward' },
  { label: 'Reminder', value: 'reminder' },
  { label: 'Re-engage inactive', value: 're-engage' },
  { label: 'Custom', value: 'custom' },
]

export default function Notifications() {
  const [tab, setTab] = useState('compose')
  const [audience, setAudience] = useState('All users')
  const [notifType, setNotifType] = useState('drama')
  const [trigger, setTrigger] = useState('on-login')
  const [dramaId, setDramaId] = useState('')
  const [dramas, setDramas] = useState([])
  const [loadingDramas, setLoadingDramas] = useState(false)
  const [title, setTitle] = useState('')
  const [msg, setMsg] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')
  const [ctaLink, setCtaLink] = useState('')
  const [priority, setPriority] = useState('medium')
  const [showOncePerUser, setShowOncePerUser] = useState(false)
  const [sent, setSent] = useState([])
  const [scheduled, setScheduled] = useState([])
  const [confirm, setConfirm] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)

  const charLimit = 160

  // Fetch dramas on component mount
  useEffect(() => {
    fetchDramas()
    fetchStats()
  }, [])

  const fetchDramas = async () => {
    setLoadingDramas(true)
    try {
      const response = await api.get('/v1/notifications/admin/dramas')
      if (response.data?.success) {
        setDramas(response.data.data || [])
      }
    } catch (err) {
      console.error('Error fetching dramas:', err)
      setError('Failed to load dramas')
    } finally {
      setLoadingDramas(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/v1/notifications/admin/stats')
      if (response.data?.success) {
        setStats(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const sendNow = async () => {
    if (!msg.trim()) return
    if (notifType === 'drama' && !dramaId) {
      setError('Please select a drama')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payload = {
        title: title || `${notifType} notification`,
        body: msg,
        type: notifType,
        trigger,
        audience: AUDIENCE_MAP[audience],
        drama_id: dramaId || undefined,
        ctaLink: ctaLink || undefined,
        priority,
        showOncePerUser,
      }

      const response = await api.post('/v1/notifications/admin/send', payload)
      if (response.data?.success) {
        // Add to sent list
        const newNotif = {
          id: Date.now(),
          title: title || notifType,
          audience,
          delivered: response.data.data.count || 0,
          opened: 0,
          date: new Date().toLocaleString(),
          type: notifType,
          icon: getIcon(notifType),
        }
        setSent(p => [newNotif, ...p])
        // Clear form
        setMsg('')
        setTitle('')
        setCtaLink('')
        setDramaId('')
        setScheduleAt('')
        setTab('sent')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification')
      console.error('Error sending notification:', err)
    } finally {
      setLoading(false)
    }
  }

  const scheduleNotif = async () => {
    if (!msg.trim() || !scheduleAt) return
    if (notifType === 'drama' && !dramaId) {
      setError('Please select a drama')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payload = {
        title: title || notifType,
        body: msg,
        type: notifType,
        trigger: 'scheduled',
        scheduledAt: new Date(scheduleAt).toISOString(),
        audience: AUDIENCE_MAP[audience],
        drama_id: dramaId || undefined,
        ctaLink: ctaLink || undefined,
        priority,
      }

      const response = await api.post('/v1/notifications/admin/send', payload)
      if (response.data?.success) {
        const newNotif = {
          id: Date.now(),
          title: title || notifType,
          audience,
          sendAt: new Date(scheduleAt).toLocaleString(),
          type: notifType,
        }
        setScheduled(p => [newNotif, ...p])
        setMsg('')
        setTitle('')
        setCtaLink('')
        setDramaId('')
        setScheduleAt('')
        setTab('scheduled')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule notification')
      console.error('Error scheduling notification:', err)
    } finally {
      setLoading(false)
    }
  }

  const cancelScheduled = id => { setScheduled(p => p.filter(n => n.id !== id)); setConfirm(null) }
  const deleteSent = id => { setSent(p => p.filter(n => n.id !== id)); setConfirm(null) }

  const getIcon = (type) => {
    const icons = { drama: '🎬', membership: '👑', reward: '🎁', reminder: '⏰', 're-engage': '📞', custom: '📬' }
    return icons[type] || '📬'
  }

  const TABS = ['compose', 'sent', 'scheduled', 'analytics']
  const AUDIENCES = Object.keys(AUDIENCE_MAP)

  return (
    <div className="page-enter">
      {/* Stats row */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
        {[
          { label: 'Total sent', value: stats?.totalSent || sent.length, sub: 'notifications' },
          { label: 'Avg delivery', value: '43.6K', sub: 'per notification' },
          { label: 'Avg open rate', value: stats?.openRate || '62%', sub: 'opened / delivered' },
          { label: 'Scheduled', value: scheduled.length, sub: 'pending notifications' },
        ].map(m => (
          <div className="metric-card" key={m.label}>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value" style={{ fontSize: 20 }}>{m.value}</div>
            <div className="metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 18, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: tab === t ? 600 : 400,
            color: tab === t ? 'var(--accent2)' : 'var(--text3)',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            textTransform: 'capitalize', marginBottom: -1,
          }}>{t === 'compose' ? 'Compose & Send' : t === 'analytics' ? 'Delivery Analytics' : t === 'scheduled' ? `Scheduled (${scheduled.length})` : t === 'sent' ? `Sent (${sent.length})` : t}</button>
        ))}
      </div>

      {/* Error alert */}
      {error && (
        <div style={{ background: 'var(--red)', color: 'white', padding: '12px 16px', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Compose tab */}
      {tab === 'compose' && (
        <div className="grid2">
          <div className="card">
            <div className="card-title">Send notification</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">Target audience</label>
                <select className="select" style={{ width: '100%' }} value={audience} onChange={e => setAudience(e.target.value)}>
                  {AUDIENCES.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notification type</label>
                <select className="select" style={{ width: '100%' }} value={notifType} onChange={e => setNotifType(e.target.value)}>
                  {NOTIF_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {/* Drama selection - only show for drama type */}
            {notifType === 'drama' && (
              <div className="form-group">
                <label className="form-label">Select Drama *</label>
                <select className="select" style={{ width: '100%' }} value={dramaId} onChange={e => setDramaId(e.target.value)}>
                  <option value="">Choose a drama...</option>
                  {loadingDramas ? (
                    <option disabled>Loading dramas...</option>
                  ) : dramas.length > 0 ? (
                    dramas.map(d => <option key={d.id} value={d.id}>{d.title}</option>)
                  ) : (
                    <option disabled>No dramas available</option>
                  )}
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">Trigger</label>
                <select className="select" style={{ width: '100%' }} value={trigger} onChange={e => setTrigger(e.target.value)}>
                  {TRIGGER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="select" style={{ width: '100%' }} value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Custom title (optional)</label>
              <input className="input" style={{ width: '100%' }} placeholder="Leave blank to use type as title" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form-label">Message *</label>
                <span style={{ fontSize: 11, color: msg.length > charLimit ? 'var(--red)' : 'var(--text3)' }}>{msg.length}/{charLimit}</span>
              </div>
              <textarea className="input" rows={4} style={{ width: '100%', resize: 'vertical' }}
                placeholder="Write your notification message…" value={msg} onChange={e => setMsg(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">CTA Link (optional)</label>
              <input className="input" style={{ width: '100%' }} type="url" placeholder="https://..." value={ctaLink} onChange={e => setCtaLink(e.target.value)} />
            </div>

            {trigger === 'scheduled' && (
              <div className="form-group">
                <label className="form-label">Schedule for *</label>
                <input className="input" style={{ width: '100%' }} type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)} />
              </div>
            )}

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="showOnce" checked={showOncePerUser} onChange={e => setShowOncePerUser(e.target.checked)} />
              <label htmlFor="showOnce" style={{ margin: 0, cursor: 'pointer' }}>Show once per user</label>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={sendNow} disabled={!msg.trim() || loading}>
                {loading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Send now'}
              </button>
              {trigger === 'scheduled' && (
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={scheduleNotif} disabled={!msg.trim() || !scheduleAt || loading}>
                  {loading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Schedule'}
                </button>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="card">
            <div className="card-title">Push notification preview</div>
            <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 16, border: '1px solid var(--border)', maxWidth: 320 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{getIcon(notifType)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>OTT Admin</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>now</div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{title || NOTIF_TYPES.find(t => t.value === notifType)?.label || 'Notification title'}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{msg || 'Your notification message will appear here…'}</div>
              {notifType === 'drama' && dramaId && dramas.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text3)' }}>
                  Drama: {dramas.find(d => d.id === dramaId)?.title}
                </div>
              )}
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Estimated reach</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Target', value: audience === 'All users' ? '48,291 users' : audience === 'Free users' ? '30,450 users' : '17,841 users' },
                  { label: 'Est. opens', value: audience === 'All users' ? '~29,940' : audience === 'Free users' ? '~18,879' : '~11,062' },
                ].map(r => (
                  <div key={r.label} style={{ background: 'var(--bg3)', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>{r.label}</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sent tab */}
      {tab === 'sent' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Sent notifications ({sent.length})</div>
          </div>
          {sent.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>No sent notifications yet</div>}
          {sent.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Notification</th><th>Audience</th><th>Delivered</th><th>Opened</th><th>Open rate</th><th>Sent at</th><th></th></tr></thead>
                <tbody>
                  {sent.map(n => (
                    <tr key={n.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{n.icon}</span>
                          <span style={{ fontWeight: 500, fontSize: 13 }}>{n.title}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{n.audience}</td>
                      <td style={{ fontFamily: 'var(--mono)' }}>{n.delivered.toLocaleString()}</td>
                      <td style={{ fontFamily: 'var(--mono)' }}>{n.opened.toLocaleString()}</td>
                      <td>
                        {n.delivered > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 50, height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(n.opened / n.delivered) * 100}%`, background: 'var(--green)', borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--green)' }}>{((n.opened / n.delivered) * 100).toFixed(0)}%</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{n.date}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirm({ type: 'sent', id: n.id, name: n.title })}><Trash2 size={11} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Scheduled tab */}
      {tab === 'scheduled' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Scheduled ({scheduled.length})</div>
          </div>
          {scheduled.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>No scheduled notifications</div>}
          {scheduled.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Title</th><th>Audience</th><th>Scheduled for</th><th></th></tr></thead>
                <tbody>
                  {scheduled.map(n => (
                    <tr key={n.id}>
                      <td style={{ fontWeight: 500 }}>{n.title}</td>
                      <td style={{ color: 'var(--text3)' }}>{n.audience}</td>
                      <td><span className="badge badge-amber">{n.sendAt}</span></td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirm({ type: 'scheduled', id: n.id, name: n.title })}>
                          <X size={11} /> Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Analytics tab */}
      {tab === 'analytics' && (
        <div className="grid2">
          <div className="card">
            <div className="card-title">Delivery analytics</div>
            {sent.length === 0 ? (
              <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '40px 0' }}>No notifications sent yet</div>
            ) : (
              sent.map(n => (
                <div key={n.id} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6, color: 'var(--text)' }}>{n.icon} {n.title}</div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Delivered</div>
                      <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: '100%', background: 'var(--accent)', borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{n.delivered.toLocaleString()}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Opened</div>
                      <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${n.delivered > 0 ? ((n.opened / n.delivered) * 100) : 0}%`, background: 'var(--green)', borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--green)', marginTop: 2 }}>{n.opened.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ borderBottom: '1px solid var(--border)', marginTop: 10 }} />
                </div>
              ))
            )}
          </div>
          <div className="card">
            <div className="card-title">Best performing by type</div>
            {[{ type: 'Drama alerts', rate: '65%', color: 'var(--accent2)' }, { type: 'Reward coins', rate: '80%', color: 'var(--green)' }, { type: 'Membership offers', rate: '40%', color: 'var(--amber)' }, { type: 'Reminders', rate: '55%', color: 'var(--blue)' }].map(r => (
              <div className="bar-row" key={r.type}>
                <div className="bar-lbl">{r.type}</div>
                <div className="bar-track" style={{ flex: 1 }}><div className="bar-fill" style={{ width: r.rate, background: r.color }} /></div>
                <div className="bar-val">{r.rate}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog open={!!confirm} danger
        title={confirm?.type === 'scheduled' ? 'Cancel Scheduled Notification' : 'Delete Sent Notification'}
        message={`Are you sure you want to ${confirm?.type === 'scheduled' ? 'cancel' : 'delete'} "${confirm?.name}"?`}
        onConfirm={() => confirm?.type === 'scheduled' ? cancelScheduled(confirm.id) : deleteSent(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
