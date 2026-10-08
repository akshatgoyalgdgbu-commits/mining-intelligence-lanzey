/**
 * Panel 16 — Audit Trail & Data Lineage
 * Timestamp table, department filter, source traceability.
 * Shows all actions: uploads, logins, report generations, queries.
 */

import { useState } from 'react'
import { ClipboardList, RefreshCw, Search, Filter } from 'lucide-react'
import { ScrollReveal }  from '@/components/common/ScrollReveal'
import { KpiCard }       from '@/components/dashboard/KpiCard'
import { ApiState }      from '@/components/common/ApiState'
import { useFetch }      from '@/hooks/useFetch'
import { adminApi }      from '@/services/api'

const ACTION_COLOR: Record<string, string> = {
  LOGIN:           'text-coal-green  bg-coal-green/10  border-coal-green/20',
  LOGOUT:          'text-[#6b7280]   bg-[#1c3828]       border-[#1c3828]',
  UPLOAD:          'text-[#29b6f6]   bg-[#29b6f6]/10   border-[#29b6f6]/20',
  GENERATE_REPORT: 'text-[#ffb300]   bg-[#ffb300]/10   border-[#ffb300]/20',
  QUERY:           'text-[#7c4dff]   bg-[#7c4dff]/10   border-[#7c4dff]/20',
  DELETE:          'text-red-400     bg-red-500/10      border-red-500/20',
}

export function AuditTrailPage() {
  const [deptFilter,   setDeptFilter]   = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [searchQ,      setSearchQ]      = useState('')

  const activityQ = useFetch(() => adminApi.activity())
  const statsQ    = useFetch(() => adminApi.stats())

  const logs = (activityQ.data?.logs || []).filter(l => {
    const matchDept   = !deptFilter   || l.user?.role?.toLowerCase().includes(deptFilter.toLowerCase())
    const matchAction = !actionFilter || l.action === actionFilter
    const matchSearch = !searchQ      || l.action.toLowerCase().includes(searchQ.toLowerCase()) ||
                        l.user?.name?.toLowerCase().includes(searchQ.toLowerCase())
    return matchDept && matchAction && matchSearch
  })

  const stats = statsQ.data

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ScrollReveal className="mb-6">
        <p className="text-coal-green text-xs font-semibold tracking-widest uppercase mb-1">
          Audit & Compliance
        </p>
        <h1 className="text-white text-2xl font-bold">Audit Trail & Data Lineage</h1>
        <p className="text-[#6b7280] text-sm mt-1">
          Track all system actions, document uploads, report generations and user activity with full source traceability.
        </p>
      </ScrollReveal>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Events"   value={activityQ.data?.logs?.length || 0} delay={0}   />
        <KpiCard label="Total Users"    value={stats?.users || 0}                  delay={80}  />
        <KpiCard label="Documents"      value={stats?.docs || 0}                   delay={160} />
        <KpiCard label="Reports"        value={stats?.reports || 0}                delay={240} />
      </div>

      {/* Filters */}
      <ScrollReveal className="mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-[#122318] border border-[#1c3828] rounded-lg px-3 py-2 flex-1 min-w-[180px]">
            <Search size={12} className="text-[#6b7280]" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Search events..." className="bg-transparent text-white text-xs focus:outline-none flex-1" />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="bg-[#122318] border border-[#1c3828] rounded-lg px-3 py-2 text-white text-xs focus:outline-none">
            <option value="">All Departments</option>
            {['ADMIN','CIL','CMPDI','GEOLOGICAL','ENVIRONMENT','MACHINERY','RESERVE_CHECKER'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="bg-[#122318] border border-[#1c3828] rounded-lg px-3 py-2 text-white text-xs focus:outline-none">
            <option value="">All Actions</option>
            {['LOGIN','LOGOUT','UPLOAD','GENERATE_REPORT','QUERY','DELETE'].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button onClick={activityQ.refetch}
            className="flex items-center gap-1.5 text-[#6b7280] hover:text-white text-xs transition-colors">
            <RefreshCw size={12} /> Refresh
          </button>
          <span className="text-[#6b7280] text-xs ml-auto">{logs.length} events</span>
        </div>
      </ScrollReveal>

      {/* Audit table */}
      <ScrollReveal>
        <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{ background: '#0e1f16' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1c3828]">
                {['Timestamp','User','Role','Action','Entity','Source / Detail'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[#6b7280] text-[10px] font-semibold uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <ApiState loading={activityQ.loading} error={activityQ.error}
                empty={logs.length === 0} emptyMsg="No audit events found.">
                <>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-[#1c3828]/40 last:border-0 hover:bg-coal-green/[0.03] transition-colors">
                      <td className="px-4 py-3 text-[#9ab5a0] text-xs tabular-nums whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-white text-xs font-medium">{log.user?.name || 'System'}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-1.5 py-0.5 rounded border text-[#9ab5a0] border-[#1c3828]">
                          {log.user?.role || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${ACTION_COLOR[log.action] || 'text-[#6b7280] border-[#1c3828]'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#9ab5a0] text-xs">{log.entity || '—'}</td>
                      <td className="px-4 py-3 text-[#6b7280] text-xs truncate max-w-[200px]">
                        {log.user?.email || '—'}
                      </td>
                    </tr>
                  ))}
                </>
              </ApiState>
            </tbody>
          </table>
        </div>
      </ScrollReveal>
    </div>
  )
}
