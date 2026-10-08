/**
 * LANZEY API Service Layer
 * Centralises all HTTP calls to the backend.
 * Uses fetch with JWT Bearer token from localStorage.
 */

// On a single-origin deployment, keep API requests on this host. Local or
// split frontend/backend deployments can override this with VITE_API_URL.
const BASE = import.meta.env.VITE_API_URL || '/api'

// ── Token helpers ──────────────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem('lanzey_token')
}

export function setToken(token: string) {
  localStorage.setItem('lanzey_token', token)
}

export function clearToken() {
  localStorage.removeItem('lanzey_token')
  localStorage.removeItem('lanzey_user')
}

// ── Base fetch with auth ────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Session expired. Please log in again.')
  }

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`)
  }

  return data as T
}

// ── Form-data fetch (file upload) ──────────────────────────────────────
async function upload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Upload failed: ${res.status}`)
  return data as T
}

// ── Auth ────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (email: string, password: string) =>
    request<{ token: string; user: LanzeyUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me:       () => request<{ user: LanzeyUser }>('/auth/me'),
  logout:   () => request('/auth/logout', { method: 'POST' }),
  register: (data: RegisterData) =>
    request<{ token: string; user: LanzeyUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ── Sites ───────────────────────────────────────────────────────────────
export const sitesApi = {
  list:   (params?: Record<string, string>) =>
    request<{ sites: Site[] }>(`/sites${qs(params)}`),
  get:    (id: string) => request<{ site: Site }>(`/sites/${id}`),
}

// ── Documents ──────────────────────────────────────────────────────────
export const documentsApi = {
  list:   (params?: Record<string, string>) =>
    request<{ documents: Document[]; total: number }>(`/documents${qs(params)}`),
  get:    (id: string) => request<{ document: Document }>(`/documents/${id}`),
  status: (id: string) =>
    request<{ id: string; status: string; processingProgress: number; errorMessage?: string }>(`/documents/${id}/status`),
  upload: (file: File, department?: string, siteId?: string) => {
    const fd = new FormData()
    fd.append('file', file)
    if (department) fd.append('department', department)
    if (siteId)     fd.append('siteId', siteId)
    return upload<{ document: Document; message: string }>('/documents/upload', fd)
  },
  delete: (id: string) => request(`/documents/${id}`, { method: 'DELETE' }),
}

// ── Production ─────────────────────────────────────────────────────────
export const productionApi = {
  list:    (params?: Record<string, string>) =>
    request<{ records: Production[]; total: number }>(`/production${qs(params)}`),
  summary: (params?: Record<string, string>) =>
    request<ProductionSummary>(`/production/summary${qs(params)}`),
  trend:   (params?: Record<string, string>) =>
    request<{ trend: TrendPoint[] }>(`/production/trend${qs(params)}`),
  groupBy: (groupBy: string, params?: Record<string, string>) =>
    request<{ data: Record<string,unknown>[] }>(`/production${qs({ groupBy, ...params })}`),
}

// ── Geology ────────────────────────────────────────────────────────────
export const geologyApi = {
  list:    (params?: Record<string, string>) =>
    request<{ geologicalData: GeologicalData[]; seams: Seam[] }>(`/geology${qs(params)}`),
  seams:   (params?: Record<string, string>) =>
    request<{ seams: Seam[] }>(`/geology/seams${qs(params)}`),
  summary: () => request<GeologySummary>('/geology/summary'),
  detail:  (siteId: string) =>
    request<{ site: Site; geologicalData: GeologicalData[]; seams: Seam[]; reserves: Reserve[] }>(`/geology/${siteId}/detail`),
}

// ── Machinery ──────────────────────────────────────────────────────────
export const machineryApi = {
  list:        (params?: Record<string, string>) =>
    request<{ machinery: Machine[]; total: number }>(`/machinery${qs(params)}`),
  summary:     () => request<MachinerySummary>('/machinery/summary'),
  get:         (id: string) => request<{ machine: Machine }>(`/machinery/${id}`),
  telemetry:   (id: string, limit = 50) =>
    request<{ telemetry: Telemetry[] }>(`/machinery/${id}/telemetry?limit=${limit}`),
  maintenance: (id: string) =>
    request<{ maintenance: Maintenance[] }>(`/machinery/${id}/maintenance`),
}

// ── Environment ────────────────────────────────────────────────────────
export const environmentApi = {
  list:              (params?: Record<string, string>) =>
    request<{ records: EnvRecord[] }>(`/environment${qs(params)}`),
  complianceSummary: (params?: Record<string, string>) =>
    request<ComplianceSummary>(`/environment/compliance-summary${qs(params)}`),
}

// ── Reserve ────────────────────────────────────────────────────────────
export const reserveApi = {
  list:    (params?: Record<string, string>) =>
    request<{ records: Reserve[] }>(`/reserve${qs(params)}`),
  summary: (params?: Record<string, string>) =>
    request<ReserveSummary>(`/reserve/summary${qs(params)}`),
}

// ── Reports ────────────────────────────────────────────────────────────
export const reportsApi = {
  list:     (params?: Record<string, string>) =>
    request<{ reports: Report[]; total: number }>(`/reports${qs(params)}`),
  get:      (id: string) => request<{ report: Report }>(`/reports/${id}`),
  generate: (data: GenerateReportData) =>
    request<{ report: Report; message: string }>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete:   (id: string) => request(`/reports/${id}`, { method: 'DELETE' }),
}

// ── Risk ───────────────────────────────────────────────────────────────
export const riskApi = {
  list:    (params?: Record<string, string>) =>
    request<{ risks: RiskItem[]; total: number }>(`/risk${qs(params)}`),
  summary: () => request<RiskSummary>('/risk/summary'),
  get:     (id: string) => request<{ risk: RiskItem }>(`/risk/${id}`),
}

// ── Query (Ask LANZEY) ─────────────────────────────────────────────────
export const queryApi = {
  ask:      (question: string) =>
    request<QueryResult>('/query', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
  official: (data: OfficialQueryData) =>
    request<OfficialQueryResult>('/query/official', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ── Admin ─────────────────────────────────────────────────────────────
export const adminApi = {
  users:    () => request<{ users: LanzeyUser[] }>('/admin/users'),
  stats:    () => request<AdminStats>('/admin/stats'),
  activity: () => request<{ logs: AuditLog[] }>('/admin/activity'),
  updateUser: (id: string, data: Partial<LanzeyUser>) =>
    request<{ user: LanzeyUser }>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) => request(`/admin/users/${id}`, { method: 'DELETE' }),
}

// ── Health ─────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => request<{ status: string }>('/health'),
}

// ── Query string helper ────────────────────────────────────────────────
function qs(params?: Record<string, string | undefined>): string {
  if (!params) return ''
  const p = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (!p.length) return ''
  return '?' + new URLSearchParams(p as [string, string][]).toString()
}

// ── Types ──────────────────────────────────────────────────────────────
export type Role = 'ADMIN' | 'CIL' | 'CMPDI' | 'GEOLOGICAL' | 'ENVIRONMENT' | 'MACHINERY' | 'RESERVE_CHECKER'

export interface LanzeyUser {
  id:         string
  email:      string
  name:       string
  role:       Role
  department: string | null
  active?:    boolean
}

interface RegisterData {
  email: string; password: string; name: string; role: Role; department?: string
}

export interface Site {
  id: string; code: string; name: string; location?: string
  state?: string; company?: string; type?: string
}

export interface Document {
  id: string; originalName: string; mimeType: string; sizeByes: number
  status: string; department?: string; processingProgress?: number
  createdAt: string; uploadedBy?: { name: string }; site?: { name: string; code: string }
}

export interface Production {
  id: string; siteId: string; date: string; year: number
  productionMT: number; targetMT?: number; coalType?: string
  source?: string; sourceDoc?: string; sourcePage?: number
  site?: { name: string; code: string }
}

export interface TrendPoint   { year: number; productionMT: number; targetMT: number }
export interface ProductionSummary {
  year: number; totalProductionMT: number; totalTargetMT: number
  achievementPct: string | null; totalSites: number; totalDocuments: number
}

export interface Seam {
  id: string; siteId: string; seamName: string; thickness?: number; depth?: number
  gcv?: number; ashContent?: number; gradeDesignation?: string
  source?: string; sourceDoc?: string; sourcePage?: number
  site?: { name: string; code: string }
}

export interface GeologicalData {
  id: string; siteId: string; formation?: string; blockName?: string
  seamCount?: number; totalThickness?: number; depth?: number
  faults?: string; strata?: string; source?: string; sourceDoc?: string
  site?: { name: string; code: string }
}

export interface GeologySummary {
  totalSeams: number; totalBlocks: number; sitesWithData: number; avgSeamThicknessMt?: string
}

export interface Reserve {
  id: string; siteId: string; blockName?: string; category?: string
  totalReserveMT?: number | null; mineableReserveMT?: number | null
  gradeDesignation?: string; verificationStatus?: string
  source?: string; sourceDoc?: string; sourcePage?: number
  site?: { name: string; code: string; state?: string }
}

export interface ReserveSummary {
  totalRecords: number; totalReserveMT: number | string; mineableReserveMT: number | string
  verified: number; pending: number; insufficient: number
}

export interface Machine {
  id: string; siteId: string; machineId: string; name: string; type: string
  make?: string; model?: string; status: string; hoursOperated?: number
  site?: { name: string; code: string }
  maintenance?: Maintenance[]; telemetry?: Telemetry[]
  _count?: { maintenance: number }
}

export interface MachinerySummary {
  total: number; operational: number; breakdown: number; maintenance: number; idle: number; utilizationPct: number
}

export interface Maintenance {
  id: string; type: string; description?: string; startDate: string
  endDate?: string; duration?: number; technician?: string; cost?: number; status: string
}

export interface Telemetry {
  id: string; recordedAt: string; fuelLevel?: number; engineTemp?: number
  oilPressure?: number; rpm?: number; hoursToday?: number; speed?: number; status?: string
}

export interface EnvRecord {
  id: string; siteId: string; monitoringDate: string; paramType: string
  parameter: string; value?: number; unit?: string; standard?: number
  compliant?: boolean; observation?: string; source?: string; sourceDoc?: string
  site?: { name: string; code: string }
}

export interface ComplianceSummary {
  total: number; compliant: number; nonCompliant: number; complianceRate: number
  byType: { paramType: string; _count: { id: number } }[]
}

export interface Report {
  id: string; title: string; type: string; department: string; period?: string
  summary?: string; content?: Record<string, unknown>; status: string
  createdAt: string; generatedBy?: { name: string }; site?: { name: string; code: string }
}

export interface GenerateReportData {
  title: string; type: string; department: string
  siteId?: string; period?: string; documentIds?: string[]
}

export interface RiskItem {
  id: string; title: string; category: string; severity: number
  likelihood: number; level: string; trend: string; owner?: string
  description?: string; controls?: string[]; recommendedAction?: string
  status: string; source?: string; site?: { name: string; code: string }
}

export interface RiskSummary {
  total: number; critical: number; high: number; medium: number; low: number; avgScore?: number
}

export interface QueryResult {
  question: string; intent: string; answer: string
  data?: Record<string, unknown> | null; chartType?: string | null
  sources: { doc?: string; page?: number; source?: string }[]
  confidence: number; disclaimer: string
}

export interface OfficialQueryData {
  question: string; mineName?: string; fromYear?: number; toYear?: number; dataType?: string
}

export interface OfficialQueryResult {
  question: string; siteName: string; fromYear: number; toYear: number
  answer: string; trend: TrendPoint[]; chartType: string
  sources: { doc?: string; page?: number }[]; confidence: number; exportable: boolean
}

export interface AdminStats {
  users: number; docs: number; reports: number; sites: number
  openRisks: number; recentActivity: AuditLog[]
}

export interface AuditLog {
  id: string; action: string; entity?: string; createdAt: string
  user?: { name: string; email: string; role: string }
}

// ── Knowledge Base ─────────────────────────────────────────────────────
export const knowledgeApi = {
  list:        (params?: Record<string, string>) =>
    request<{ entries: KnowledgeEntry[]; total: number }>(`/knowledge${qs(params)}`),
  summary:     (params?: Record<string, string>) =>
    request<KnowledgeSummary>(`/knowledge/summary${qs(params)}`),
  search:      (q: string, params?: Record<string, string>) =>
    request<{ results: KnowledgeEntry[]; total: number; query: string }>(
      `/knowledge/search${qs({ q, ...params })}`
    ),
  forDocument: (docId: string) =>
    request<{ entries: KnowledgeEntry[]; total: number }>(`/knowledge/document/${docId}`),
  trend:       (fieldName: string, params?: Record<string, string>) =>
    request<{ fieldName: string; series: TrendSeries[] }>(`/knowledge/trend${qs({ fieldName, ...params })}`),
  delete:      (id: string) => request(`/knowledge/${id}`, { method: 'DELETE' }),
}

export interface KnowledgeEntry {
  id:          string
  documentId:  string
  siteId?:     string
  department:  string
  fieldName:   string
  fieldValue:  string
  confidence?: number
  sourcePage?: number
  extractedAt: string
  document?:   { originalName: string; status?: string; createdAt?: string }
  site?:       { name: string; code: string }
}

export interface KnowledgeSummary {
  total:           number
  byDepartment:    { department: string; _count: { id: number } }[]
  topFields:       { fieldName: string; _count: { id: number } }[]
  recentDocuments: { id: string; originalName: string; department: string; updatedAt: string }[]
}

export interface TrendSeries {
  date:       string
  value:      number | string
  fieldValue: string
  source:     string
  site?:      string | null
  confidence: number
}

// ── Report Validation ──────────────────────────────────────────────────
export const validateApi = {
  analyze: (reportId: string) =>
    request<{ reportId: string; analysis: AiAnalysis }>(`/validate/${reportId}`, { method: 'POST' }),
  get: (reportId: string) =>
    request<{ report: Report; analysis: AiAnalysis | null }>(`/validate/${reportId}`),
  approve: (reportId: string, comment?: string) =>
    request<{ report: Report; message: string }>(`/validate/${reportId}/approve`, {
      method: 'POST', body: JSON.stringify({ comment }),
    }),
  reject: (reportId: string, reason: string) =>
    request<{ report: Report; message: string }>(`/validate/${reportId}/reject`, {
      method: 'POST', body: JSON.stringify({ reason }),
    }),
}

export interface AiAnalysis {
  score:          number
  issues:         { severity: 'critical'|'high'|'medium'|'low'; message: string }[]
  passes:         string[]
  recommendation: 'APPROVE'|'REVIEW'|'REJECT'
  summary:        string
}

// ── Human-in-the-Loop (HITL) ───────────────────────────────────────────
export const hitlApi = {
  submit:     (docId: string) =>
    request<HitlResult>(`/hitl/submit/${docId}`, { method: 'POST' }),
  get:        (docId: string) =>
    request<{ document: Document; hitl: HitlReview | null }>(`/hitl/${docId}`),
  pending:    () =>
    request<{ documents: HitlPendingDoc[]; total: number }>('/hitl/pending/all'),
  approveField:(docId: string, fieldName: string, comment?: string) =>
    request<HitlFieldResponse>(`/hitl/${docId}/field`, {
      method: 'PATCH',
      body: JSON.stringify({ fieldName, action: 'approve', comment }),
    }),
  correctField:(docId: string, fieldName: string, correctedValue: string, comment?: string) =>
    request<HitlFieldResponse>(`/hitl/${docId}/field`, {
      method: 'PATCH',
      body: JSON.stringify({ fieldName, action: 'correct', correctedValue, comment }),
    }),
  rejectField:(docId: string, fieldName: string, comment?: string) =>
    request<HitlFieldResponse>(`/hitl/${docId}/field`, {
      method: 'PATCH',
      body: JSON.stringify({ fieldName, action: 'reject', comment }),
    }),
  approveAll: (docId: string, comment?: string) =>
    request<{ status: string; message: string }>(`/hitl/${docId}/approve-all`, {
      method: 'PATCH',
      body: JSON.stringify({ comment }),
    }),
}

export interface HitlField {
  fieldName:    string
  fieldValue:   string
  confidence?:  number
  issue?:       string
  severity?:    'critical' | 'high' | 'medium' | 'low'
  requiresHuman?: boolean
}

export interface HitlFieldStatus {
  action:          'approve' | 'correct' | 'reject'
  correctedValue?: string | null
  comment?:        string
  reviewedBy:      string
  reviewedAt:      string
}

export interface HitlReview {
  submittedAt:   string
  submittedBy:   string
  verified:      HitlField[]
  exceptions:    HitlField[]
  score:         number
  status:        'NOT_SUBMITTED' | 'AUTO_VERIFIED' | 'HAS_EXCEPTIONS' | 'MINOR_EXCEPTIONS' | 'CRITICAL_EXCEPTION' | 'HUMAN_VERIFIED'
  fieldStatuses: Record<string, HitlFieldStatus>
  verifiedAt?:   string
  verifiedBy?:   string
}

export interface HitlResult {
  documentId:  string
  verified:    HitlField[]
  exceptions:  HitlField[]
  score:       number
  status:      string
  message:     string
}

export interface HitlFieldResponse {
  fieldName:         string
  action:            string
  hitlStatus:        string
  pendingExceptions: number
  message:           string
}

export interface HitlPendingDoc {
  id:             string
  originalName:   string
  department:     string | null
  uploadedBy:     string | null
  updatedAt:      string
  hitlStatus:     string
  hitlScore:      number | null
  exceptionCount: number
  isVerified:     boolean
}
