/**
 * Panel 4 — Main Dashboard (CIL View)
 * KPIs: Total Production, Active Projects, Risk Alerts, Documents
 * Production Trend chart (bar), Mines Overview table, Active Projects.
 * All data from real API.
 */

import { useState } from 'react'
import {
  TrendingUp, AlertTriangle, FileText, BarChart3,
  RefreshCw, Eye, ChevronRight, Activity, MapPin,
} from 'lucide-react'
import { ScrollReveal }    from '@/components/common/ScrollReveal'
import { KpiCard }         from '@/components/dashboard/KpiCard'
import { KpiCardSkeleton } from '@/components/common/Skeleton'
import { ApiState }        from '@/components/common/ApiState'
import { useFetch }        from '@/hooks/useFetch'
import { productionApi, riskApi, documentsApi, sitesApi, type TrendPoint } from '@/services/api'
import { useReducedMotion } from '@/hooks'
import { useAuth }          from '@/context/AuthContext'
import { Link }             from 'react-router-dom'

function ProductionChart({ trend, reduced }: { trend: TrendPoint[]; reduced: boolean }) {
  if (!trend.length) return <p className="text-[#6b7280] text-xs py-8 text-center">No production data.</p>
  const max = Math.max(...trend.map(t => t.productionMT), 1)
  const maxT = Math.max(...trend.map(t => t.targetMT || 0), 1)
  const chartMax = Math.max(max, maxT)

  return (
    <div>
      {/* Legend */}
      <div className="flex gap-4 mb-3">
        {[
          { color: '#00c853', label: 'Actual' },
          { color: '#1c3828', label: 'Target' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-2.5 rounded-sm" style={{ background: l.color }} />
            <span className="text-[#6b7280] text-[10px]">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Bars */}
      <div className="flex items-end gap-2 h-36">
        {trend.map((t, i) => (
          <div key={t.year} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[#9ab5a0] text-[10px] font-semibold tabular-nums">
              {t.productionMT.toFixed(0)}
            </span>
            <div className="w-full flex gap-0.5 items-end" style={{ height: '100%' }}>
              {/* Target bar */}
              {t.targetMT > 0 && (
                <div className="w-2/5 rounded-t-sm"
                  style={{
                    background: '#1c3828',
                    height: `${Math.max((t.targetMT / chartMax) * 100, 3)}%`,
                    transition: reduced ? 'none' : `height 700ms cubic-bezier(0.4,0,0.2,1) ${i*80}ms`,
                  }} />
              )}
              {/* Actual bar */}
              <div className="flex-1 rounded-t-sm"
                style={{
                  background: t.productionMT >= (t.targetMT || 0) ? '#00c853' : '#00c853bb',
                  height: `${Math.max((t.productionMT / chartMax) * 100, 3)}%`,
                  transition: reduced ? 'none' : `height 700ms cubic-bezier(0.4,0,0.2,1) ${i*80}ms`,
                }} />
            </div>
            <span className="text-[#6b7280] text-[10px]">{t.year}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user }    = useAuth()
  const reduced     = useReducedMotion()
  const [period, setPeriod] = useState('Last 12 Months')

  const summaryQ = useFetch(() => productionApi.summary())
  const trendQ   = useFetch(() => productionApi.trend({ years: '5' }))
  const riskQ    = useFetch(() => riskApi.summary())
  const docsQ    = useFetch(() => documentsApi.list({ limit: '5' }))
  const sitesQ   = useFetch(() => sitesApi.list())

  const summary = summaryQ.data
  const trend   = trendQ.data?.trend || []
  const risk    = riskQ.data
  const docs    = docsQ.data?.documents || []
  const sites   = sitesQ.data?.sites || []

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <p className="text-coal-green text-xs font-semibold tracking-widest uppercase mb-0.5">
            Coal India Limited (CIL)
          </p>
          <h1 className="text-white text-xl font-bold">Operations Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="bg-[#122318] border border-[#1c3828] rounded-lg px-3 py-1.5 text-white text-xs
              focus:outline-none focus:border-coal-green/40">
            {['Last 12 Months','Last 6 Months','FY 2025-26'].map(p => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <button onClick={() => { summaryQ.refetch(); trendQ.refetch() }}
            className="flex items-center gap-1.5 text-[#6b7280] hover:text-white text-xs transition-colors">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryQ.loading
          ? Array.from({length:4}).map((_,i) => <KpiCardSkeleton key={i} delay={i*80} />)
          : <>
              <KpiCard label="Total Production" value={summary?.totalProductionMT || 0} decimals={1} suffix=" MT"
                trend="up" trendValue={`${summary?.achievementPct || 0}%`} trendLabel="achievement" delay={0} />
              <KpiCard label="Active Projects"  value={summary?.totalSites || 0}
                trend="flat" trendLabel="mine sites" delay={80} />
              <KpiCard label="Risk Alerts"      value={(risk?.critical || 0) + (risk?.high || 0)}
                trend={(risk?.critical || 0) > 0 ? 'up' : 'flat'} trendLabel="open issues" delay={160} />
              <KpiCard label="Documents"        value={docsQ.data?.total || 0}
                trend="up" trendLabel="indexed" delay={240} />
            </>
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Production Trend Chart */}
        <div className="lg:col-span-2 space-y-5">
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] p-5" style={{ background: '#0e1f16' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white text-sm font-semibold">Production Trend (MT)</p>
                  <p className="text-[#6b7280] text-xs">5-year actual vs target</p>
                </div>
                <TrendingUp size={16} className="text-coal-green" />
              </div>
              <ApiState loading={trendQ.loading} error={trendQ.error}
                empty={trend.length === 0} emptyMsg="No trend data." onRetry={trendQ.refetch}>
                <ProductionChart trend={trend} reduced={reduced} />
              </ApiState>
            </div>
          </ScrollReveal>

          {/* Recent documents */}
          <ScrollReveal delay={80}>
            <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{ background: '#0e1f16' }}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1c3828]">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-[#6b7280]" />
                  <p className="text-white text-sm font-semibold">Recent Documents</p>
                </div>
                <Link to="/documents" className="text-coal-green text-xs hover:underline">View all →</Link>
              </div>
              <ApiState loading={docsQ.loading} error={docsQ.error}
                empty={docs.length === 0} emptyMsg="No documents yet.">
                <div className="divide-y divide-[#1c3828]/50">
                  {docs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 px-5 py-3 hover:bg-coal-green/[0.03] transition-colors">
                      <FileText size={12} className="text-[#6b7280] flex-shrink-0" />
                      <span className="text-[#9ab5a0] text-xs flex-1 truncate">{doc.originalName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border flex-shrink-0 ${
                        doc.status === 'READY' ? 'bg-coal-green/10 text-coal-green border-coal-green/20' :
                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </ApiState>
            </div>
          </ScrollReveal>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Mines Overview */}
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{ background: '#0e1f16' }}>
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1c3828]">
                <p className="text-white text-sm font-semibold">Mines Overview</p>
                <span className="text-[#6b7280] text-xs">{sites.length} total</span>
              </div>
              <ApiState loading={sitesQ.loading} error={sitesQ.error}
                empty={sites.length === 0} emptyMsg="No mines data.">
                <div className="divide-y divide-[#1c3828]/50 max-h-56 overflow-y-auto">
                  {sites.map(s => (
                    <div key={s.id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-coal-green/[0.03] transition-colors">
                      <MapPin size={11} className="text-coal-green flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{s.name}</p>
                        <p className="text-[#6b7280] text-[10px]">{s.state} · {s.company}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border capitalize flex-shrink-0 ${
                        s.type === 'opencast' ? 'text-coal-green border-coal-green/20' : 'text-[#9ab5a0] border-[#1c3828]'}`}>
                        {s.type}
                      </span>
                    </div>
                  ))}
                </div>
              </ApiState>
            </div>
          </ScrollReveal>

          {/* Risk summary */}
          <ScrollReveal delay={80}>
            <div className="rounded-xl border border-[#1c3828] p-4" style={{ background: '#0e1f16' }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-orange-400" />
                <p className="text-white text-sm font-semibold">Risk Summary</p>
              </div>
              <ApiState loading={riskQ.loading} error={riskQ.error} empty={!risk} emptyMsg="No risk data.">
                <div className="space-y-2">
                  {[
                    { label: 'Critical', value: risk?.critical || 0, color: 'bg-red-500' },
                    { label: 'High',     value: risk?.high     || 0, color: 'bg-orange-400' },
                    { label: 'Medium',   value: risk?.medium   || 0, color: 'bg-yellow-400' },
                    { label: 'Low',      value: risk?.low      || 0, color: 'bg-coal-green' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center gap-2">
                      <span className="text-[#9ab5a0] text-xs w-14">{r.label}</span>
                      <div className="flex-1 bg-[#1c3828] rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${r.color}`}
                          style={{ width: `${risk?.total ? (r.value / risk.total) * 100 : 0}%`,
                            transition: reduced ? 'none' : 'width 700ms ease-out' }} />
                      </div>
                      <span className="text-white text-xs font-bold w-5 text-right">{r.value}</span>
                    </div>
                  ))}
                </div>
              </ApiState>
            </div>
          </ScrollReveal>

          {/* Quick links */}
          <ScrollReveal delay={120}>
            <div className="rounded-xl border border-[#1c3828] p-4" style={{ background: '#0e1f16' }}>
              <p className="text-white text-sm font-semibold mb-3">Quick Actions</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Upload Document',  href: '/documents',         icon: FileText    },
                  { label: 'Ask LANZEY',       href: '/ask',                icon: Activity    },
                  { label: 'Risk Intelligence',href: '/risk',               icon: AlertTriangle},
                  { label: 'Generate Report',  href: '/reports/generate',   icon: BarChart3   },
                ].map(a => (
                  <Link key={a.href} to={a.href}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-coal-green/[0.06] transition-colors group">
                    <a.icon size={13} className="text-[#6b7280] group-hover:text-coal-green transition-colors" />
                    <span className="text-[#9ab5a0] text-xs group-hover:text-white transition-colors">{a.label}</span>
                    <ChevronRight size={11} className="text-[#6b7280] ml-auto" />
                  </Link>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
