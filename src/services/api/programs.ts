import api from './config';

export const programsApi = {
  getAll: () => api.get('/programs'),
  getById: (id: string) => api.get(`/programs/${id}`),
  create: (data: any) => api.post('/programs', data),
  update: (id: string, data: any) => api.put(`/programs/${id}`, data),
  delete: (id: string) => api.delete(`/programs/${id}`),
  getSubjects: (q?: string) => api.get(`/programs/subjects`, { params: { q, limit: 5 } }),
};
