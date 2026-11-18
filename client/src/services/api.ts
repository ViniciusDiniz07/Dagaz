const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders(isFormData = false): HeadersInit {
  const token = localStorage.getItem('dagaz_token');
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...getAuthHeaders(isFormData),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('dagaz_token');
    localStorage.removeItem('dagaz_user');
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || 'Erro na requisição ao servidor';
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Autenticação
  login: (email: string, password: string, rememberMe = false) =>
    request<{ token: string; user: any; expiresIn: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    }),

  getProfile: () => request<{ user: any }>('/auth/me'),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; supportEmail: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Dashboard & Relatórios
  getDashboardStats: (period = 'hoje') =>
    request<any>(`/reports/dashboard?period=${period}`),

  exportReport: (format = 'pdf') =>
    request<any>(`/reports/export?format=${format}`),

  // Alunos & Matrículas
  listStudents: (params: { q?: string; modality?: string; status?: string; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.modality) query.set('modality', params.modality);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return request<{ students: any[]; pagination: any }>(`/students?${query.toString()}`);
  },

  getStudentById: (id: string) => request<any>(`/students/${id}`),

  createStudent: (studentData: any) =>
    request<any>('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    }),

  updateStudent: (id: string, studentData: any) =>
    request<any>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    }),

  deleteStudent: (id: string) =>
    request<any>(`/students/${id}`, {
      method: 'DELETE',
    }),

  // Matrículas
  listEnrollments: () => request<{ enrollments: any[] }>('/enrollments'),

  updateEnrollmentStatus: (id: string, status: string, observacoes?: string) =>
    request<any>(`/enrollments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, observacoes }),
    }),

  reactivateEnrollment: (id: string) =>
    request<any>(`/enrollments/${id}/reactivate`, {
      method: 'POST',
    }),

  // Modalidades & Turmas
  listSports: () => request<{ sports: any[] }>('/sports'),
  listClasses: (sportId?: string) =>
    request<{ classes: any[] }>(`/sports/classes${sportId ? `?sportId=${sportId}` : ''}`),

  // Responsáveis
  searchGuardians: (q: string) => request<{ guardians: any[] }>(`/guardians?q=${encodeURIComponent(q)}`),
  getGuardianById: (id: string) => request<any>(`/guardians/${id}`),

  // OCR & Gemini AI
  extractDocument: (file: File) => {
    const formData = new FormData();
    formData.append('documento', file);
    return request<any>('/ocr/extract', {
      method: 'POST',
      body: formData,
    });
  },

  confirmDocumentOCR: (id: string, dadosRevisados: any, notas?: string) =>
    request<any>(`/ocr/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ dadosRevisados, notas }),
    }),

  rejectDocumentOCR: (id: string) =>
    request<any>(`/ocr/${id}/reject`, {
      method: 'POST',
    }),

  // Auditoria
  listAuditLogs: () => request<{ logs: any[] }>('/audit'),
};
