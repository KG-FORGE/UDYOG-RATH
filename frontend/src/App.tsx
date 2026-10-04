import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n/useTranslation';
import { Layout } from './components/Layout/Layout';

// Pages
import { HomePage } from './pages/Home/HomePage';
import { LoginPage } from './pages/Login/LoginPage';
import { WizardPage } from './pages/Wizard/WizardPage';
import { ApprovalsPage } from './pages/Approvals/ApprovalsPage';
import { DocumentsPage } from './pages/Documents/DocumentsPage';
import { ApplicationsPage } from './pages/Applications/ApplicationsPage';
import ApplicationDetailPage from './pages/Applications/ApplicationDetailPage';
import OfficerWorkbenchPage from './pages/OfficerWorkbench/OfficerWorkbenchPage';
import InspectionsPage from './pages/Inspections/InspectionsPage';
import IncentivesPage from './pages/Incentives/IncentivesPage';
import KnowledgeCentrePage from './pages/KnowledgeCentre/KnowledgeCentrePage';
import GrievancePage from './pages/Grievance/GrievancePage';
import AdminAnalyticsPage from './pages/AdminAnalytics/AdminAnalyticsPage';
import AuditTrailPage from './pages/AuditTrail/AuditTrailPage';
import RulesManagementPage from './pages/RulesManagement/RulesManagementPage';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import ProjectInfoPage from './pages/ProjectInfo/ProjectInfoPage';

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="wizard" element={<WizardPage />} />
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="applications/:refNo" element={<ApplicationDetailPage />} />
            <Route path="workbench" element={<OfficerWorkbenchPage />} />
            <Route path="officer" element={<Navigate to="/workbench" replace />} />
            <Route path="inspections" element={<InspectionsPage />} />
            <Route path="incentives" element={<IncentivesPage />} />
            <Route path="assistant" element={<KnowledgeCentrePage />} />
            <Route path="knowledge" element={<Navigate to="/assistant" replace />} />
            <Route path="grievance" element={<GrievancePage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="audit" element={<AuditTrailPage />} />
            <Route path="rules" element={<RulesManagementPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="project-info" element={<ProjectInfoPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}
