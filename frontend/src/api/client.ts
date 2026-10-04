const API_BASE_URL = 'http://localhost:8000';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('udyograth_token');
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    ...getHeaders(),
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request<any>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }),
  getDemoUsers: () => request<any[]>('/api/auth/demo-users'),
  getMe: () => request<any>('/api/auth/me'),

  // Enterprises
  listEnterprises: () => request<any[]>('/api/enterprises'),
  getEnterprise: (id: number) => request<any>(`/api/enterprises/${id}`),
  createEnterprise: (data: any) =>
    request<any>('/api/enterprises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Rules Engine
  getRulesMetadata: () => request<any>('/api/rules'),
  getCurrentRulesJson: () => request<any>('/api/rules/current-json'),
  evaluateApprovals: (enterpriseId: number) => request<any>(`/api/rules/evaluate/${enterpriseId}`),
  saveRuleVersion: (data: any) =>
    request<any>('/api/rules/save-version', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  testRuleSandbox: (data: any) =>
    request<any>('/api/rules/test-sandbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Documents & Readiness
  listDocuments: (enterpriseId: number) => request<any[]>(`/api/documents/enterprise/${enterpriseId}`),
  getReadiness: (enterpriseId: number) => request<any>(`/api/documents/readiness/${enterpriseId}`),
  uploadDocument: (formData: FormData) =>
    request<any>('/api/documents/upload', {
      method: 'POST',
      body: formData
    }),
  updateExtractedFields: (data: any) =>
    request<any>('/api/documents/update-extracted-fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  seedSampleDocuments: (enterpriseId: number) =>
    request<any>(`/api/documents/seed-samples-for-enterprise/${enterpriseId}`, {
      method: 'POST'
    }),

  // Applications
  listApplications: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/api/applications${query ? `?${query}` : ''}`);
  },
  getApplicationDetail: (idOrRef: string) => request<any>(`/api/applications/${idOrRef}`),
  submitBatchApplications: (data: any) =>
    request<any>('/api/applications/submit-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  officerAction: (idOrRef: string, data: any) =>
    request<any>(`/api/applications/${idOrRef}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  getCertificateUrl: (idOrRef: string) => `${API_BASE_URL}/api/applications/${idOrRef}/certificate`,

  // Queries
  raiseQuery: (data: any) =>
    request<any>('/api/queries/raise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  respondQuery: (ticketId: number, data: any) =>
    request<any>(`/api/queries/${ticketId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Joint Inspections
  listInspections: (enterpriseId?: number) =>
    request<any[]>(`/api/inspections${enterpriseId ? `?enterprise_id=${enterpriseId}` : ''}`),
  getInspectionCalendar: () => request<any[]>('/api/inspections/calendar'),
  consolidateInspections: (enterpriseId: number) =>
    request<any>(`/api/inspections/consolidate/${enterpriseId}`, { method: 'POST' }),
  proposeInspectionSlot: (id: number, data: any) =>
    request<any>(`/api/inspections/${id}/propose-slot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  confirmInspection: (id: number, data: any) =>
    request<any>(`/api/inspections/${id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  logInspectionFindings: (id: number, data: any) =>
    request<any>(`/api/inspections/${id}/attendance-finding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Incentives
  getAllSchemes: () => request<any[]>('/api/incentives/all-schemes'),
  getEligibleSchemes: (enterpriseId: number) => request<any>(`/api/incentives/eligible/${enterpriseId}`),
  applyForScheme: (data: any) =>
    request<any>('/api/incentives/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  getMySchemeApplications: (enterpriseId: number) => request<any[]>(`/api/incentives/my-applications/${enterpriseId}`),

  // Knowledge Centre Assistant
  askAssistant: (query: string) =>
    request<any>('/api/assistant/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    }),
  getPassages: () => request<any[]>('/api/assistant/passages'),

  // Grievances
  listGrievances: (enterpriseId?: number) =>
    request<any[]>(`/api/grievances${enterpriseId ? `?enterprise_id=${enterpriseId}` : ''}`),
  raiseGrievance: (data: any) =>
    request<any>('/api/grievances/raise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  officerGrievanceAction: (id: number, data: any) =>
    request<any>(`/api/grievances/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Analytics
  getMaitriAnalytics: () => request<any>('/api/analytics/maitri-summary'),
  getCsvExportUrl: (metric: string) => `${API_BASE_URL}/api/analytics/export-csv/${metric}`,

  // Audit Trail
  getAuditLogs: (limit = 50) => request<any[]>(`/api/audit/logs?limit=${limit}`),
  verifyAuditChain: () => request<any>('/api/audit/verify'),

  // Notifications
  listNotifications: (channel?: string) =>
    request<any[]>(`/api/notifications${channel ? `?channel=${channel}` : ''}`),
  markNotificationRead: (id: number) => request<any>(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request<any>('/api/notifications/mark-all-read', { method: 'POST' }),

  // Demo Controls
  getDemoClock: () => request<any>('/api/demo/clock'),
  advanceDemoClock: (days: number) =>
    request<any>('/api/demo/clock/advance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days })
    }),
  resetDemoData: () => request<any>('/api/demo/reset', { method: 'POST' }),
  getTourScenario: () => request<any>('/api/demo/tour-scenario')
};
