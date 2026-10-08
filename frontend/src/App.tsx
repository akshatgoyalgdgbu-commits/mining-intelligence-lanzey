/**
 * LANZEY App Router — clean, no duplicates.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PageTransition }  from './components/common/PageTransition'
import { ProtectedRoute }  from './components/common/ProtectedRoute'
import { AppLayout }       from './components/layout/AppLayout'

// Public
import { LandingPage }     from './pages/LandingPage'
import { LoginPage }       from './pages/LoginPage'
import { RoleSelectPage }  from './pages/RoleSelectPage'

// App pages
import { DashboardPage }          from './pages/DashboardPage'
import { DocumentProcessingPage } from './pages/DocumentProcessingPage'
import { OcrResultPage }          from './pages/OcrResultPage'
import { HitlReviewPage }         from './pages/HitlReviewPage'
import { AskLanzeyPage }          from './pages/AskLanzeyPage'
import { RiskIntelligencePage }   from './pages/RiskIntelligencePage'
import { ReportGeneratorPage }    from './pages/ReportGeneratorPage'
import { ReportValidationPage }   from './pages/ReportValidationPage'
import { KnowledgeBasePage }      from './pages/KnowledgeBasePage'
import { OfficialQueryPage }      from './pages/OfficialQueryPage'
import { AuditTrailPage }         from './pages/AuditTrailPage'

// Department dashboards
import { CILDashboard }           from './pages/departments/CILDashboard'
import { CMPDIDashboard }         from './pages/departments/CMPDIDashboard'
import { GeologicalDashboard }    from './pages/departments/GeologicalDashboard'
import { EnvironmentalDashboard } from './pages/departments/EnvironmentalDashboard'
import { MachineryDashboard }     from './pages/departments/MachineryDashboard'
import { ReserveDashboard }       from './pages/departments/ReserveDashboard'
import { AdminDashboard }         from './pages/departments/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <PageTransition>
        <Routes>
          {/* ── Public ── */}
          <Route path="/"            element={<LandingPage />} />
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/select-role" element={<ProtectedRoute><RoleSelectPage /></ProtectedRoute>} />

          {/* ── Authenticated shell ── */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard"             element={<DashboardPage />} />
            <Route path="/documents"             element={<DocumentProcessingPage />} />
            <Route path="/processing"            element={<DocumentProcessingPage />} />
            <Route path="/ocr-results"           element={<OcrResultPage />} />
            <Route path="/hitl"                  element={<HitlReviewPage />} />
            <Route path="/hitl/:docId"           element={<HitlReviewPage />} />
            <Route path="/knowledge"             element={<KnowledgeBasePage />} />
            <Route path="/ask"                   element={<AskLanzeyPage />} />
            <Route path="/risk"                  element={<RiskIntelligencePage />} />
            <Route path="/reports/generate"      element={<ReportGeneratorPage />} />
            <Route path="/reports/validate/:id"  element={<ReportValidationPage />} />
            <Route path="/query/official"        element={<OfficialQueryPage />} />
            <Route path="/audit"                 element={<AuditTrailPage />} />
            <Route path="/settings"              element={
              <div className="p-8 text-[#6b7280] text-sm">Settings — coming soon.</div>
            } />

            {/* Department dashboards */}
            <Route path="/dashboard/cil"         element={<ProtectedRoute roles={['CIL','ADMIN']}><CILDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/cmpdi"       element={<ProtectedRoute roles={['CMPDI','ADMIN']}><CMPDIDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/geological"  element={<ProtectedRoute roles={['GEOLOGICAL','ADMIN','CMPDI']}><GeologicalDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/environment" element={<ProtectedRoute roles={['ENVIRONMENT','ADMIN']}><EnvironmentalDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/machinery"   element={<ProtectedRoute roles={['MACHINERY','ADMIN','CIL']}><MachineryDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/reserve"     element={<ProtectedRoute roles={['RESERVE_CHECKER','ADMIN','GEOLOGICAL','CMPDI']}><ReserveDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/admin"       element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </BrowserRouter>
  )
}
