/**
 * Knowledge Base Page
 * Browse all AI-extracted fields from processed documents.
 * Filter by department, field name, mine/site.
 * Shows trend for numeric fields.
 * Links to source documents, Ask LANZEY, and Report Generator.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Database, Search, TrendingUp, FileText, RefreshCw, ArrowRight } from 'lucide-react'
import { ScrollReveal }    from '@/components/common/ScrollReveal'
import { KpiCard }         from '@/components/dashboard/KpiCard'
import { KpiCardSkeleton } from '@/components/common/Skeleton'
import { ApiState }        from '@/components/common/ApiState'
import { useFetch }        from '@/hooks/useFetch'
import { knowledgeApi, sitesApi } from '@/services/api'
import { useAuth }         from '@/context/AuthContext'

export function KnowledgeBasePage() {
  const { user }   = useAuth()
  const [dept,     setDept]     = useState(user?.department || '')
  const [siteId,   setSiteId]   = useState('')
  const [fieldQ,   setFieldQ]   = useState('')
  const [searchQ,  setSearchQ]  = useState('')
  const [page,     setPage]     = useState(1)

  const summaryQ  = useFetch(() => knowledgeApi.summary(dept ? { department: dept } : {}), [dept])
  const entriesQ  = useFetch(() => knowledgeApi.list({
    ...(dept    ? { department: dept }    : {}),
    ...(siteId  ? { siteId }              : {}),
    ...(fieldQ  ? { fieldName: fieldQ }   : {}),
    page: String(page), limit: '40',
  }), [dept, siteId, fieldQ, page])
  const searchQ2  = useFetch(() =>
    searchQ.length >= 2 ? knowledgeApi.search(searchQ, dept ? { department: dept } : {}) : Promise.resolve(null),
  [searchQ, dept])
  const sitesQ    = useFetch(() => sitesApi.list())

  const summary   = summaryQ.data
  const entries   = entriesQ.data?.entries || []
  const total     = entriesQ.data?.total || 0
  const sites     = sitesQ.data?.sites || []
  const searchRes = searchQ2.data?.results || []

  const FIELD_LABELS: Record<string, string> = {
    productionMT: 'Production (MT)', targetMT: 'Target (MT)', gcvKcal: 'GCV (kcal/kg)',
    grade: 'Coal Grade', depthM: 'Depth (m)', ashPct: 'Ash %',
    totalReserveMT: 'Total Reserve (MT)', mineableReserveMT: 'Mineable Reserve (MT)',
    complianceStatus: 'Compliance', availabilityPct: 'Availability %',
    spmUgM3: 'SPM (µg/m³)', so2UgM3: 'SO₂ (µg/m³)', pH: 'pH',
    ltiCount: 'LTI Count', mineName: 'Mine Name', year: 'Year',
  }

  const topFields = summary?.topFields || []

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">

      <ScrollReveal className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Database size={18} className="text-coal-green" />
          <p className="text-coal-green text-xs font-semibold tracking-widest uppercase">Knowledge Base</p>
        </div>
        <h1 className="text-white text-2xl font-bold">Extracted Intelligence</h1>
        <p className="text-coal-muted text-sm mt-1">
          All structured fields extracted from processed documents. Search, filter by department, and trace every value back to its source.
        </p>
      </ScrollReveal>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {summaryQ.loading
          ? Array.from({length:4}).map((_,i) => <KpiCardSkeleton key={i} delay={i*80} />)
          : <>
              <KpiCard label="Total Fields"    value={summary?.total || 0}                     delay={0}   />
              <KpiCard label="Departments"     value={summary?.byDepartment?.length || 0}       delay={80}  />
              <KpiCard label="Source Docs"     value={summary?.recentDocuments?.length || 0}   delay={160} />
              <KpiCard label="Field Types"     value={summary?.topFields?.length || 0}          delay={240} />
            </>
        }
      </div>

      {/* Filters row */}
      <ScrollReveal className="mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex items-center gap-2 bg-coal-card border border-coal-border rounded-lg px-3 py-2 flex-1 min-w-[200px]">
            <Search size={13} className="text-coal-muted flex-shrink-0" />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search field values..."
              className="bg-transparent text-white text-xs placeholder:text-coal-muted focus:outline-none flex-1"
            />
          </div>

          {/* Department filter */}
          <select value={dept} onChange={e => { setDept(e.target.value); setPage(1) }}
            className="bg-coal-card border border-coal-border rounded-lg px-3 py-2 text-white text-xs focus:outline-none">
            <option value="">All Departments</option>
            {['geological','cil','cmpdi','environment','machinery','reserve','admin'].map(d => (
              <option key={d} value={d} className="capitalize">{d}</option>
            ))}
          </select>

          {/* Site filter */}
          <select value={siteId} onChange={e => { setSiteId(e.target.value); setPage(1) }}
            className="bg-coal-card border border-coal-border rounded-lg px-3 py-2 text-white text-xs focus:outline-none">
            <option value="">All Sites</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {/* Field name filter */}
          <select value={fieldQ} onChange={e => { setFieldQ(e.target.value); setPage(1) }}
            className="bg-coal-card border border-coal-border rounded-lg px-3 py-2 text-white text-xs focus:outline-none">
            <option value="">All Fields</option>
            {topFields.map(f => (
              <option key={f.fieldName} value={f.fieldName}>
                {FIELD_LABELS[f.fieldName] || f.fieldName} ({f._count.id})
              </option>
            ))}
          </select>

          <button onClick={() => { summaryQ.refetch(); entriesQ.refetch() }}
            className="btn-ghost text-xs gap-1">
            <RefreshCw size={12} />
          </button>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">

        {/* LEFT: field type sidebar */}
        <div className="xl:col-span-1">
          <ScrollReveal>
            <div className="bg-coal-card border border-coal-border rounded-xl p-4">
              <p className="text-white text-xs font-semibold mb-3">Field Types</p>
              {topFields.length === 0
                ? <p className="text-coal-muted text-xs">No fields yet.</p>
                : topFields.map(f => (
                  <button key={f.fieldName}
                    onClick={() => setFieldQ(prev => prev === f.fieldName ? '' : f.fieldName)}
                    className={[
                      'w-full flex items-center justify-between px-2.5 py-2 rounded-lg mb-1',
                      'text-xs transition-all duration-150',
                      fieldQ === f.fieldName
                        ? 'bg-coal-green/10 text-coal-green border border-coal-green/20'
                        : 'text-coal-subtle hover:bg-coal-surface hover:text-white',
                    ].join(' ')}>
                    <span className="truncate">{FIELD_LABELS[f.fieldName] || f.fieldName}</span>
                    <span className="text-[10px] ml-2 flex-shrink-0 opacity-60">{f._count.id}</span>
                  </button>
                ))
              }
            </div>
          </ScrollReveal>

          {/* Dept breakdown */}
          {summary?.byDepartment && summary.byDepartment.length > 0 && (
            <ScrollReveal className="mt-4" delay={80}>
              <div className="bg-coal-card border border-coal-border rounded-xl p-4">
                <p className="text-white text-xs font-semibold mb-3">By Department</p>
                {summary.byDepartment.map(d => (
                  <button key={d.department}
                    onClick={() => setDept(prev => prev === d.department ? '' : d.department)}
                    className={[
                      'w-full flex items-center justify-between px-2.5 py-2 rounded-lg mb-1 text-xs',
                      dept === d.department
                        ? 'bg-coal-green/10 text-coal-green border border-coal-green/20'
                        : 'text-coal-subtle hover:bg-coal-surface hover:text-white',
                    ].join(' ')}>
                    <span className="capitalize">{d.department}</span>
                    <span className="text-[10px] opacity-60">{d._count.id}</span>
                  </button>
                ))}
              </div>
            </ScrollReveal>
          )}
        </div>

        {/* RIGHT: entries table */}
        <div className="xl:col-span-3">
          <ScrollReveal>
            <div className="bg-coal-card border border-coal-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-coal-border">
                <p className="text-white text-sm font-semibold">
                  {searchQ.length >= 2 ? `Search: "${searchQ}" (${searchRes.length})` : `Entries (${total})`}
                </p>
                <div className="flex gap-2">
                  <Link to="/ask" className="btn-ghost text-xs py-1 px-2 gap-1">
                    Ask LANZEY
                  </Link>
                  <Link to="/reports/generate" className="btn-primary text-xs py-1.5 px-3 gap-1">
                    Generate Report <ArrowRight size={11} />
                  </Link>
                </div>
              </div>

              <ApiState
                loading={entriesQ.loading}
                error={entriesQ.error}
                empty={entries.length === 0 && searchRes.length === 0}
                emptyMsg="No knowledge entries found. Upload and process documents to populate the knowledge base."
                onRetry={entriesQ.refetch}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-coal-border">
                        {['Field', 'Value', 'Department', 'Site', 'Source Document', 'Confidence'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-coal-muted text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(searchQ.length >= 2 ? searchRes : entries).map(entry => (
                        <tr key={entry.id} className="table-row-interactive border-b border-coal-border/50 last:border-0">
                          <td className="px-4 py-3">
                            <span className="text-white text-xs font-medium">
                              {FIELD_LABELS[entry.fieldName] || entry.fieldName}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-coal-green text-xs font-semibold">
                              {entry.fieldValue.length > 40
                                ? entry.fieldValue.slice(0,38)+'…'
                                : entry.fieldValue}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-coal-subtle text-xs capitalize">{entry.department}</td>
                          <td className="px-4 py-3 text-coal-subtle text-xs">{entry.site?.name || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <FileText size={11} className="text-coal-muted flex-shrink-0" />
                              <span className="text-coal-subtle text-[11px] truncate max-w-[160px]"
                                title={entry.document?.originalName}>
                                {entry.document?.originalName || '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 bg-coal-border/50 rounded-full h-1 w-12 overflow-hidden">
                                <div className="h-full bg-coal-green rounded-full"
                                  style={{ width: `${((entry.confidence || 0.8) * 100)}%` }} />
                              </div>
                              <span className="text-coal-muted text-[10px] tabular-nums">
                                {Math.round((entry.confidence || 0.8) * 100)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {!searchQ && total > 40 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-coal-border">
                    <span className="text-coal-muted text-xs">
                      Page {page} of {Math.ceil(total/40)}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                        className="btn-ghost text-xs py-1 px-2 disabled:opacity-40">← Prev</button>
                      <button onClick={() => setPage(p => p+1)} disabled={page >= Math.ceil(total/40)}
                        className="btn-ghost text-xs py-1 px-2 disabled:opacity-40">Next →</button>
                    </div>
                  </div>
                )}
              </ApiState>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
